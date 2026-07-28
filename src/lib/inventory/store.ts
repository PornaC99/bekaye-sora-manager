import { useSyncExternalStore } from "react";

import { appliquerInventaire, lireProduits } from "@/lib/products/store";
import { enregistrerDepenseAutomatique } from "@/lib/finance/store";
import { publier } from "@/lib/core/notifications";
import { inventairesDemo, lignesDepuisProduits } from "./demo-data";
import {
  ligneVerifiee,
  type Inventaire,
  type InventaireFormValues,
  type EvenementInventaire,
} from "./types";

/**
 * Store local du module Inventaire.
 * Isolé volontairement : lors de l'activation de Lovable Cloud, il suffira de
 * remplacer les fonctions ci-dessous par des requêtes (mêmes signatures).
 */

type State = { inventaires: Inventaire[] };

let state: State = { inventaires: inventairesDemo };

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

export function useInventairesStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useInventaire(id: string) {
  const { inventaires } = useInventairesStore();
  return inventaires.find((i) => i.id === id) ?? null;
}

export const lireInventaires = () => state.inventaires;

function nextNumero() {
  const max = state.inventaires.reduce((acc, i) => {
    const n = Number(i.numero.split("-").pop());
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `INV-${new Date().getFullYear()}-${String(max + 1).padStart(4, "0")}`;
}

function evenement(utilisateur: string, action: string): EvenementInventaire {
  return {
    id: `HI-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    date: new Date().toISOString(),
    utilisateur,
    action,
  };
}

function majInventaire(id: string, maj: (inv: Inventaire) => Inventaire) {
  setState({ inventaires: state.inventaires.map((i) => (i.id === id ? maj(i) : i)) });
}

/** Crée un inventaire pré-rempli avec l'intégralité du catalogue actif. */
export function creerInventaire(values: InventaireFormValues): Inventaire {
  const inventaire: Inventaire = {
    ...values,
    id: `I-${Date.now()}`,
    numero: nextNumero(),
    statut: "en_cours",
    signature: "",
    lignes: lignesDepuisProduits(lireProduits(), {}, false),
    historique: [evenement(values.responsable, "Création de l'inventaire")],
  };
  setState({ inventaires: [inventaire, ...state.inventaires] });
  return inventaire;
}

/** Saisie rapide du stock physique compté (null = non vérifié). */
export function saisirStockPhysique(id: string, ligneId: string, valeur: number | null) {
  majInventaire(id, (inv) => ({
    ...inv,
    lignes: inv.lignes.map((l) => (l.id === ligneId ? { ...l, stockPhysique: valeur } : l)),
  }));
}

export function commenterLigne(id: string, ligneId: string, commentaire: string) {
  majInventaire(id, (inv) => ({
    ...inv,
    lignes: inv.lignes.map((l) => (l.id === ligneId ? { ...l, commentaire } : l)),
  }));
}

export function terminerInventaire(id: string, signature?: string) {
  majInventaire(id, (inv) => ({
    ...inv,
    statut: inv.statut === "ajuste" ? "ajuste" : "termine",
    signature: signature || inv.signature || inv.responsable,
    historique: [...inv.historique, evenement(inv.responsable, "Comptage terminé")],
  }));
}

/** Applique les écarts constatés au stock système (produits, mouvements, valeur). */
export function ajusterStockDepuisInventaire(id: string) {
  const inventaire = state.inventaires.find((i) => i.id === id);
  if (!inventaire) return 0;

  const lignes = inventaire.lignes.filter(ligneVerifiee).map((l) => ({
    produitId: l.produitId,
    stockPhysique: l.stockPhysique as number,
  }));

  const corrections = appliquerInventaire(lignes, {
    reference: inventaire.numero,
    utilisateur: inventaire.responsable,
    date: new Date().toISOString(),
  });

  // Valorisation de l'écart : une perte constatée devient automatiquement une
  // dépense dans le module Finances (catégorie « Autres », source « stock »).
  const produits = lireProduits();
  const valeurEcart = inventaire.lignes.filter(ligneVerifiee).reduce((somme, l) => {
    const produit = produits.find((p) => p.id === l.produitId);
    if (!produit) return somme;
    return somme + ((l.stockPhysique as number) - l.stockTheorique) * produit.prixAchat;
  }, 0);

  if (valeurEcart < 0) {
    enregistrerDepenseAutomatique({
      libelle: `Perte sur inventaire ${inventaire.numero}`,
      montant: Math.abs(valeurEcart),
      categorie: "autres",
      source: "stock",
      reference: inventaire.numero,
      responsable: inventaire.responsable,
    });
  }

  publier({
    module: "inventaire",
    ton: valeurEcart < 0 ? "alerte" : "succes",
    titre: "Inventaire appliqué au stock",
    message:
      `${inventaire.numero} · ${corrections} produit(s) corrigé(s)` +
      (valeurEcart < 0
        ? ` · perte de ${Math.abs(Math.round(valeurEcart)).toLocaleString("fr-FR")} FCFA enregistrée en dépense.`
        : " · aucun écart de valeur défavorable."),
    lien: "/inventaire",
  });

  majInventaire(id, (inv) => ({
    ...inv,
    statut: "ajuste",
    lignes: inv.lignes.map((l) =>
      ligneVerifiee(l) ? { ...l, stockTheorique: l.stockPhysique as number } : l,
    ),
    historique: [
      ...inv.historique,
      evenement(
        inv.responsable,
        `Stock ajusté selon l'inventaire (${corrections} produit${corrections > 1 ? "s" : ""} corrigé${corrections > 1 ? "s" : ""})`,
      ),
    ],
  }));

  return corrections;
}

export function supprimerInventaire(id: string) {
  setState({ inventaires: state.inventaires.filter((i) => i.id !== id) });
}

/** Réinitialise les inventaires de démonstration. */
export function reinitialiserInventairesDemo() {
  setState({ inventaires: [] });
}
