import { useSyncExternalStore } from "react";

import { appliquerVente, retournerVente } from "@/lib/products/store";
import { enregistrerAchatClient } from "@/lib/clients/store";
import { enregistrerCreanceClient } from "@/lib/finance/store";
import { publier } from "@/lib/core/notifications";
import { notificationsDemo, retoursDemo, sessionsDemo, ventesDemo } from "./demo-data";
import {
  MODE_PAIEMENT_LABEL,
  montantEspeces,
  totalVente,
  type NotificationVente,
  type OperationCaisse,
  type Retour,
  type SessionCaisse,
  type Vente,
  type VenteFormValues,
} from "./types";

/**
 * Store local du module « Ventes & Caisse ».
 * Isolé volontairement : lors de l'activation de Lovable Cloud, il suffira de
 * remplacer les fonctions ci-dessous par des requêtes (mêmes signatures).
 */

type State = {
  ventes: Vente[];
  retours: Retour[];
  sessions: SessionCaisse[];
  notifications: NotificationVente[];
};

let state: State = {
  ventes: ventesDemo,
  retours: retoursDemo,
  sessions: sessionsDemo,
  notifications: notificationsDemo,
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

export function useSalesStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useVente(id: string) {
  const { ventes } = useSalesStore();
  return ventes.find((v) => v.id === id || v.numero === id) ?? null;
}

export const lireVentes = () => state.ventes;

export const sessionOuverte = () => state.sessions.find((s) => !s.dateFermeture) ?? null;

export function useSessionOuverte() {
  const { sessions } = useSalesStore();
  return sessions.find((s) => !s.dateFermeture) ?? null;
}

/* ------------------------------------------------------------------ */
/* Helpers internes                                                     */
/* ------------------------------------------------------------------ */

let compteur = 0;
const uid = (prefixe: string) => `${prefixe}-${Date.now()}-${(compteur += 1)}`;

function numeroSuivant(prefixe: string, existants: string[]) {
  const max = existants.reduce((acc, numero) => {
    const n = Number(numero.split("-").pop());
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 1000);
  return `${prefixe}-${new Date().getFullYear()}-${max + 1}`;
}

function notifier(notification: Omit<NotificationVente, "id" | "date">) {
  setState({
    notifications: [
      { ...notification, id: uid("N"), date: new Date().toISOString() },
      ...state.notifications,
    ],
  });
  publier({
    module: notification.type === "caisse" ? "caisse" : "ventes",
    ton: notification.type === "retour" ? "alerte" : "succes",
    titre: notification.titre,
    message: notification.message,
  });
}

/** Ajoute une opération à la session de caisse ouverte (si elle existe). */
function ajouterOperation(operation: Omit<OperationCaisse, "id">) {
  const ouverte = sessionOuverte();
  if (!ouverte) return;
  setState({
    sessions: state.sessions.map((s) =>
      s.id === ouverte.id
        ? { ...s, operations: [...s.operations, { ...operation, id: uid("OP") }] }
        : s,
    ),
  });
}

/* ------------------------------------------------------------------ */
/* Ventes                                                               */
/* ------------------------------------------------------------------ */

export function enregistrerVente(values: VenteFormValues): Vente {
  const vente: Vente = {
    ...values,
    id: uid("V"),
    numero: numeroSuivant(
      "VTE",
      state.ventes.map((v) => v.numero),
    ),
    statut: "payee",
  };
  const total = totalVente(vente);

  setState({ ventes: [vente, ...state.ventes] });

  appliquerVente(
    vente.lignes.map((l) => ({
      produitId: l.produitId,
      quantite: l.quantite,
      montant: l.prixUnitaire * l.quantite,
    })),
    {
      reference: vente.numero,
      client: vente.client,
      utilisateur: vente.vendeur,
      date: vente.date,
    },
  );

  ajouterOperation({
    date: vente.date,
    type: "vente",
    libelle: `Vente ${vente.numero} — ${vente.client}`,
    montant: montantEspeces(vente.paiements),
    utilisateur: vente.vendeur,
    mode: vente.paiements[0]?.mode,
  });

  // Mise à jour automatique du profil client, de ses points de fidélité
  // et de son historique d'achats.
  enregistrerAchatClient({
    nom: vente.client,
    telephone: vente.telephoneClient,
    reference: vente.numero,
    date: vente.date,
    montant: total,
    modePaiement: vente.paiements[0] ? MODE_PAIEMENT_LABEL[vente.paiements[0].mode] : "Espèces",
    vendeur: vente.vendeur,
    produits: vente.lignes.map((l) => ({
      produitId: l.produitId,
      nom: l.nom,
      quantite: l.quantite,
      prixUnitaire: l.prixUnitaire,
    })),
  });

  // Encaissement partiel : une créance client est ouverte automatiquement
  // dans le module Finances (aucune double saisie).
  const encaisse = vente.paiements.reduce((somme, p) => somme + p.montant, 0);
  if (encaisse < total - 1) {
    enregistrerCreanceClient({
      nom: vente.client,
      montant: total - encaisse,
      reference: vente.numero,
      date: vente.date,
    });
  }

  notifier({
    type: "vente",
    titre: "Nouvelle vente enregistrée",
    message: `${vente.numero} · ${vente.client} · ${total} FCFA · Vendeur : ${vente.vendeur}`,
  });

  if (vente.paiements.some((p) => p.mode !== "especes")) {
    const mode = vente.paiements.find((p) => p.mode !== "especes")!.mode;
    notifier({
      type: "paiement",
      titre: `Paiement ${MODE_PAIEMENT_LABEL[mode]} reçu`,
      message: `${vente.numero} · ${vente.client}`,
    });
  }

  return vente;
}

export function annulerVente(id: string, motif = "Annulation de la vente") {
  const vente = state.ventes.find((v) => v.id === id);
  if (!vente || vente.statut === "annulee") return;

  setState({
    ventes: state.ventes.map((v) => (v.id === id ? { ...v, statut: "annulee" } : v)),
  });

  retournerVente(
    vente.lignes.map((l) => ({
      produitId: l.produitId,
      quantite: l.quantite,
      montant: l.prixUnitaire * l.quantite,
    })),
    {
      reference: vente.numero,
      client: vente.client,
      utilisateur: vente.vendeur,
      date: new Date().toISOString(),
      motif,
    },
  );

  ajouterOperation({
    date: new Date().toISOString(),
    type: "retour",
    libelle: `Annulation ${vente.numero}`,
    montant: -montantEspeces(vente.paiements),
    utilisateur: vente.vendeur,
  });

  notifier({
    type: "retour",
    titre: "Vente annulée",
    message: `${vente.numero} · stock réintégré automatiquement`,
  });
}

/* ------------------------------------------------------------------ */
/* Retours                                                              */
/* ------------------------------------------------------------------ */

export function enregistrerRetour(input: {
  venteId: string;
  lignes: { produitId: string; quantite: number; montant: number }[];
  motif: string;
  utilisateur: string;
}): Retour | null {
  const vente = state.ventes.find((v) => v.id === input.venteId);
  if (!vente || input.lignes.length === 0) return null;

  const date = new Date().toISOString();
  const montant = input.lignes.reduce((t, l) => t + l.montant, 0);
  const retour: Retour = {
    id: uid("R"),
    numero: numeroSuivant(
      "RET",
      state.retours.map((r) => r.numero),
    ),
    venteId: vente.id,
    venteNumero: vente.numero,
    date,
    utilisateur: input.utilisateur,
    motif: input.motif,
    lignes: input.lignes,
    montant,
  };

  setState({
    retours: [retour, ...state.retours],
    ventes: state.ventes.map((v) => (v.id === vente.id ? { ...v, statut: "retour" } : v)),
  });

  retournerVente(input.lignes, {
    reference: vente.numero,
    client: vente.client,
    utilisateur: input.utilisateur,
    date,
    motif: `Retour ${retour.numero} (${input.motif})`,
  });

  ajouterOperation({
    date,
    type: "retour",
    libelle: `Retour ${retour.numero} — ${input.motif}`,
    montant: -montant,
    utilisateur: input.utilisateur,
  });

  notifier({
    type: "retour",
    titre: "Retour produit",
    message: `${retour.numero} · ${input.motif} · ${montant} FCFA remboursés`,
  });

  return retour;
}

/* ------------------------------------------------------------------ */
/* Caisse                                                               */
/* ------------------------------------------------------------------ */

export function ouvrirCaisse(input: { montantOuverture: number; utilisateur: string }) {
  if (sessionOuverte()) return null;
  const date = new Date().toISOString();
  const session: SessionCaisse = {
    id: uid("C"),
    numero: numeroSuivant(
      "CAISSE",
      state.sessions.map((s) => s.numero),
    ),
    dateOuverture: date,
    montantOuverture: input.montantOuverture,
    utilisateur: input.utilisateur,
    dateFermeture: null,
    montantReel: null,
    observation: "",
    operations: [
      {
        id: uid("OP"),
        date,
        type: "ouverture",
        libelle: "Ouverture de caisse",
        montant: 0,
        utilisateur: input.utilisateur,
      },
    ],
  };
  setState({ sessions: [session, ...state.sessions] });
  notifier({
    type: "caisse",
    titre: "Caisse ouverte",
    message: `${session.numero} · fonds de caisse ${input.montantOuverture} FCFA`,
  });
  return session;
}

export function fermerCaisse(input: {
  sessionId: string;
  montantReel: number;
  observation: string;
  utilisateur: string;
}) {
  const date = new Date().toISOString();
  setState({
    sessions: state.sessions.map((s) =>
      s.id === input.sessionId
        ? {
            ...s,
            dateFermeture: date,
            montantReel: input.montantReel,
            observation: input.observation,
            operations: [
              ...s.operations,
              {
                id: uid("OP"),
                date,
                type: "cloture",
                libelle: "Clôture de caisse",
                montant: 0,
                utilisateur: input.utilisateur,
              },
            ],
          }
        : s,
    ),
  });
  notifier({
    type: "caisse",
    titre: "Caisse fermée",
    message: `Montant réel compté : ${input.montantReel} FCFA`,
  });
}

export function enregistrerDepenseCaisse(input: {
  libelle: string;
  montant: number;
  utilisateur: string;
}) {
  ajouterOperation({
    date: new Date().toISOString(),
    type: "depense",
    libelle: input.libelle,
    montant: -Math.abs(input.montant),
    utilisateur: input.utilisateur,
  });
}

/** Réinitialise l'activité de démonstration (ventes, retours, caisse). */
export function reinitialiserVentesDemo() {
  setState({ ventes: [], retours: [], sessions: [], notifications: [] });
}
