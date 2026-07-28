import { useSyncExternalStore } from "react";

import { publier } from "@/lib/core/notifications";

import { activitesDemo, bulletinsDemo, congesDemo, employesDemo, presencesDemo } from "./demo-data";
import {
  PERMISSIONS_PAR_ROLE,
  type ActiviteJournal,
  type BulletinPaie,
  type Conge,
  type Employe,
  type EmployeFormValues,
  type Permission,
  type Presence,
  type RoleEmploye,
  type TypeActivite,
} from "./types";

/**
 * Store local du module « Employés, Rôles, Permissions & Salaires ».
 * Volontairement isolé : lors du branchement sur Lovable Cloud, il suffira de
 * remplacer les fonctions ci-dessous par des requêtes aux mêmes signatures.
 */

type State = {
  employes: Employe[];
  presences: Presence[];
  conges: Conge[];
  bulletins: BulletinPaie[];
  activites: ActiviteJournal[];
  permissionsRoles: Record<RoleEmploye, Permission[]>;
};

let state: State = {
  employes: employesDemo,
  presences: presencesDemo,
  conges: congesDemo,
  bulletins: bulletinsDemo,
  activites: activitesDemo,
  permissionsRoles: { ...PERMISSIONS_PAR_ROLE },
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

export function useHrStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useEmploye(id: string) {
  const { employes } = useHrStore();
  return employes.find((e) => e.id === id || e.matricule === id) ?? null;
}

export const lireEmployes = () => state.employes;
export const lireBulletins = () => state.bulletins;

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

let compteur = 0;
const uid = (prefixe: string) => `${prefixe}-${Date.now()}-${(compteur += 1)}`;

function matriculeSuivant() {
  const annee = new Date().getFullYear();
  const max = state.employes.reduce((acc, e) => {
    const n = Number(e.matricule.split("-").pop());
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `BS-${annee}-${String(max + 1).padStart(3, "0")}`;
}

export function journaliser(input: {
  type: TypeActivite;
  module: string;
  description: string;
  auteur?: string;
  employeId?: string | null;
}) {
  const activite: ActiviteJournal = {
    id: uid("AC"),
    date: new Date().toISOString(),
    employeId: input.employeId ?? null,
    auteur: input.auteur ?? "Bekaye Sora",
    type: input.type,
    module: input.module,
    description: input.description,
  };
  setState({ activites: [activite, ...state.activites].slice(0, 200) });
  publier({
    module: "rh",
    ton: input.type === "suppression" ? "alerte" : "info",
    titre: `${input.module} · ${activite.auteur}`,
    message: input.description,
  });
}

/* ------------------------------------------------------------------ */
/* CRUD employés                                                        */
/* ------------------------------------------------------------------ */

export function ajouterEmploye(values: EmployeFormValues): Employe {
  const employe: Employe = {
    ...values,
    id: uid("EMP"),
    matricule: matriculeSuivant(),
    derniereConnexion: null,
    permissions: null,
  };
  setState({ employes: [employe, ...state.employes] });
  journaliser({
    type: "ajout",
    module: "Employés",
    description: `Nouvel employé ajouté : ${employe.nom} (${employe.fonction}).`,
  });
  return employe;
}

export function modifierEmploye(id: string, values: EmployeFormValues) {
  setState({
    employes: state.employes.map((e) => (e.id === id ? { ...e, ...values } : e)),
  });
  journaliser({
    type: "modification",
    module: "Employés",
    description: `Fiche employé mise à jour : ${values.nom}.`,
    employeId: id,
  });
}

export function supprimerEmploye(id: string) {
  const employe = state.employes.find((e) => e.id === id);
  setState({ employes: state.employes.filter((e) => e.id !== id) });
  journaliser({
    type: "suppression",
    module: "Employés",
    description: `Employé supprimé : ${employe?.nom ?? id}.`,
  });
}

export function changerStatutEmploye(id: string, statut: Employe["statut"]) {
  const employe = state.employes.find((e) => e.id === id);
  setState({ employes: state.employes.map((e) => (e.id === id ? { ...e, statut } : e)) });
  journaliser({
    type: "modification",
    module: "Employés",
    description: `Statut de ${employe?.nom ?? id} changé en « ${statut} ».`,
    employeId: id,
  });
}

export function reinitialiserMotDePasse(id: string) {
  const employe = state.employes.find((e) => e.id === id);
  journaliser({
    type: "modification",
    module: "Sécurité",
    description: `Mot de passe réinitialisé pour ${employe?.nom ?? id}.`,
    employeId: id,
  });
  // Mot de passe temporaire non stocké côté client : généré à la volée.
  return `501-${Math.floor(100000 + Math.random() * 900000)}`;
}

export function definirObjectif(id: string, objectifMensuel: number) {
  setState({
    employes: state.employes.map((e) => (e.id === id ? { ...e, objectifMensuel } : e)),
  });
  journaliser({
    type: "modification",
    module: "Objectifs",
    description: `Objectif mensuel mis à jour pour ${
      state.employes.find((e) => e.id === id)?.nom ?? id
    }.`,
    employeId: id,
  });
}

/* ------------------------------------------------------------------ */
/* Présence                                                             */
/* ------------------------------------------------------------------ */

export function enregistrerPresence(input: Omit<Presence, "id">) {
  const existante = state.presences.find(
    (p) => p.employeId === input.employeId && p.date === input.date,
  );
  if (existante) {
    setState({
      presences: state.presences.map((p) =>
        p.id === existante.id ? { ...existante, ...input } : p,
      ),
    });
  } else {
    setState({ presences: [{ ...input, id: uid("PR") }, ...state.presences] });
  }
  journaliser({
    type: "modification",
    module: "Présence",
    description: `Pointage enregistré pour le ${input.date}.`,
    employeId: input.employeId,
  });
}

/* ------------------------------------------------------------------ */
/* Congés                                                               */
/* ------------------------------------------------------------------ */

export function demanderConge(
  input: Omit<Conge, "id" | "statut" | "dateDemande" | "decidePar" | "commentaire">,
) {
  const conge: Conge = {
    ...input,
    id: uid("CG"),
    statut: "en_attente",
    dateDemande: new Date().toISOString(),
    decidePar: null,
    commentaire: "",
  };
  setState({ conges: [conge, ...state.conges] });
  journaliser({
    type: "ajout",
    module: "Congés",
    description: "Nouvelle demande de congé enregistrée.",
    employeId: input.employeId,
  });
  return conge;
}

export function deciderConge(
  id: string,
  statut: "approuve" | "refuse",
  commentaire = "",
  decidePar = "Bekaye Sora",
) {
  const conge = state.conges.find((c) => c.id === id);
  setState({
    conges: state.conges.map((c) => (c.id === id ? { ...c, statut, commentaire, decidePar } : c)),
    employes:
      statut === "approuve" && conge
        ? state.employes.map((e) => (e.id === conge.employeId ? { ...e, statut: "conge" } : e))
        : state.employes,
  });
  journaliser({
    type: "validation",
    module: "Congés",
    description: `Congé ${statut === "approuve" ? "approuvé" : "refusé"}.`,
    employeId: conge?.employeId ?? null,
  });
}

export function supprimerConge(id: string) {
  setState({ conges: state.conges.filter((c) => c.id !== id) });
  journaliser({ type: "suppression", module: "Congés", description: "Demande de congé supprimée." });
}

/* ------------------------------------------------------------------ */
/* Salaires                                                             */
/* ------------------------------------------------------------------ */

export function enregistrerBulletin(bulletin: BulletinPaie) {
  const existant = state.bulletins.find((b) => b.id === bulletin.id);
  setState({
    bulletins: existant
      ? state.bulletins.map((b) => (b.id === bulletin.id ? bulletin : b))
      : [bulletin, ...state.bulletins],
  });
  journaliser({
    type: existant ? "modification" : "ajout",
    module: "Salaires",
    description: `Bulletin de paie ${bulletin.mois} enregistré.`,
    employeId: bulletin.employeId,
  });
}

export function payerBulletin(id: string, modePaiement: BulletinPaie["modePaiement"]) {
  const bulletin = state.bulletins.find((b) => b.id === id);
  setState({
    bulletins: state.bulletins.map((b) =>
      b.id === id
        ? { ...b, statut: "paye", modePaiement, datePaiement: new Date().toISOString().slice(0, 10) }
        : b,
    ),
  });
  journaliser({
    type: "validation",
    module: "Salaires",
    description: "Salaire payé.",
    employeId: bulletin?.employeId ?? null,
  });
}

export function genererBulletinsDuMois(mois: string) {
  const existants = new Set(state.bulletins.filter((b) => b.mois === mois).map((b) => b.employeId));
  const nouveaux: BulletinPaie[] = state.employes
    .filter((e) => e.statut !== "inactif" && !existants.has(e.id))
    .map((e) => ({
      id: `PAIE-${mois}-${e.id}`,
      employeId: e.id,
      mois,
      salaireBase: e.salaireBase,
      primes: 0,
      heuresSupplementaires: 0,
      tauxHeureSupplementaire: 1500,
      avances: 0,
      retenues: 0,
      statut: "brouillon",
      datePaiement: null,
      modePaiement: "especes",
      observation: "",
    }));
  if (nouveaux.length) {
    setState({ bulletins: [...nouveaux, ...state.bulletins] });
    journaliser({
      type: "ajout",
      module: "Salaires",
      description: `${nouveaux.length} bulletin(s) généré(s) pour ${mois}.`,
    });
  }
  return nouveaux.length;
}

/* ------------------------------------------------------------------ */
/* Permissions                                                          */
/* ------------------------------------------------------------------ */

export function basculerPermissionRole(role: RoleEmploye, permission: Permission) {
  const actuelles = state.permissionsRoles[role] ?? [];
  const suivantes = actuelles.includes(permission)
    ? actuelles.filter((p) => p !== permission)
    : [...actuelles, permission];
  setState({ permissionsRoles: { ...state.permissionsRoles, [role]: suivantes } });
  journaliser({
    type: "modification",
    module: "Permissions",
    description: `Permissions du rôle « ${role} » mises à jour.`,
  });
}

export function reinitialiserPermissions() {
  setState({ permissionsRoles: { ...PERMISSIONS_PAR_ROLE } });
  journaliser({
    type: "modification",
    module: "Permissions",
    description: "Matrice des permissions réinitialisée.",
  });
}
