import { useSyncExternalStore } from "react";

import type { FrequenceRapport, PlanificationRapport } from "./types";

/**
 * Store local des rapports automatiques planifiés.
 * L'envoi par email sera branché ultérieurement sur Lovable Cloud :
 * il suffira de remplacer ces fonctions par des appels de même signature.
 */

type State = { planifications: PlanificationRapport[] };

let state: State = {
  planifications: [
    {
      id: "RP-001",
      nom: "Rapport journalier des ventes",
      frequence: "quotidien",
      heure: "20:00",
      destinataires: ["direction@bekayesora.com"],
      format: "pdf",
      actif: true,
      dateCreation: new Date().toISOString(),
    },
    {
      id: "RP-002",
      nom: "Synthèse financière mensuelle",
      frequence: "mensuel",
      heure: "08:00",
      destinataires: ["direction@bekayesora.com", "comptabilite@bekayesora.com"],
      format: "excel",
      actif: true,
      dateCreation: new Date().toISOString(),
    },
  ],
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

export function useReportsStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const lirePlanifications = () => state.planifications;

export function ajouterPlanification(input: {
  nom: string;
  frequence: FrequenceRapport;
  heure: string;
  destinataires: string[];
  format: PlanificationRapport["format"];
}): PlanificationRapport {
  const planification: PlanificationRapport = {
    id: `RP-${String(state.planifications.length + 1).padStart(3, "0")}`,
    actif: true,
    dateCreation: new Date().toISOString(),
    ...input,
  };
  setState({ planifications: [planification, ...state.planifications] });
  return planification;
}

export function basculerPlanification(id: string) {
  setState({
    planifications: state.planifications.map((p) => (p.id === id ? { ...p, actif: !p.actif } : p)),
  });
}

export function supprimerPlanification(id: string) {
  setState({ planifications: state.planifications.filter((p) => p.id !== id) });
}
