import { useSyncExternalStore } from "react";

import { annulerReception, appliquerReception, type LigneReception } from "@/lib/products/store";
import { publier } from "@/lib/core/notifications";
import { entreesDemo } from "./demo-entries";
import type { EntreeFormValues, EntreeStock, EvenementEntree } from "./types";

/**
 * Store local du module Entrées de stock.
 * Isolé volontairement : lors de l'activation de Lovable Cloud, il suffira de
 * remplacer les fonctions ci-dessous par des requêtes (mêmes signatures).
 */

type State = { entrees: EntreeStock[] };

let state: State = { entrees: entreesDemo };

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

export function useEntreesStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useEntree(id: string) {
  const { entrees } = useEntreesStore();
  return entrees.find((e) => e.id === id) ?? null;
}

export const lireEntrees = () => state.entrees;

function nextNumero() {
  const max = state.entrees.reduce((acc, e) => {
    const n = Number(e.numero.split("-").pop());
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 1000);
  return `REC-${new Date().getFullYear()}-${max + 1}`;
}

function evenement(utilisateur: string, action: string): EvenementEntree {
  return {
    id: `H-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    date: new Date().toISOString(),
    utilisateur,
    action,
  };
}

const toReception = (entree: Pick<EntreeStock, "lignes">): LigneReception[] =>
  entree.lignes.map((l) => ({
    produitId: l.produitId,
    quantite: l.quantite,
    prixAchat: l.prixAchat,
    prixVente: l.prixVente,
    dateExpiration: l.dateExpiration,
  }));

export function ajouterEntree(values: EntreeFormValues): EntreeStock {
  const numero = nextNumero();
  const entree: EntreeStock = {
    ...values,
    id: `E-${Date.now()}`,
    numero,
    historique: [
      evenement(
        values.utilisateur,
        values.statut === "validee"
          ? "Création et validation de la réception"
          : "Enregistrement en brouillon",
      ),
    ],
  };
  setState({ entrees: [entree, ...state.entrees] });

  if (entree.statut === "validee") {
    appliquerReception(toReception(entree), {
      reference: entree.numero,
      fournisseur: entree.fournisseur,
      utilisateur: entree.utilisateur,
      date: entree.date,
    });
    publier({
      module: "stock",
      ton: "succes",
      titre: "Entrée de stock validée",
      message: `${entree.numero} · ${entree.fournisseur} · ${entree.lignes.length} produit(s) ajouté(s) au stock.`,
      lien: "/entrees-stock",
    });
  }
  return entree;
}

export function modifierEntree(id: string, values: EntreeFormValues) {
  const precedente = state.entrees.find((e) => e.id === id);
  if (!precedente) return;

  if (precedente.statut === "validee") {
    annulerReception(toReception(precedente), {
      reference: precedente.numero,
      fournisseur: precedente.fournisseur,
      utilisateur: values.utilisateur,
      date: precedente.date,
    });
  }

  const majAJour: EntreeStock = {
    ...precedente,
    ...values,
    historique: [
      ...precedente.historique,
      evenement(values.utilisateur, "Modification de la réception"),
    ],
  };
  setState({ entrees: state.entrees.map((e) => (e.id === id ? majAJour : e)) });

  if (majAJour.statut === "validee") {
    appliquerReception(toReception(majAJour), {
      reference: majAJour.numero,
      fournisseur: majAJour.fournisseur,
      utilisateur: majAJour.utilisateur,
      date: majAJour.date,
    });
  }
}

export function supprimerEntree(id: string) {
  const entree = state.entrees.find((e) => e.id === id);
  if (!entree) return;
  if (entree.statut === "validee") {
    annulerReception(toReception(entree), {
      reference: entree.numero,
      fournisseur: entree.fournisseur,
      utilisateur: entree.utilisateur,
      date: entree.date,
    });
  }
  setState({ entrees: state.entrees.filter((e) => e.id !== id) });
}

/** Lots déjà enregistrés pour un produit — alerte de doublon dans le formulaire. */
export function lotDejaUtilise(produitId: string, numeroLot: string, entreeId?: string) {
  const lot = numeroLot.trim().toLowerCase();
  if (!lot) return null;
  for (const entree of state.entrees) {
    if (entree.id === entreeId) continue;
    const ligne = entree.lignes.find(
      (l) => l.produitId === produitId && l.numeroLot.trim().toLowerCase() === lot,
    );
    if (ligne) return entree;
  }
  return null;
}
