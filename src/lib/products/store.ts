import { useSyncExternalStore } from "react";

import { achatsDemo, mouvementsDemo, produitsDemo, ventesDemo } from "./demo-data";
import type { LigneHistorique, MouvementStock, Produit, ProduitFormValues } from "./types";

/**
 * Store local du module Produits.
 * Isolé volontairement : le jour où Lovable Cloud est activé, il suffit de
 * remplacer les fonctions ci-dessous par des requêtes (mêmes signatures).
 */

type State = {
  produits: Produit[];
  mouvements: MouvementStock[];
  ventes: LigneHistorique[];
  achats: LigneHistorique[];
};

let state: State = {
  produits: produitsDemo,
  mouvements: mouvementsDemo,
  ventes: ventesDemo,
  achats: achatsDemo,
};

const listeners = new Set<() => void>();

function setState(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
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

function nextId() {
  const max = state.produits.reduce((acc, p) => {
    const n = Number(p.id.replace(/\D/g, ""));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `P-${String(max + 1).padStart(3, "0")}`;
}

export function ajouterProduit(values: ProduitFormValues): Produit {
  const now = new Date().toISOString();
  const produit: Produit = {
    ...values,
    id: nextId(),
    dateAjout: now,
    dateModification: now,
  };
  setState({ produits: [produit, ...state.produits] });
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
  const copie: Produit = {
    ...source,
    id: nextId(),
    nom: `${source.nom} (copie)`,
    codeBarres: `${source.codeBarres.slice(0, 12)}${Math.floor(Math.random() * 10)}`,
    dateAjout: now,
    dateModification: now,
  };
  setState({ produits: [copie, ...state.produits] });
  return copie;
}

export function supprimerProduit(id: string) {
  setState({ produits: state.produits.filter((p) => p.id !== id) });
}

export function basculerActivation(id: string) {
  setState({
    produits: state.produits.map((p) =>
      p.id === id ? { ...p, actif: !p.actif, dateModification: new Date().toISOString() } : p,
    ),
  });
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
