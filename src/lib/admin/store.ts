import { useSyncExternalStore } from "react";

import {
  ENTREPRISE_COURANTE,
  auditDemo,
  entreprisesDemo,
  infosEntrepriseDemo,
  magasinsDemo,
  notificationsDemo,
  parametresFinanciersDemo,
  parametresStocksDemo,
  parametresVentesDemo,
  personnalisationDemo,
  planificationDemo,
  politiqueDemo,
  rolesDemo,
  sauvegardesDemo,
  sessionsDemo,
  utilisateursDemo,
} from "./demo-data";
import type {
  ActionAudit,
  EntreeAudit,
  Entreprise,
  InfosEntreprise,
  Magasin,
  MagasinFormValues,
  ParametresFinanciers,
  ParametresStocks,
  ParametresVentes,
  PermissionCle,
  Personnalisation,
  PlanificationSauvegarde,
  PolitiqueMotDePasse,
  PreferencesNotifications,
  Role,
  Sauvegarde,
  Session,
  Utilisateur,
  UtilisateurFormValues,
} from "./types";

/**
 * Store local du module « Administration ».
 * Chaque entité est déjà rattachée à un `entrepriseId` : le passage à Lovable
 * Cloud consistera à remplacer ces fonctions par des requêtes protégées par RLS
 * (policies `entreprise_id = current_entreprise()`), sans changer les signatures.
 */

type State = {
  entrepriseCouranteId: string;
  entreprises: Entreprise[];
  infos: InfosEntreprise;
  personnalisation: Personnalisation;
  utilisateurs: Utilisateur[];
  roles: Role[];
  audit: EntreeAudit[];
  sessions: Session[];
  politique: PolitiqueMotDePasse;
  sauvegardes: Sauvegarde[];
  planification: PlanificationSauvegarde;
  notifications: PreferencesNotifications;
  magasins: Magasin[];
  magasinActifId: string | "tous";
  ventes: ParametresVentes;
  stocks: ParametresStocks;
  finances: ParametresFinanciers;
  etapesFaites: string[];
};

let state: State = {
  entrepriseCouranteId: ENTREPRISE_COURANTE,
  entreprises: entreprisesDemo,
  infos: infosEntrepriseDemo,
  personnalisation: personnalisationDemo,
  utilisateurs: utilisateursDemo,
  roles: rolesDemo,
  audit: auditDemo,
  sessions: sessionsDemo,
  politique: politiqueDemo,
  sauvegardes: sauvegardesDemo,
  planification: planificationDemo,
  notifications: notificationsDemo,
  magasins: magasinsDemo,
  magasinActifId: "tous",
  ventes: parametresVentesDemo,
  stocks: parametresStocksDemo,
  finances: parametresFinanciersDemo,
  etapesFaites: ["produits", "fournisseurs", "employes"],
};

const listeners = new Set<() => void>();
const getSnapshot = () => state;

