import { useSyncExternalStore } from "react";

import {
  insererProduit,
  listerProduits,
  majChampsProduit,
  majProduit,
  supprimerProduitDb,
} from "@/lib/db/catalogue";
import { signalerErreur } from "@/lib/db/errors";

import { achatsDemo, mouvementsDemo, ventesDemo } from "./demo-data";
import type { LigneHistorique, MouvementStock, Produit, ProduitFormValues } from "./types";

/**
 * Store du module Produits.
 * Les produits sont persistés dans Supabase (RLS par entreprise) ; l'état local
 * sert de cache réactif mis à jour de façon optimiste puis confirmé par la base.
 */

type State = {
  produits: Produit[];
  mouvements: MouvementStock[];
  ventes: LigneHistorique[];
  achats: LigneHistorique[];
  chargement: boolean;
  erreur: string | null;
};

let state: State = {
  produits: [],
  mouvements: mouvementsDemo,
  ventes: ventesDemo,
  achats: achatsDemo,
  chargement: true,
  erreur: null,
};

const listeners = new Set<() => void>();

function setState(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

let hydratation: Promise<void> | null = null;

/** Charge les produits depuis Supabase (une seule fois, puis à la demande). */
export function chargerProduits(force = false): Promise<void> {
  if (hydratation && !force) return hydratation;
  hydratation = (async () => {
    setState({ chargement: true, erreur: null });
    try {
      const produits = await listerProduits();
      setState({ produits, chargement: false });
    } catch (erreur) {
      setState({ chargement: false, erreur: (erreur as Error).message });
      signalerErreur("Chargement des produits impossible", erreur);
    }
  })();
  return hydratation;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  void chargerProduits();
  return () => listeners.delete(listener);
}

const getSnapshot = () => state;

export function useProductsStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useProduit(id: string) {
  const { produits } = useProductsStore();
  return produits.find((p) => p.id === id) ?? null;
}


const nouvelId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function ajouterProduit(values: ProduitFormValues): Produit {
  const now = new Date().toISOString();
  const produit: Produit = {
    ...values,
    id: nouvelId(),
    dateAjout: now,
    dateModification: now,
  };
  setState({ produits: [produit, ...state.produits] });

  insererProduit(produit.id, values)
    .then(() => chargerProduits(true))
    .catch((erreur) => {
      setState({ produits: state.produits.filter((p) => p.id !== produit.id) });
      signalerErreur("Enregistrement du produit impossible", erreur);
    });

  if (produit.stock > 0) {
    enregistrerMouvement({
      produitId: produit.id,
      type: "entree",
      quantite: produit.stock,
      observation: "Stock initial à la création",
    });
  }
  return produit;
}

export function modifierProduit(id: string, values: ProduitFormValues) {
  const precedent = state.produits.find((p) => p.id === id);
  setState({
    produits: state.produits.map((p) =>
      p.id === id ? { ...p, ...values, dateModification: new Date().toISOString() } : p,
    ),
  });

  majProduit(id, values).catch((erreur) => {
    if (precedent) {
      setState({ produits: state.produits.map((p) => (p.id === id ? precedent : p)) });
    }
    signalerErreur("Mise à jour du produit impossible", erreur);
  });

  if (precedent && precedent.stock !== values.stock) {
    const delta = values.stock - precedent.stock;
    enregistrerMouvement({
      produitId: id,
      type: delta > 0 ? "entree" : "sortie",
      quantite: Math.abs(delta),
      observation: "Ajustement manuel de la fiche produit",
    });
  }
}

export function dupliquerProduit(id: string): Produit | null {
  const source = state.produits.find((p) => p.id === id);
  if (!source) return null;
  const now = new Date().toISOString();
  const valeurs: ProduitFormValues = {
    ...source,
    nom: `${source.nom} (copie)`,
    codeBarres: `${source.codeBarres.slice(0, 12)}${Math.floor(Math.random() * 10)}`,
  };
  const copie: Produit = { ...valeurs, id: nouvelId(), dateAjout: now, dateModification: now };
  setState({ produits: [copie, ...state.produits] });

  insererProduit(copie.id, valeurs)
    .then(() => chargerProduits(true))
    .catch((erreur) => {
      setState({ produits: state.produits.filter((p) => p.id !== copie.id) });
      signalerErreur("Duplication du produit impossible", erreur);
    });

  return copie;
}

export function supprimerProduit(id: string) {
  const precedent = state.produits;
  setState({ produits: state.produits.filter((p) => p.id !== id) });
  supprimerProduitDb(id).catch((erreur) => {
    setState({ produits: precedent });
    signalerErreur("Suppression du produit impossible", erreur);
  });
}

export function basculerActivation(id: string) {
  const produit = state.produits.find((p) => p.id === id);
  if (!produit) return;
  const actif = !produit.actif;
  setState({
    produits: state.produits.map((p) =>
      p.id === id ? { ...p, actif, dateModification: new Date().toISOString() } : p,
    ),
  });
  majChampsProduit(id, { actif }).catch((erreur) => {
    setState({
      produits: state.produits.map((p) => (p.id === id ? { ...p, actif: !actif } : p)),
    });
    signalerErreur("Modification du statut impossible", erreur);
  });
}


/** Persiste dans Supabase les stocks modifiés localement (réception, vente, inventaire). */
function persisterStocks(nouveaux: Produit[]): Produit[] {
  const avant = new Map(state.produits.map((p) => [p.id, p]));
  for (const produit of nouveaux) {
    const precedent = avant.get(produit.id);
    if (!precedent) continue;
    const champs: { stock?: number; prix_achat?: number; prix_vente?: number } = {};
    if (precedent.stock !== produit.stock) champs.stock = produit.stock;
    if (precedent.prixAchat !== produit.prixAchat) champs.prix_achat = produit.prixAchat;
    if (precedent.prixVente !== produit.prixVente) champs.prix_vente = produit.prixVente;
    if (Object.keys(champs).length === 0) continue;
    majChampsProduit(produit.id, champs).catch((erreur) =>
      signalerErreur("Mise à jour du stock impossible", erreur),
    );
  }
  return nouveaux;
}

export function enregistrerMouvement(input: {
  produitId: string;
  type: MouvementStock["type"];
  quantite: number;
  observation: string;
  utilisateur?: string;
}) {
  const mouvement: MouvementStock = {
    id: `M-${Date.now()}`,
    produitId: input.produitId,
    date: new Date().toISOString(),
    type: input.type,
    utilisateur: input.utilisateur ?? "Bekaye Sora",
    quantite: input.quantite,
    observation: input.observation,
  };
  setState({ mouvements: [mouvement, ...state.mouvements] });
}

/* ------------------------------------------------------------------ */
/* Réceptions fournisseurs (module Entrées de stock)                    */
/* ------------------------------------------------------------------ */

export type LigneReception = {
  produitId: string;
  quantite: number;
  prixAchat: number;
  prixVente: number;
  dateExpiration: string | null;
};

export type MetaReception = {
  reference: string;
  fournisseur: string;
  utilisateur: string;
  date: string;
};

/** Applique une réception : stock +, prix mis à jour, mouvements et achats historisés. */
export function appliquerReception(lignes: LigneReception[], meta: MetaReception) {
  const produits = state.produits.map((produit) => {
    const ligne = lignes.find((l) => l.produitId === produit.id);
    if (!ligne) return produit;
    return {
      ...produit,
      stock: produit.stock + ligne.quantite,
      prixAchat: ligne.prixAchat || produit.prixAchat,
      prixVente: ligne.prixVente || produit.prixVente,
      dateExpiration: ligne.dateExpiration ?? produit.dateExpiration,
      dateModification: new Date().toISOString(),
    };
  });

  const mouvements: MouvementStock[] = lignes.map((ligne, index) => ({
    id: `M-${Date.now()}-${index}`,
    produitId: ligne.produitId,
    date: meta.date,
    type: "entree",
    utilisateur: meta.utilisateur,
    quantite: ligne.quantite,
    observation: `Réception ${meta.reference} — ${meta.fournisseur}`,
  }));

  const achats: LigneHistorique[] = lignes.map((ligne, index) => ({
    id: `A-${meta.reference}-${index}`,
    produitId: ligne.produitId,
    date: meta.date,
    reference: meta.reference,
    tiers: meta.fournisseur,
    quantite: ligne.quantite,
    montant: ligne.quantite * ligne.prixAchat,
  }));

  setState({
    produits: persisterStocks(produits),
    mouvements: [...mouvements, ...state.mouvements],
    achats: [...achats, ...state.achats],
  });
}

/** Annule l'effet d'une réception (suppression ou modification d'une entrée). */
export function annulerReception(lignes: LigneReception[], meta: MetaReception) {
  const produits = state.produits.map((produit) => {
    const ligne = lignes.find((l) => l.produitId === produit.id);
    if (!ligne) return produit;
    return {
      ...produit,
      stock: Math.max(0, produit.stock - ligne.quantite),
      dateModification: new Date().toISOString(),
    };
  });

  const mouvements: MouvementStock[] = lignes.map((ligne, index) => ({
    id: `M-${Date.now()}-annul-${index}`,
    produitId: ligne.produitId,
    date: new Date().toISOString(),
    type: "sortie",
    utilisateur: meta.utilisateur,
    quantite: ligne.quantite,
    observation: `Annulation de la réception ${meta.reference}`,
  }));

  setState({
    produits: persisterStocks(produits),
    mouvements: [...mouvements, ...state.mouvements],
    achats: state.achats.filter((a) => a.reference !== meta.reference),
  });
}

/* ------------------------------------------------------------------ */
/* Ventes (module Ventes & Caisse)                                      */
/* ------------------------------------------------------------------ */

export type LigneVenteProduit = { produitId: string; quantite: number; montant: number };

export type MetaVente = {
  reference: string;
  client: string;
  utilisateur: string;
  date: string;
};

/** Applique une vente : stock -, mouvements de sortie et historique des ventes. */
export function appliquerVente(lignes: LigneVenteProduit[], meta: MetaVente) {
  const produits = state.produits.map((produit) => {
    const ligne = lignes.find((l) => l.produitId === produit.id);
    if (!ligne) return produit;
    return {
      ...produit,
      stock: Math.max(0, produit.stock - ligne.quantite),
      dateModification: new Date().toISOString(),
    };
  });

  const mouvements: MouvementStock[] = lignes.map((ligne, index) => ({
    id: `M-${Date.now()}-v${index}`,
    produitId: ligne.produitId,
    date: meta.date,
    type: "sortie",
    utilisateur: meta.utilisateur,
    quantite: ligne.quantite,
    observation: `Vente ${meta.reference} — ${meta.client}`,
  }));

  const ventes: LigneHistorique[] = lignes.map((ligne, index) => ({
    id: `V-${meta.reference}-${index}`,
    produitId: ligne.produitId,
    date: meta.date,
    reference: meta.reference,
    tiers: meta.client,
    quantite: ligne.quantite,
    montant: ligne.montant,
  }));

  setState({
    produits: persisterStocks(produits),
    mouvements: [...mouvements, ...state.mouvements],
    ventes: [...ventes, ...state.ventes],
  });
}

/** Réintègre le stock (annulation d'une vente ou retour produit). */
export function retournerVente(
  lignes: LigneVenteProduit[],
  meta: MetaVente & { motif: string },
) {
  const produits = state.produits.map((produit) => {
    const ligne = lignes.find((l) => l.produitId === produit.id);
    if (!ligne) return produit;
    return {
      ...produit,
      stock: produit.stock + ligne.quantite,
      dateModification: new Date().toISOString(),
    };
  });

  const mouvements: MouvementStock[] = lignes.map((ligne, index) => ({
    id: `M-${Date.now()}-r${index}`,
    produitId: ligne.produitId,
    date: meta.date,
    type: "entree",
    utilisateur: meta.utilisateur,
    quantite: ligne.quantite,
    observation: `${meta.motif} — vente ${meta.reference}`,
  }));

  setState({ produits: persisterStocks(produits), mouvements: [...mouvements, ...state.mouvements] });
}

/* ------------------------------------------------------------------ */
/* Inventaire (module Inventaire Intelligent)                           */
/* ------------------------------------------------------------------ */

export type LigneAjustementInventaire = { produitId: string; stockPhysique: number };

export type MetaInventaire = { reference: string; utilisateur: string; date: string };

/** Corrige le stock système selon les quantités comptées et historise chaque écart. */
export function appliquerInventaire(
  lignes: LigneAjustementInventaire[],
  meta: MetaInventaire,
) {
  const mouvements: MouvementStock[] = [];

  const produits = state.produits.map((produit) => {
    const ligne = lignes.find((l) => l.produitId === produit.id);
    if (!ligne) return produit;
    const delta = ligne.stockPhysique - produit.stock;
    if (delta === 0) return produit;
    mouvements.push({
      id: `M-${Date.now()}-i${mouvements.length}`,
      produitId: produit.id,
      date: meta.date,
      type: delta > 0 ? "entree" : "sortie",
      utilisateur: meta.utilisateur,
      quantite: Math.abs(delta),
      observation: `Ajustement inventaire ${meta.reference}`,
    });
    return {
      ...produit,
      stock: Math.max(0, ligne.stockPhysique),
      dateModification: new Date().toISOString(),
    };
  });

  setState({ produits: persisterStocks(produits), mouvements: [...mouvements, ...state.mouvements] });
  return mouvements.length;
}

export const lireProduits = () => state.produits;
export const lireMouvements = () => state.mouvements;
export const lireVentesProduits = () => state.ventes;


