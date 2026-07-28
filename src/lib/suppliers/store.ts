import { useSyncExternalStore } from "react";

import { appliquerReception, type LigneReception } from "@/lib/products/store";

import { commandesDemo, fournisseursDemo, notificationsFournisseursDemo } from "./demo-data";
import {
  montantCommande,
  type CommandeAchat,
  type CommandeFormValues,
  type Fournisseur,
  type FournisseurFormValues,
  type NotificationFournisseur,
  type StatutCommande,
} from "./types";

/**
 * Store local du module « Fournisseurs & Commandes d'achat ».
 * Isolé volontairement : lors du branchement sur Lovable Cloud, il suffira de
 * remplacer les fonctions ci-dessous par des requêtes (mêmes signatures).
 */

type State = {
  fournisseurs: Fournisseur[];
  commandes: CommandeAchat[];
  notifications: NotificationFournisseur[];
};

let state: State = {
  fournisseurs: fournisseursDemo,
  commandes: commandesDemo,
  notifications: notificationsFournisseursDemo,
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

export function useSuppliersStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useFournisseur(id: string) {
  const { fournisseurs } = useSuppliersStore();
  return fournisseurs.find((f) => f.id === id) ?? null;
}

export function useCommande(id: string) {
  const { commandes } = useSuppliersStore();
  return commandes.find((c) => c.id === id || c.numero === id) ?? null;
}

export const lireFournisseurs = () => state.fournisseurs;
export const lireCommandes = () => state.commandes;

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

let compteur = 0;
const uid = (prefixe: string) => `${prefixe}-${Date.now()}-${(compteur += 1)}`;

function numeroCommandeSuivant() {
  const max = state.commandes.reduce((acc, c) => {
    const n = Number(c.numero.split("-").pop());
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `CMD-${new Date().getFullYear()}-${String(max + 1).padStart(4, "0")}`;
}

export function notifierFournisseur(notification: Omit<NotificationFournisseur, "id" | "date">) {
  setState({
    notifications: [
      { ...notification, id: uid("NF"), date: new Date().toISOString() },
      ...state.notifications,
    ].slice(0, 50),
  });
}

/* ------------------------------------------------------------------ */
/* CRUD fournisseurs                                                    */
/* ------------------------------------------------------------------ */

export function ajouterFournisseur(values: FournisseurFormValues): Fournisseur {
  const fournisseur: Fournisseur = {
    ...values,
    id: uid("F"),
    dateCreation: new Date().toISOString(),
  };
  setState({ fournisseurs: [fournisseur, ...state.fournisseurs] });
  notifierFournisseur({
    type: "commande",
    titre: "Nouveau fournisseur",
    message: `${fournisseur.nom} · ${fournisseur.ville} a été ajouté au répertoire.`,
  });
  return fournisseur;
}

export function modifierFournisseur(id: string, values: FournisseurFormValues) {
  setState({
    fournisseurs: state.fournisseurs.map((f) => (f.id === id ? { ...f, ...values } : f)),
  });
}

export function supprimerFournisseur(id: string) {
  setState({
    fournisseurs: state.fournisseurs.filter((f) => f.id !== id),
    commandes: state.commandes.filter((c) => c.fournisseurId !== id),
  });
}

export function basculerFavori(id: string) {
  setState({
    fournisseurs: state.fournisseurs.map((f) =>
      f.id === id ? { ...f, favori: !f.favori } : f,
    ),
  });
}

/* ------------------------------------------------------------------ */
/* Commandes d'achat                                                    */
/* ------------------------------------------------------------------ */

export function ajouterCommande(values: CommandeFormValues): CommandeAchat {
  const now = new Date().toISOString();
  const commande: CommandeAchat = {
    ...values,
    id: uid("C"),
    numero: numeroCommandeSuivant(),
    dateReception: null,
    historique: [{ date: now, libelle: "Commande créée", utilisateur: values.responsable }],
    commentaires: [],
  };
  setState({ commandes: [commande, ...state.commandes] });
  notifierFournisseur({
    type: "commande",
    titre: "Commande créée",
    message: `${commande.numero} · ${nomFournisseur(commande.fournisseurId)} · ${Math.round(
      montantCommande(commande),
    ).toLocaleString("fr-FR")} FCFA`,
  });
  return commande;
}

export function modifierCommande(id: string, values: CommandeFormValues) {
  setState({
    commandes: state.commandes.map((c) =>
      c.id === id
        ? {
            ...c,
            ...values,
            historique: [
              ...c.historique,
              {
                date: new Date().toISOString(),
                libelle: "Commande modifiée",
                utilisateur: values.responsable,
              },
            ],
          }
        : c,
    ),
  });
}

export function supprimerCommande(id: string) {
  setState({ commandes: state.commandes.filter((c) => c.id !== id) });
}

export function ajouterCommentaireCommande(id: string, auteur: string, texte: string) {
  setState({
    commandes: state.commandes.map((c) =>
      c.id === id
        ? {
            ...c,
            commentaires: [
              { id: uid("K"), date: new Date().toISOString(), auteur, texte },
              ...c.commentaires,
            ],
          }
        : c,
    ),
  });
}

export function nomFournisseur(id: string) {
  return state.fournisseurs.find((f) => f.id === id)?.nom ?? "Fournisseur inconnu";
}

/** Change le statut d'une commande (hors réception, qui a sa propre fonction). */
export function changerStatutCommande(id: string, statut: StatutCommande) {
  const commande = state.commandes.find((c) => c.id === id);
  if (!commande) return;
  if (statut === "recue") {
    receptionnerCommande(id);
    return;
  }
  setState({
    commandes: state.commandes.map((c) =>
      c.id === id
        ? {
            ...c,
            statut,
            historique: [
              ...c.historique,
              {
                date: new Date().toISOString(),
                libelle: `Statut : ${statut}`,
                utilisateur: c.responsable,
              },
            ],
          }
        : c,
    ),
  });
  if (statut === "envoyee") {
    notifierFournisseur({
      type: "commande",
      titre: "Commande envoyée",
      message: `${commande.numero} a été transmise à ${nomFournisseur(commande.fournisseurId)}.`,
    });
  }
  if (statut === "annulee") {
    notifierFournisseur({
      type: "alerte",
      titre: "Commande annulée",
      message: `${commande.numero} · ${nomFournisseur(commande.fournisseurId)}`,
    });
  }
}

/**
 * Réception d'une commande : le stock des produits est augmenté, les mouvements
 * et l'historique d'achats du module Produits sont mis à jour (donc le Dashboard,
 * les rapports et les statistiques également).
 */
export function receptionnerCommande(id: string) {
  const commande = state.commandes.find((c) => c.id === id);
  if (!commande || commande.statut === "recue") return;

  const now = new Date().toISOString();
  const lignes: LigneReception[] = commande.lignes.map((l) => ({
    produitId: l.produitId,
    quantite: l.quantite,
    prixAchat: l.prixAchat,
    prixVente: 0,
    dateExpiration: null,
  }));

  appliquerReception(lignes, {
    reference: commande.numero,
    fournisseur: nomFournisseur(commande.fournisseurId),
    utilisateur: commande.responsable,
    date: now,
  });

  setState({
    commandes: state.commandes.map((c) =>
      c.id === id
        ? {
            ...c,
            statut: "recue",
            dateReception: now,
            historique: [
              ...c.historique,
              {
                date: now,
                libelle: "Commande réceptionnée — stock mis à jour",
                utilisateur: c.responsable,
              },
            ],
          }
        : c,
    ),
  });

  notifierFournisseur({
    type: "reception",
    titre: "Commande reçue",
    message: `${commande.numero} · le stock de ${commande.lignes.length} produit(s) a été augmenté.`,
  });
}
