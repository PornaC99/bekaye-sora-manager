import { useSyncExternalStore } from "react";

import { creancesDemo, depensesDemo, dettesDemo, objectifsDemo } from "./demo-data";
import type {
  Creance,
  Depense,
  DepenseFormValues,
  Dette,
  NotificationFinance,
  ObjectifsFinanciers,
} from "./types";

/**
 * Store local du module « Finances ».
 * Volontairement isolé : lors du branchement sur Lovable Cloud, il suffira de
 * remplacer les fonctions ci-dessous par des requêtes aux mêmes signatures.
 */

type State = {
  depenses: Depense[];
  creances: Creance[];
  dettes: Dette[];
  objectifs: ObjectifsFinanciers;
  notifications: NotificationFinance[];
};

let state: State = {
  depenses: depensesDemo,
  creances: creancesDemo,
  dettes: dettesDemo,
  objectifs: objectifsDemo,
  notifications: [],
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

export function useFinanceStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const lireDepenses = () => state.depenses;
export const lireCreances = () => state.creances;
export const lireDettes = () => state.dettes;
export const lireObjectifs = () => state.objectifs;

/* ------------------------------------------------------------------ */
/* Notifications                                                        */
/* ------------------------------------------------------------------ */

export function notifierFinance(notification: Omit<NotificationFinance, "id" | "date">) {
  const item: NotificationFinance = {
    ...notification,
    id: `NF-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    date: new Date().toISOString(),
  };
  setState({ notifications: [item, ...state.notifications].slice(0, 40) });
}

/* ------------------------------------------------------------------ */
/* Dépenses                                                             */
/* ------------------------------------------------------------------ */

function prochainIdDepense() {
  const max = state.depenses.reduce((acc, d) => {
    const n = Number(d.id.replace(/\D/g, ""));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `D-${String(max + 1).padStart(4, "0")}`;
}

export function ajouterDepense(values: DepenseFormValues): Depense {
  const depense: Depense = { ...values, id: prochainIdDepense(), source: "manuelle" };
  setState({ depenses: [depense, ...state.depenses] });
  return depense;
}

export function modifierDepense(id: string, values: DepenseFormValues) {
  setState({
    depenses: state.depenses.map((d) => (d.id === id ? { ...d, ...values } : d)),
  });
}

export function supprimerDepense(id: string) {
  setState({ depenses: state.depenses.filter((d) => d.id !== id) });
}

export function changerStatutDepense(id: string, statut: Depense["statut"]) {
  setState({
    depenses: state.depenses.map((d) => (d.id === id ? { ...d, statut } : d)),
  });
}

/* ------------------------------------------------------------------ */
/* Créances & dettes                                                    */
/* ------------------------------------------------------------------ */

export function basculerReglementCreance(id: string) {
  setState({
    creances: state.creances.map((c) => (c.id === id ? { ...c, regle: !c.regle } : c)),
  });
}

export function basculerReglementDette(id: string) {
  setState({
    dettes: state.dettes.map((d) => (d.id === id ? { ...d, regle: !d.regle } : d)),
  });
}

/* ------------------------------------------------------------------ */
/* Objectifs                                                            */
/* ------------------------------------------------------------------ */

export function enregistrerObjectifs(objectifs: ObjectifsFinanciers) {
  setState({ objectifs });
}
