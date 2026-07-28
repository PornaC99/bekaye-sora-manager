import { useSyncExternalStore } from "react";

import {
  MESSAGE_ACCUEIL,
  type MessageNexus,
  type ObjectifNexus,
  type ReponseNexus,
} from "./types";

/**
 * Store local du module « NEXUSIA Insight » (conversation + objectifs).
 * Volontairement isolé : lors du branchement sur Lovable Cloud, il suffira de
 * remplacer les fonctions ci-dessous par des requêtes aux mêmes signatures.
 */

type State = {
  messages: MessageNexus[];
  objectifs: ObjectifNexus[];
};

const identifiant = () => `nx-${Math.random().toString(36).slice(2, 10)}`;

const finDuMois = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
};

let state: State = {
  messages: [
    {
      id: "accueil",
      role: "assistant",
      date: new Date().toISOString(),
      texte: MESSAGE_ACCUEIL,
    },
  ],
  objectifs: [
    {
      id: "obj-ca",
      intitule: "Chiffre d'affaires mensuel",
      indicateur: "chiffreAffaires",
      cible: 4_500_000,
      echeance: finDuMois(),
    },
    {
      id: "obj-benefice",
      intitule: "Bénéfice net du mois",
      indicateur: "benefice",
      cible: 1_200_000,
      echeance: finDuMois(),
    },
    {
      id: "obj-clients",
      intitule: "Nouveaux clients fidélisés",
      indicateur: "clients",
      cible: 25,
      echeance: finDuMois(),
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

export function useNexusStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/* ------------------------------------------------------------------ */
/* Conversation                                                         */
/* ------------------------------------------------------------------ */

export function poserQuestion(question: string, reponse: ReponseNexus) {
  const maintenant = new Date().toISOString();
  setState({
    messages: [
      ...state.messages,
      { id: identifiant(), role: "directeur", date: maintenant, texte: question },
      {
        id: identifiant(),
        role: "assistant",
        date: maintenant,
        texte: reponse.texte,
        reponse,
      },
    ],
  });
}

export function reinitialiserConversation() {
  setState({
    messages: [
      {
        id: identifiant(),
        role: "assistant",
        date: new Date().toISOString(),
        texte: MESSAGE_ACCUEIL,
      },
    ],
  });
}

/* ------------------------------------------------------------------ */
/* Objectifs                                                            */
/* ------------------------------------------------------------------ */

export function ajouterObjectif(valeurs: Omit<ObjectifNexus, "id">) {
  setState({ objectifs: [...state.objectifs, { ...valeurs, id: identifiant() }] });
}

export function modifierObjectif(id: string, valeurs: Partial<Omit<ObjectifNexus, "id">>) {
  setState({
    objectifs: state.objectifs.map((o) => (o.id === id ? { ...o, ...valeurs } : o)),
  });
}

export function supprimerObjectif(id: string) {
  setState({ objectifs: state.objectifs.filter((o) => o.id !== id) });
}