function setState(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAdminStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

const id = (prefixe: string) =>
  `${prefixe}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(16).slice(2, 5).toUpperCase()}`;

/* ------------------------------------------------------------------ */
/* Journal d'audit                                                      */
/* ------------------------------------------------------------------ */

export function journaliser(entree: {
  action: ActionAudit;
  module: string;
  details: string;
  utilisateur?: string;
}) {
  const item: EntreeAudit = {
    id: id("AUD"),
    entrepriseId: state.entrepriseCouranteId,
    date: new Date().toISOString(),
    utilisateur: entree.utilisateur ?? "Bekaye Sora",
    action: entree.action,
    module: entree.module,
    details: entree.details,
    ip: "196.28.240.11",
    appareil: typeof navigator !== "undefined" ? navigatorLabel() : "Navigateur",
  };
  setState({ audit: [item, ...state.audit].slice(0, 300) });
}

function navigatorLabel() {
  const ua = navigator.userAgent;
  const nav = /Chrome/.test(ua)
    ? "Chrome"
    : /Safari/.test(ua)
      ? "Safari"
      : /Firefox/.test(ua)
        ? "Firefox"
        : "Navigateur";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Mac/.test(ua)
      ? "macOS"
      : /Android/.test(ua)
        ? "Android"
        : /iPhone|iPad/.test(ua)
          ? "iOS"
          : "Système";
  return `${nav} · ${os}`;
}

/* ------------------------------------------------------------------ */
/* Entreprise & personnalisation                                        */
/* ------------------------------------------------------------------ */

export function enregistrerInfos(infos: InfosEntreprise) {
  setState({ infos });
  journaliser({
    action: "modification",
    module: "Administration",
    details: "Informations de l'entreprise mises à jour.",
  });
}

export function enregistrerPersonnalisation(personnalisation: Personnalisation) {
  setState({ personnalisation });
  journaliser({
    action: "modification",
    module: "Administration",
    details: "Personnalisation de l'interface mise à jour.",
  });
}

/* ------------------------------------------------------------------ */
/* Utilisateurs                                                         */
/* ------------------------------------------------------------------ */

export function ajouterUtilisateur(valeurs: UtilisateurFormValues) {
  const utilisateur: Utilisateur = {
    ...valeurs,
    id: id("USR"),
    entrepriseId: state.entrepriseCouranteId,
    derniereConnexion: null,
    creeLe: new Date().toISOString(),
  };
  setState({ utilisateurs: [utilisateur, ...state.utilisateurs] });
  journaliser({
    action: "creation",
    module: "Utilisateurs",
    details: `Utilisateur « ${valeurs.nom} » invité.`,
  });
  return utilisateur;
}

export function modifierUtilisateur(idUtilisateur: string, valeurs: UtilisateurFormValues) {
  setState({
    utilisateurs: state.utilisateurs.map((u) =>
      u.id === idUtilisateur ? { ...u, ...valeurs } : u,
    ),
  });
  journaliser({
    action: "modification",
    module: "Utilisateurs",
    details: `Utilisateur « ${valeurs.nom} » modifié.`,
  });
}

export function basculerStatutUtilisateur(idUtilisateur: string) {
  const cible = state.utilisateurs.find((u) => u.id === idUtilisateur);
  if (!cible) return;
  const statut = cible.statut === "suspendu" ? "actif" : "suspendu";
  setState({
    utilisateurs: state.utilisateurs.map((u) => (u.id === idUtilisateur ? { ...u, statut } : u)),
  });
  journaliser({
    action: "modification",
    module: "Utilisateurs",
    details: `Compte « ${cible.nom} » ${statut === "suspendu" ? "suspendu" : "réactivé"}.`,
  });
}

export function supprimerUtilisateur(idUtilisateur: string) {
  const cible = state.utilisateurs.find((u) => u.id === idUtilisateur);
  setState({ utilisateurs: state.utilisateurs.filter((u) => u.id !== idUtilisateur) });
  if (cible) {
    journaliser({
      action: "suppression",
      module: "Utilisateurs",
      details: `Utilisateur « ${cible.nom} » supprimé.`,
    });
  }
}

export function reinitialiserMotDePasse(idUtilisateur: string) {
  const cible = state.utilisateurs.find((u) => u.id === idUtilisateur);
  if (!cible) return;
  journaliser({
    action: "modification",
    module: "Sécurité",
    details: `Lien de réinitialisation envoyé à ${cible.email}.`,
  });
}

/* ------------------------------------------------------------------ */
/* Rôles                                                                */
/* ------------------------------------------------------------------ */

export function ajouterRole(nom: string, description: string, permissions: PermissionCle[]) {
  const role: Role = {
    id: id("ROLE"),
    entrepriseId: state.entrepriseCouranteId,
    nom,
    description,
    systeme: false,
    permissions,
  };
  setState({ roles: [...state.roles, role] });
  journaliser({
    action: "creation",
    module: "Rôles",
    details: `Rôle personnalisé « ${nom} » créé.`,
  });
  return role;
}

export function basculerPermission(idRole: string, permission: PermissionCle) {
  setState({
    roles: state.roles.map((r) =>
      r.id === idRole
        ? {
            ...r,
            permissions: r.permissions.includes(permission)
              ? r.permissions.filter((p) => p !== permission)
              : [...r.permissions, permission],
          }
        : r,
    ),
  });
}

export function supprimerRole(idRole: string) {
  const cible = state.roles.find((r) => r.id === idRole);
  if (!cible || cible.systeme) return;
  setState({ roles: state.roles.filter((r) => r.id !== idRole) });
  journaliser({
    action: "suppression",
    module: "Rôles",
    details: `Rôle « ${cible.nom} » supprimé.`,
  });
}

/* ------------------------------------------------------------------ */
/* Sécurité                                                             */
/* ------------------------------------------------------------------ */

export function enregistrerPolitique(politique: PolitiqueMotDePasse) {
  setState({ politique });
  journaliser({
    action: "modification",
    module: "Sécurité",
    details: "Politique de mot de passe mise à jour.",
  });
}

export function fermerSession(idSession: string) {
  setState({ sessions: state.sessions.filter((s) => s.id !== idSession) });
  journaliser({
    action: "deconnexion",
    module: "Sécurité",
    details: "Session distante fermée.",
  });
}

export function fermerToutesSessions() {
  setState({ sessions: state.sessions.filter((s) => s.courante) });
  journaliser({
    action: "deconnexion",
    module: "Sécurité",
    details: "Déconnexion de tous les autres appareils.",
  });
}

/* ------------------------------------------------------------------ */
/* Sauvegardes                                                          */
/* ------------------------------------------------------------------ */

export function creerSauvegarde() {
  const sauvegarde: Sauvegarde = {
    id: id("BCK"),
    date: new Date().toISOString(),
    taille: `${(17 + Math.random() * 3).toFixed(1).replace(".", ",")} Mo`,
    type: "manuelle",
    statut: "reussie",
    auteur: "Bekaye Sora",
  };
  setState({ sauvegardes: [sauvegarde, ...state.sauvegardes] });
  journaliser({
    action: "creation",
    module: "Sauvegardes",
    details: `Sauvegarde ${sauvegarde.id} créée.`,
  });
  return sauvegarde;
}

export function enregistrerPlanification(planification: PlanificationSauvegarde) {
  setState({ planification });
  journaliser({
    action: "modification",
    module: "Sauvegardes",
    details: "Planification automatique mise à jour.",
  });
}

export function enregistrerNotifications(notifications: PreferencesNotifications) {
  setState({ notifications });
  journaliser({
    action: "modification",
    module: "Notifications",
    details: "Préférences de notification mises à jour.",
  });
}

/* ------------------------------------------------------------------ */
/* Magasins & entreprises                                               */
/* ------------------------------------------------------------------ */

export function ajouterMagasin(valeurs: MagasinFormValues) {
  const magasin: Magasin = { ...valeurs, id: id("MAG"), entrepriseId: state.entrepriseCouranteId };
  setState({ magasins: [...state.magasins, magasin] });
  journaliser({
    action: "creation",
    module: "Magasins",
    details: `Magasin « ${valeurs.nom} » créé.`,
  });
  return magasin;
}

export function modifierMagasin(idMagasin: string, valeurs: Partial<MagasinFormValues>) {
  setState({
    magasins: state.magasins.map((m) => (m.id === idMagasin ? { ...m, ...valeurs } : m)),
  });
}

export function supprimerMagasin(idMagasin: string) {
  const cible = state.magasins.find((m) => m.id === idMagasin);
  setState({ magasins: state.magasins.filter((m) => m.id !== idMagasin) });
  if (cible) {
    journaliser({
      action: "suppression",
      module: "Magasins",
      details: `Magasin « ${cible.nom} » supprimé.`,
    });
  }
}

export function choisirMagasin(idMagasin: string | "tous") {
  setState({ magasinActifId: idMagasin });
}

export function ajouterEntreprise(entreprise: Omit<Entreprise, "id" | "creeLe">) {
  const item: Entreprise = { ...entreprise, id: id("ENT"), creeLe: new Date().toISOString() };
  setState({ entreprises: [...state.entreprises, item] });
  journaliser({
    action: "creation",
    module: "Multi-entreprises",
    details: `Entreprise « ${entreprise.nom} » créée avec données isolées.`,
  });
  return item;
}

export function basculerEntreprise(idEntreprise: string) {
  setState({ entrepriseCouranteId: idEntreprise });
  journaliser({
    action: "modification",
    module: "Multi-entreprises",
    details: `Bascule vers l'espace de l'entreprise ${idEntreprise}.`,
  });
}

/* ------------------------------------------------------------------ */
/* Paramètres métiers                                                   */
/* ------------------------------------------------------------------ */

export function enregistrerParametresVentes(ventes: ParametresVentes) {
  setState({ ventes });
  journaliser({
    action: "modification",
    module: "Paramètres ventes",
    details: "Paramètres de vente mis à jour.",
  });
}

export function enregistrerParametresStocks(stocks: ParametresStocks) {
  setState({ stocks });
  journaliser({
    action: "modification",
    module: "Paramètres stocks",
    details: "Paramètres de stock mis à jour.",
  });
}

export function enregistrerParametresFinanciers(finances: ParametresFinanciers) {
  setState({ finances });
  journaliser({
    action: "modification",
    module: "Paramètres financiers",
    details: "Paramètres financiers mis à jour.",
  });
}

/* ------------------------------------------------------------------ */
/* Assistant de configuration                                           */
/* ------------------------------------------------------------------ */

export function basculerEtape(cle: string) {
  const faites = state.etapesFaites.includes(cle)
    ? state.etapesFaites.filter((c) => c !== cle)
    : [...state.etapesFaites, cle];
  setState({ etapesFaites: faites });
}
