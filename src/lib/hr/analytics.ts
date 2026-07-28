import { totalVente, type Vente } from "@/lib/sales/types";
import {
  joursConge,
  minutesEntre,
  salaireNet,
  type BulletinPaie,
  type Conge,
  type Employe,
  type Presence,
} from "./types";

/**
 * Moteur d'analyse RH : performances de vente, assiduité et masse salariale.
 * Les ventes ne sont pas dupliquées : elles sont lues depuis le module Ventes
 * et rattachées à l'employé via le champ `vendeur`.
 */

const moisDe = (iso: string) => iso.slice(0, 7);
export const moisCourant = () => new Date().toISOString().slice(0, 7);
export const jourCourant = () => new Date().toISOString().slice(0, 10);

export function ventesDeLEmploye(ventes: Vente[], employe: Employe) {
  return ventes.filter((v) => v.statut !== "annulee" && v.vendeur === employe.nom);
}

export type PerformanceEmploye = {
  employe: Employe;
  nombreVentes: number;
  chiffreAffaires: number;
  panierMoyen: number;
  objectif: number;
  progression: number; // 0 → 100+
  tauxPresence: number; // %
  retards: number;
  heuresTravaillees: number; // minutes cumulées
};

export function calculerPerformances(
  employes: Employe[],
  ventes: Vente[],
  presences: Presence[],
  mois = moisCourant(),
): PerformanceEmploye[] {
  const ventesMois = ventes.filter((v) => moisDe(v.date) === mois && v.statut !== "annulee");

  return employes
    .map((employe) => {
      const siennes = ventesMois.filter((v) => v.vendeur === employe.nom);
      const chiffreAffaires = siennes.reduce((acc, v) => acc + totalVente(v), 0);
      const presencesMois = presences.filter(
        (p) => p.employeId === employe.id && p.date.slice(0, 7) === mois,
      );
      const joursOuvres = presencesMois.length;
      const joursPresents = presencesMois.filter(
        (p) => p.statut === "present" || p.statut === "retard",
      ).length;

      return {
        employe,
        nombreVentes: siennes.length,
        chiffreAffaires,
        panierMoyen: siennes.length ? Math.round(chiffreAffaires / siennes.length) : 0,
        objectif: employe.objectifMensuel,
        progression: employe.objectifMensuel
          ? Math.round((chiffreAffaires / employe.objectifMensuel) * 100)
          : 0,
        tauxPresence: joursOuvres ? Math.round((joursPresents / joursOuvres) * 100) : 0,
        retards: presencesMois.filter((p) => p.statut === "retard").length,
        heuresTravaillees: presencesMois.reduce(
          (acc, p) => acc + minutesEntre(p.arrivee, p.depart),
          0,
        ),
      };
    })
    .sort((a, b) => b.chiffreAffaires - a.chiffreAffaires);
}

/** Classement des meilleurs vendeurs (utilisé par le Dashboard RH). */
export function meilleursVendeurs(performances: PerformanceEmploye[], limite = 5) {
  return performances.filter((p) => p.nombreVentes > 0).slice(0, limite);
}

export type KpiRh = {
  totalEmployes: number;
  actifs: number;
  presentsAujourdhui: number;
  enConge: number;
  retardsAujourdhui: number;
  masseSalariale: number;
  salairesEnAttente: number;
  meilleurVendeur: string;
  tauxPresenceMoyen: number;
};

export function calculerKpisRh(input: {
  employes: Employe[];
  presences: Presence[];
  conges: Conge[];
  bulletins: BulletinPaie[];
  ventes: Vente[];
  mois?: string;
}): KpiRh {
  const mois = input.mois ?? moisCourant();
  const today = jourCourant();
  const presencesJour = input.presences.filter((p) => p.date === today);
  const bulletinsMois = input.bulletins.filter((b) => b.mois === mois);
  const performances = calculerPerformances(input.employes, input.ventes, input.presences, mois);
  const top = performances.find((p) => p.nombreVentes > 0);
  const tauxMoyen = performances.length
    ? Math.round(performances.reduce((a, p) => a + p.tauxPresence, 0) / performances.length)
    : 0;

  return {
    totalEmployes: input.employes.length,
    actifs: input.employes.filter((e) => e.statut === "actif").length,
    presentsAujourdhui: presencesJour.filter(
      (p) => p.statut === "present" || p.statut === "retard",
    ).length,
    enConge: input.employes.filter((e) => e.statut === "conge").length,
    retardsAujourdhui: presencesJour.filter((p) => p.statut === "retard").length,
    masseSalariale: bulletinsMois.reduce((acc, b) => acc + salaireNet(b), 0),
    salairesEnAttente: bulletinsMois
      .filter((b) => b.statut !== "paye")
      .reduce((acc, b) => acc + salaireNet(b), 0),
    meilleurVendeur: top?.employe.nom ?? "—",
    tauxPresenceMoyen: tauxMoyen,
  };
}

