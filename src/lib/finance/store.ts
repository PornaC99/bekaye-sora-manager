import { useSyncExternalStore } from "react";

import { publier } from "@/lib/core/notifications";

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
  publier({
    module: "finances",
    ton: notification.ton,
    titre: notification.titre,
    message: notification.message,
  });
}

/* ------------------------------------------------------------------ */
/* Liaisons automatiques avec les autres modules                        */
/* ------------------------------------------------------------------ */

const dansNJours = (jours: number) =>
  new Date(Date.now() + jours * 86_400_000).toISOString().slice(0, 10);

/** Crée automatiquement une créance client (vente partiellement encaissée). */
export function enregistrerCreanceClient(input: {
  clientId?: string | null;
  nom: string;
  montant: number;
  reference: string;
  date?: string;
  echeanceJours?: number;
}): Creance | null {
  if (input.montant <= 0) return null;
  const reference = `Réf. ${input.reference}`;
  if (state.creances.some((c) => c.observation.includes(reference))) return null;

  const creance: Creance = {
    id: `CR-${Date.now()}`,
    clientId: input.clientId ?? null,
    nom: input.nom,
    montant: Math.round(input.montant),
    date: input.date ?? new Date().toISOString(),
    echeance: dansNJours(input.echeanceJours ?? 15),
    regle: false,
    observation: `Reste à encaisser — ${reference}`,
  };
  setState({ creances: [creance, ...state.creances] });
  notifierFinance({
    ton: "alerte",
    titre: "Créance client créée",
    message: `${input.nom} · ${creance.montant.toLocaleString("fr-FR")} FCFA restant sur ${input.reference}.`,
  });
  return creance;
}

/** Crée automatiquement une dette fournisseur (commande réceptionnée non payée). */
export function enregistrerDetteFournisseur(input: {
  fournisseurId?: string | null;
  fournisseur: string;
  montant: number;
  reference: string;
  date?: string;
  echeanceJours?: number;
}): Dette | null {
  if (input.montant <= 0) return null;
  const reference = `Réf. ${input.reference}`;
  if (state.dettes.some((d) => d.observation.includes(reference))) return null;

  const dette: Dette = {
    id: `DT-${Date.now()}`,
    fournisseurId: input.fournisseurId ?? null,
    fournisseur: input.fournisseur,
    montant: Math.round(input.montant),
    date: input.date ?? new Date().toISOString(),
    echeance: dansNJours(input.echeanceJours ?? 30),
    regle: false,
    observation: `Commande réceptionnée — ${reference}`,
  };
  setState({ dettes: [dette, ...state.dettes] });
  notifierFinance({
    ton: "alerte",
    titre: "Dette fournisseur enregistrée",
    message: `${input.fournisseur} · ${dette.montant.toLocaleString("fr-FR")} FCFA à régler (${input.reference}).`,
  });
  return dette;
}

/** Enregistre une dépense générée par un autre module (perte, casse, achat…). */
export function enregistrerDepenseAutomatique(input: {
  libelle: string;
  montant: number;
  categorie: Depense["categorie"];
  source: Depense["source"];
  reference: string;
  responsable?: string;
  date?: string;
}): Depense | null {
  if (input.montant <= 0) return null;
  const reference = `Réf. ${input.reference}`;
  if (state.depenses.some((d) => d.description.includes(reference))) return null;

  const depense: Depense = {
    id: prochainIdDepense(),
    montant: Math.round(input.montant),
    categorie: input.categorie,
    date: input.date ?? new Date().toISOString(),
    modePaiement: "especes",
    description: `${input.libelle} — ${reference}`,
    responsable: input.responsable ?? "Système",
    statut: "payee",
    justificatif: null,
    source: input.source,
  };
  setState({ depenses: [depense, ...state.depenses] });
  return depense;
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
