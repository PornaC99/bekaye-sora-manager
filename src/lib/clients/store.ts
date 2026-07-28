import { useSyncExternalStore } from "react";

import { publier } from "@/lib/core/notifications";
import { achatsDemo, clientsDemo, notificationsClientsDemo, reglesFideliteDemo } from "./demo-data";
import {
  estVip,
  niveauFidelite,
  pointsGagnes,
  type AchatClient,
  type Client,
  type ClientFormValues,
  type NotificationClient,
  type ProduitAchete,
  type ReglesFidelite,
} from "./types";

/**
 * Store local du module « Clients & Fidélité ».
 * Isolé volontairement : lors du branchement sur Lovable Cloud, il suffira de
 * remplacer les fonctions ci-dessous par des requêtes (mêmes signatures).
 */

type State = {
  clients: Client[];
  achats: AchatClient[];
  regles: ReglesFidelite;
  notifications: NotificationClient[];
};

let state: State = {
  clients: clientsDemo,
  achats: achatsDemo,
  regles: reglesFideliteDemo,
  notifications: notificationsClientsDemo,
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

export function useClientsStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useClient(id: string) {
  const { clients } = useClientsStore();
  return clients.find((c) => c.id === id || c.numero === id) ?? null;
}

export function useAchatsClient(clientId: string) {
  const { achats } = useClientsStore();
  return achats
    .filter((a) => a.clientId === clientId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const lireClients = () => state.clients;
export const lireReglesFidelite = () => state.regles;

/* ------------------------------------------------------------------ */
/* Helpers internes                                                     */
/* ------------------------------------------------------------------ */

let compteur = 0;
const uid = (prefixe: string) => `${prefixe}-${Date.now()}-${(compteur += 1)}`;

function numeroSuivant() {
  const max = state.clients.reduce((acc, c) => {
    const n = Number(c.numero.split("-").pop());
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `CLI-${new Date().getFullYear()}-${String(max + 1).padStart(4, "0")}`;
}

export function notifierClient(notification: Omit<NotificationClient, "id" | "date">) {
  setState({
    notifications: [
      { ...notification, id: uid("NC"), date: new Date().toISOString() },
      ...state.notifications,
    ].slice(0, 50),
  });
  publier({
    module: "clients",
    ton: notification.type === "inactif" ? "alerte" : "info",
    titre: notification.titre,
    message: notification.message,
  });
}

/* ------------------------------------------------------------------ */
/* CRUD clients                                                         */
/* ------------------------------------------------------------------ */

export function ajouterClient(values: ClientFormValues): Client {
  const client: Client = {
    ...values,
    id: uid("CL"),
    numero: numeroSuivant(),
    points: 0,
    totalDepense: 0,
    nombreAchats: 0,
    dernierAchat: null,
  };
  setState({ clients: [client, ...state.clients] });
  notifierClient({
    type: "nouveau",
    titre: "Nouveau client ajouté",
    message: `${client.nom} · ${client.numero} · ${client.ville}`,
  });
  return client;
}

export function modifierClient(id: string, values: ClientFormValues) {
  setState({
    clients: state.clients.map((c) => (c.id === id ? { ...c, ...values } : c)),
  });
}

export function supprimerClient(id: string) {
  setState({
    clients: state.clients.filter((c) => c.id !== id),
    achats: state.achats.filter((a) => a.clientId !== id),
  });
}

export function ajusterPoints(id: string, points: number, motif: string) {
  const client = state.clients.find((c) => c.id === id);
  if (!client) return;
  setState({
    clients: state.clients.map((c) =>
      c.id === id ? { ...c, points: Math.max(0, c.points + points) } : c,
    ),
  });
  notifierClient({
    type: "fidelite",
    titre: points >= 0 ? "Points ajoutés" : "Points utilisés",
    message: `${client.nom} · ${Math.abs(points)} points · ${motif}`,
  });
}

/* ------------------------------------------------------------------ */
/* Règles de fidélité                                                   */
/* ------------------------------------------------------------------ */

export function enregistrerReglesFidelite(regles: ReglesFidelite) {
  setState({ regles });
  notifierClient({
    type: "fidelite",
    titre: "Programme de fidélité mis à jour",
    message: regles.pointsActifs
      ? `${regles.pointsParTranche} point(s) par tranche de ${regles.trancheFCFA} FCFA`
      : "Attribution de points désactivée",
  });
}

/* ------------------------------------------------------------------ */
/* Synchronisation avec les ventes                                      */
/* ------------------------------------------------------------------ */

/**
 * Appelée automatiquement à chaque vente : met à jour le profil du client,
 * ses points de fidélité et son historique d'achats.
 */
export function enregistrerAchatClient(input: {
  nom: string;
  telephone?: string;
  reference: string;
  date: string;
  montant: number;
  modePaiement: string;
  vendeur: string;
  produits: ProduitAchete[];
}): AchatClient | null {
  const nom = input.nom.trim();
  if (!nom || input.montant <= 0) return null;

  let client =
    state.clients.find((c) => c.nom.toLowerCase() === nom.toLowerCase()) ??
    (input.telephone
      ? state.clients.find((c) => c.telephone === input.telephone && input.telephone !== "—")
      : undefined) ??
    null;

  if (!client) {
    client = ajouterClient({
      nom,
      telephone: input.telephone ?? "",
      whatsapp: input.telephone ?? "",
      email: "",
      adresse: "",
      ville: "Bamako",
      sexe: "non_precise",
      dateNaissance: null,
      dateInscription: input.date,
      notes: "Créé automatiquement lors d'une vente.",
      photo: null,
      dette: 0,
    });
  }

  const etaitVip = estVip(client);
  const points = pointsGagnes(input.montant, state.regles);

  const achat: AchatClient = {
    id: uid("AC"),
    clientId: client.id,
    date: input.date,
    reference: input.reference,
    produits: input.produits,
    montant: input.montant,
    modePaiement: input.modePaiement,
    vendeur: input.vendeur,
  };

  const misAJour: Client = {
    ...client,
    points: client.points + points,
    totalDepense: client.totalDepense + input.montant,
    nombreAchats: client.nombreAchats + 1,
    dernierAchat: input.date,
  };

  setState({
    achats: [achat, ...state.achats],
    clients: state.clients.map((c) => (c.id === misAJour.id ? misAJour : c)),
  });

  if (!etaitVip && estVip(misAJour)) {
    notifierClient({
      type: "vip",
      titre: "Client devenu VIP",
      message: `${misAJour.nom} rejoint le cercle VIP (niveau ${niveauFidelite(misAJour.points)}).`,
    });
  }

  if (
    state.regles.cadeauActif &&
    state.regles.achatsAvantCadeau > 0 &&
    misAJour.nombreAchats % state.regles.achatsAvantCadeau === 0
  ) {
    notifierClient({
      type: "fidelite",
      titre: "Cadeau de fidélité à remettre",
      message: `${misAJour.nom} a atteint ${misAJour.nombreAchats} achats — ${state.regles.cadeau}.`,
    });
  }

  return achat;
}