/* ------------------------------------------------------------------ */
/* Alertes intelligentes RH                                             */
/* ------------------------------------------------------------------ */

export type AlerteRh = {
  id: string;
  niveau: "haute" | "moyenne" | "basse";
  titre: string;
  message: string;
};

export function genererAlertesRh(input: {
  employes: Employe[];
  presences: Presence[];
  conges: Conge[];
  bulletins: BulletinPaie[];
  performances: PerformanceEmploye[];
}): AlerteRh[] {
  const alertes: AlerteRh[] = [];
  const today = jourCourant();

  const absents = input.presences.filter((p) => p.date === today && p.statut === "absent");
  absents.forEach((p) => {
    const employe = input.employes.find((e) => e.id === p.employeId);
    if (!employe) return;
    alertes.push({
      id: `abs-${p.id}`,
      niveau: "haute",
      titre: "Absence non justifiée",
      message: `${employe.nom} est absent(e) aujourd'hui sans congé approuvé.`,
    });
  });

  input.performances
    .filter((p) => p.retards >= 3)
    .forEach((p) =>
      alertes.push({
        id: `ret-${p.employe.id}`,
        niveau: "moyenne",
        titre: "Retards répétés",
        message: `${p.employe.nom} cumule ${p.retards} retards ce mois-ci.`,
      }),
    );

  input.conges
    .filter((c) => c.statut === "en_attente")
    .forEach((c) => {
      const employe = input.employes.find((e) => e.id === c.employeId);
      alertes.push({
        id: `cg-${c.id}`,
        niveau: "moyenne",
        titre: "Congé en attente",
        message: `${employe?.nom ?? "Un employé"} attend une réponse pour ${joursConge(c)} jour(s) de congé.`,
      });
    });

  const impayes = input.bulletins.filter((b) => b.mois === moisCourant() && b.statut !== "paye");
  if (impayes.length) {
    alertes.push({
      id: "paie-attente",
      niveau: "haute",
      titre: "Salaires non payés",
      message: `${impayes.length} bulletin(s) du mois en cours ne sont pas encore payés.`,
    });
  }

  input.performances
    .filter((p) => p.objectif > 0 && p.progression < 50)
    .forEach((p) =>
      alertes.push({
        id: `obj-${p.employe.id}`,
        niveau: "basse",
        titre: "Objectif en retard",
        message: `${p.employe.nom} n'a atteint que ${p.progression} % de son objectif mensuel.`,
      }),
    );

  const ordre = { haute: 0, moyenne: 1, basse: 2 };
  return alertes.sort((a, b) => ordre[a.niveau] - ordre[b.niveau]);
}

/* ------------------------------------------------------------------ */
/* Séries pour les graphiques                                           */
/* ------------------------------------------------------------------ */

export function serieMasseSalariale(bulletins: BulletinPaie[], nbMois = 6) {
  const parMois = new Map<string, number>();
  bulletins.forEach((b) => parMois.set(b.mois, (parMois.get(b.mois) ?? 0) + salaireNet(b)));
  return [...parMois.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-nbMois)
    .map(([mois, montant]) => ({ mois, montant }));
}

export function seriePresenceHebdo(presences: Presence[], employeId?: string) {
  const filtrees = employeId ? presences.filter((p) => p.employeId === employeId) : presences;
  const parJour = new Map<string, { presents: number; retards: number; absents: number }>();
  filtrees.forEach((p) => {
    const entree = parJour.get(p.date) ?? { presents: 0, retards: 0, absents: 0 };
    if (p.statut === "present") entree.presents += 1;
    if (p.statut === "retard") entree.retards += 1;
    if (p.statut === "absent") entree.absents += 1;
    parJour.set(p.date, entree);
  });
  return [...parJour.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7)
    .map(([date, valeurs]) => ({ date, ...valeurs }));
}
