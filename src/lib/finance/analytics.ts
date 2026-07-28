import type { BulletinPaie, Employe } from "@/lib/hr/types";
import { salaireNet } from "@/lib/hr/types";
import type { Produit } from "@/lib/products/types";
import type { CommandeAchat } from "@/lib/suppliers/types";
import { montantCommande } from "@/lib/suppliers/types";
import type { Retour, Vente } from "@/lib/sales/types";
import { totalVente } from "@/lib/sales/types";

import {
  CATEGORIE_DEPENSE_LABEL,
  CATEGORIES_DEPENSE,
  estCeMois,
  estAujourdHui,
  jourISO,
  moisISO,
  pourcentage,
  statutEcheance,
  type CategorieDepense,
  type Creance,
  type Depense,
  type Dette,
  type FluxFinancier,
  type ObjectifsFinanciers,
} from "./types";

/* ------------------------------------------------------------------ */
/* Consolidation automatique des dépenses                               */
/* ------------------------------------------------------------------ */

/**
 * Fusionne les dépenses saisies manuellement avec celles générées
 * automatiquement par les autres modules (salaires payés, achats reçus).
 * Aucune double saisie n'est donc nécessaire.
 */
export function depensesConsolidees(input: {
  depenses: Depense[];
  bulletins: BulletinPaie[];
  employes: Employe[];
  commandes: CommandeAchat[];
  nomFournisseur: (id: string) => string;
}): Depense[] {
  const salaires: Depense[] = input.bulletins
    .filter((b) => b.statut !== "brouillon")
    .map((b) => {
      const employe = input.employes.find((e) => e.id === b.employeId);
      return {
        id: `D-SAL-${b.id}`,
        date: b.datePaiement ?? `${b.mois}-28T09:00:00.000Z`,
        montant: salaireNet(b),
        categorie: "salaires" as CategorieDepense,
        modePaiement: b.modePaiement === "virement" ? "virement" : b.modePaiement,
        description: `Salaire de ${employe?.nom ?? "employé"} — ${b.mois}`,
        responsable: "Bekaye Sora",
        statut: b.statut === "paye" ? ("payee" as const) : ("en_attente" as const),
        justificatif: null,
        source: "salaires" as const,
      };
    });

  const achats: Depense[] = input.commandes
    .filter((c) => c.statut === "recue")
    .map((c) => ({
      id: `D-ACH-${c.id}`,
      date: c.dateReception ?? c.date,
      montant: montantCommande(c),
      categorie: "achats" as CategorieDepense,
      modePaiement: "virement" as const,
      description: `Commande ${c.numero} — ${input.nomFournisseur(c.fournisseurId)}`,
      responsable: c.responsable,
      statut: "payee" as const,
      justificatif: null,
      source: "achats" as const,
    }));

  return [...input.depenses, ...salaires, ...achats].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

/* ------------------------------------------------------------------ */
/* Calculs de base                                                      */
/* ------------------------------------------------------------------ */

export const ventesValides = (ventes: Vente[]) => ventes.filter((v) => v.statut !== "annulee");

export const chiffreAffaires = (ventes: Vente[]) =>
  ventesValides(ventes).reduce((total, v) => total + totalVente(v), 0);

/** Coût d'achat des marchandises vendues (CAMV). */
export function coutMarchandises(ventes: Vente[], produits: Produit[]) {
  return ventesValides(ventes).reduce(
    (total, v) =>
      total +
      v.lignes.reduce((sous, l) => {
        const produit = produits.find((p) => p.id === l.produitId);
        return sous + (produit?.prixAchat ?? 0) * l.quantite;
      }, 0),
    0,
  );
}

export const totalDepenses = (depenses: Depense[]) =>
  depenses.filter((d) => d.statut !== "annulee").reduce((total, d) => total + d.montant, 0);

/** Bénéfice net = CA − coût des marchandises − dépenses de fonctionnement (hors achats). */
export function benefice(ventes: Vente[], produits: Produit[], depenses: Depense[]) {
  const marge = chiffreAffaires(ventes) - coutMarchandises(ventes, produits);
  const charges = totalDepenses(depenses.filter((d) => d.categorie !== "achats"));
  return marge - charges;
}

export const valeurStock = (produits: Produit[]) =>
  produits.reduce((total, p) => total + p.stock * p.prixAchat, 0);

/* ------------------------------------------------------------------ */
/* KPI                                                                  */
/* ------------------------------------------------------------------ */

export type KpisFinanciers = {
  caJour: number;
  caMois: number;
  beneficeJour: number;
  beneficeMois: number;
  depensesMois: number;
  tresorerie: number;
  montantCaisse: number;
  valeurStock: number;
  creances: number;
  dettes: number;
  margeBrute: number;
  margeNette: number;
};

export function kpisFinanciers(input: {
  ventes: Vente[];
  produits: Produit[];
  depenses: Depense[];
  creances: Creance[];
  dettes: Dette[];
  montantCaisse: number;
}): KpisFinanciers {
  const { ventes, produits, depenses, creances, dettes } = input;
  const ventesJour = ventes.filter((v) => estAujourdHui(v.date));
  const ventesMois = ventes.filter((v) => estCeMois(v.date));
  const depensesJour = depenses.filter((d) => estAujourdHui(d.date));
  const depensesMois = depenses.filter((d) => estCeMois(d.date));

  const caMois = chiffreAffaires(ventesMois);
  const coutMois = coutMarchandises(ventesMois, produits);
  const beneficeMois = benefice(ventesMois, produits, depensesMois);

  const creancesTotal = creances.filter((c) => !c.regle).reduce((t, c) => t + c.montant, 0);
  const dettesTotal = dettes.filter((d) => !d.regle).reduce((t, d) => t + d.montant, 0);

  return {
    caJour: chiffreAffaires(ventesJour),
    caMois,
    beneficeJour: benefice(ventesJour, produits, depensesJour),
    beneficeMois,
    depensesMois: totalDepenses(depensesMois),
    tresorerie: chiffreAffaires(ventes) - totalDepenses(depenses),
    montantCaisse: input.montantCaisse,
    valeurStock: valeurStock(produits),
    creances: creancesTotal,
    dettes: dettesTotal,
    margeBrute: caMois > 0 ? pourcentage(caMois - coutMois, caMois) : 0,
    margeNette: caMois > 0 ? pourcentage(beneficeMois, caMois) : 0,
  };
}

/* ------------------------------------------------------------------ */
/* Séries temporelles                                                   */
/* ------------------------------------------------------------------ */

export type PlageFinance = "jour" | "7j" | "30j" | "12m";

export const PLAGES_FINANCE: { value: PlageFinance; label: string }[] = [
  { value: "jour", label: "Aujourd'hui" },
  { value: "7j", label: "7 jours" },
  { value: "30j", label: "30 jours" },
  { value: "12m", label: "12 mois" },
];

export type PointFinancier = {
  label: string;
  ca: number;
  depenses: number;
  benefice: number;
};

type Seau = { label: string; cle: string };

function seaux(plage: PlageFinance): { seaux: Seau[]; cleDe: (iso: string) => string } {
  const maintenant = new Date();
  if (plage === "jour") {
    const liste: Seau[] = [];
    for (let h = 7; h <= 21; h += 2) {
      liste.push({ label: `${String(h).padStart(2, "0")}h`, cle: String(h) });
    }
    return {
      seaux: liste,
      cleDe: (iso) => {
        const d = new Date(iso);
        if (jourISO(d) !== jourISO(maintenant)) return "";
        const h = Math.min(21, Math.max(7, d.getHours()));
        return String(h % 2 === 0 ? h : h - 1);
      },
    };
  }
  if (plage === "12m") {
    const liste: Seau[] = [];
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1);
      liste.push({
        label: d.toLocaleDateString("fr-FR", { month: "short" }),
        cle: moisISO(d),
      });
    }
    return { seaux: liste, cleDe: (iso) => moisISO(iso) };
  }
  const jours = plage === "7j" ? 7 : 30;
  const liste: Seau[] = [];
  for (let i = jours - 1; i >= 0; i -= 1) {
    const d = new Date(maintenant);
    d.setDate(d.getDate() - i);
    liste.push({
      label:
        jours === 7
          ? d.toLocaleDateString("fr-FR", { weekday: "short" })
          : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      cle: jourISO(d),
    });
  }
  return { seaux: liste, cleDe: (iso) => jourISO(iso) };
}

export function serieFinanciere(input: {
  ventes: Vente[];
  produits: Produit[];
  depenses: Depense[];
  plage: PlageFinance;
}): PointFinancier[] {
  const { seaux: liste, cleDe } = seaux(input.plage);
  const index = new Map<string, PointFinancier>();
  liste.forEach((s) => index.set(s.cle, { label: s.label, ca: 0, depenses: 0, benefice: 0 }));

  ventesValides(input.ventes).forEach((v) => {
    const point = index.get(cleDe(v.date));
    if (!point) return;
    const ca = totalVente(v);
    const cout = v.lignes.reduce((sous, l) => {
      const produit = input.produits.find((p) => p.id === l.produitId);
      return sous + (produit?.prixAchat ?? 0) * l.quantite;
    }, 0);
    point.ca += ca;
    point.benefice += ca - cout;
  });

  input.depenses
    .filter((d) => d.statut !== "annulee")
    .forEach((d) => {
      const point = index.get(cleDe(d.date));
      if (!point) return;
      point.depenses += d.montant;
      if (d.categorie !== "achats") point.benefice -= d.montant;
    });

  return liste.map((s) => index.get(s.cle)!);
}

/* ------------------------------------------------------------------ */
/* Répartition des dépenses                                             */
/* ------------------------------------------------------------------ */

export type PartDepense = {
  categorie: CategorieDepense;
  label: string;
  couleur: string;
  montant: number;
  part: number;
};

export function repartitionDepenses(depenses: Depense[]): PartDepense[] {
  const actives = depenses.filter((d) => d.statut !== "annulee");
  const total = actives.reduce((t, d) => t + d.montant, 0);
  return CATEGORIES_DEPENSE.map((c) => {
    const montant = actives
      .filter((d) => d.categorie === c.value)
      .reduce((t, d) => t + d.montant, 0);
    return {
      categorie: c.value,
      label: c.label,
      couleur: c.couleur,
      montant,
      part: pourcentage(montant, total),
    };
  })
    .filter((c) => c.montant > 0)
    .sort((a, b) => b.montant - a.montant);
}

/* ------------------------------------------------------------------ */
/* Trésorerie & flux financiers                                         */
/* ------------------------------------------------------------------ */

export function fluxFinanciers(input: {
  ventes: Vente[];
  retours: Retour[];
  depenses: Depense[];
  limite?: number;
}): FluxFinancier[] {
  const flux: FluxFinancier[] = [];

  ventesValides(input.ventes).forEach((v) => {
    flux.push({
      id: `FX-V-${v.id}`,
      date: v.date,
      type: "vente",
      libelle: `Vente ${v.numero}`,
      tiers: v.client || "Client comptoir",
      montant: totalVente(v),
    });
  });

  input.retours.forEach((r) => {
    flux.push({
      id: `FX-R-${r.id}`,
      date: r.date,
      type: "retour",
      libelle: `Retour ${r.numero} · ${r.motif}`,
      tiers: r.venteNumero,
      montant: -r.montant,
    });
  });

  input.depenses
    .filter((d) => d.statut !== "annulee")
    .forEach((d) => {
      const type =
        d.source === "salaires" ? "salaire" : d.source === "achats" ? "achat" : "depense";
      flux.push({
        id: `FX-D-${d.id}`,
        date: d.date,
        type,
        libelle: d.description || CATEGORIE_DEPENSE_LABEL[d.categorie],
        tiers: d.responsable,
        montant: -d.montant,
      });
    });

  const trie = flux.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return input.limite ? trie.slice(0, input.limite) : trie;
}

export function resumeTresorerie(flux: FluxFinancier[]) {
  const entrees = flux.filter((f) => f.montant > 0).reduce((t, f) => t + f.montant, 0);
  const sorties = flux.filter((f) => f.montant < 0).reduce((t, f) => t - f.montant, 0);
  return { entrees, sorties, solde: entrees - sorties };
}

/* ------------------------------------------------------------------ */
/* Rentabilité                                                          */
/* ------------------------------------------------------------------ */

export type RentabiliteProduit = {
  produitId: string;
  nom: string;
  categorie: string;
  quantite: number;
  chiffreAffaires: number;
  benefice: number;
  marge: number;
};

export function rentabiliteProduits(ventes: Vente[], produits: Produit[]): RentabiliteProduit[] {
  const index = new Map<string, RentabiliteProduit>();

  ventesValides(ventes).forEach((v) => {
    v.lignes.forEach((l) => {
      const produit = produits.find((p) => p.id === l.produitId);
      const courant = index.get(l.produitId) ?? {
        produitId: l.produitId,
        nom: produit?.nom ?? l.nom,
        categorie: produit?.categorie ?? "Autres",
        quantite: 0,
        chiffreAffaires: 0,
        benefice: 0,
        marge: 0,
      };
      const ca = l.prixUnitaire * l.quantite;
      courant.quantite += l.quantite;
      courant.chiffreAffaires += ca;
      courant.benefice += ca - (produit?.prixAchat ?? 0) * l.quantite;
      index.set(l.produitId, courant);
    });
  });

  return [...index.values()]
    .map((p) => ({ ...p, marge: pourcentage(p.benefice, p.chiffreAffaires) }))
    .sort((a, b) => b.benefice - a.benefice);
}

export function rentabiliteCategories(rentabilites: RentabiliteProduit[]) {
  const index = new Map<string, { categorie: string; chiffreAffaires: number; benefice: number }>();
  rentabilites.forEach((p) => {
    const courant = index.get(p.categorie) ?? {
      categorie: p.categorie,
      chiffreAffaires: 0,
      benefice: 0,
    };
    courant.chiffreAffaires += p.chiffreAffaires;
    courant.benefice += p.benefice;
    index.set(p.categorie, courant);
  });
  return [...index.values()]
    .map((c) => ({ ...c, marge: pourcentage(c.benefice, c.chiffreAffaires) }))
    .sort((a, b) => b.benefice - a.benefice);
}

/* ------------------------------------------------------------------ */
/* Prévisions                                                           */
/* ------------------------------------------------------------------ */

export type Previsions = {
  joursEcoules: number;
  joursDuMois: number;
  caRealise: number;
  caPrevu: number;
  beneficeRealise: number;
  beneficePrevu: number;
  depensesPrevues: number;
  moyenneJournaliereCA: number;
  fluxJournalierNet: number;
  soldeActuel: number;
  dateRuptureTresorerie: string | null;
  joursAvantRupture: number | null;
};

export function previsionsFinancieres(input: {
  ventes: Vente[];
  produits: Produit[];
  depenses: Depense[];
  soldeActuel: number;
}): Previsions {
  const maintenant = new Date();
  const joursEcoules = maintenant.getDate();
  const joursDuMois = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0).getDate();

  const ventesMois = input.ventes.filter((v) => estCeMois(v.date));
  const depensesMois = input.depenses.filter((d) => estCeMois(d.date));

  const caRealise = chiffreAffaires(ventesMois);
  const beneficeRealise = benefice(ventesMois, input.produits, depensesMois);
  const depensesRealisees = totalDepenses(depensesMois);
  const ratio = joursDuMois / Math.max(1, joursEcoules);

  const moyenneJournaliereCA = caRealise / Math.max(1, joursEcoules);
  const moyenneJournaliereDepenses = depensesRealisees / Math.max(1, joursEcoules);
  const fluxJournalierNet = moyenneJournaliereCA - moyenneJournaliereDepenses;

  let dateRuptureTresorerie: string | null = null;
  let joursAvantRupture: number | null = null;
  if (fluxJournalierNet < 0 && input.soldeActuel > 0) {
    joursAvantRupture = Math.ceil(input.soldeActuel / Math.abs(fluxJournalierNet));
    const d = new Date();
    d.setDate(d.getDate() + joursAvantRupture);
    dateRuptureTresorerie = d.toISOString();
  }

  return {
    joursEcoules,
    joursDuMois,
    caRealise,
    caPrevu: Math.round(caRealise * ratio),
    beneficeRealise,
    beneficePrevu: Math.round(beneficeRealise * ratio),
    depensesPrevues: Math.round(depensesRealisees * ratio),
    moyenneJournaliereCA: Math.round(moyenneJournaliereCA),
    fluxJournalierNet: Math.round(fluxJournalierNet),
    soldeActuel: input.soldeActuel,
    dateRuptureTresorerie,
    joursAvantRupture,
  };
}

/* ------------------------------------------------------------------ */
/* Objectifs                                                            */
/* ------------------------------------------------------------------ */

export type ProgressionObjectif = {
  cle: "chiffreAffaires" | "benefice" | "depenses";
  label: string;
  description: string;
  realise: number;
  cible: number;
  progression: number;
  atteint: boolean;
  /** true = rester sous la cible (dépenses). */
  inverse: boolean;
};

export function progressionObjectifs(
  objectifs: ObjectifsFinanciers,
  kpis: KpisFinanciers,
): ProgressionObjectif[] {
  return [
    {
      cle: "chiffreAffaires",
      label: "Objectif de chiffre d'affaires",
      description: "Ventes encaissées ce mois-ci",
      realise: kpis.caMois,
      cible: objectifs.chiffreAffaires,
      progression: Math.min(100, pourcentage(kpis.caMois, objectifs.chiffreAffaires)),
      atteint: kpis.caMois >= objectifs.chiffreAffaires,
      inverse: false,
    },
    {
      cle: "benefice",
      label: "Objectif de bénéfice",
      description: "Bénéfice net du mois en cours",
      realise: kpis.beneficeMois,
      cible: objectifs.benefice,
      progression: Math.min(100, pourcentage(Math.max(0, kpis.beneficeMois), objectifs.benefice)),
      atteint: kpis.beneficeMois >= objectifs.benefice,
      inverse: false,
    },
    {
      cle: "depenses",
      label: "Plafond de dépenses",
      description: "Dépenses à ne pas dépasser ce mois",
      realise: kpis.depensesMois,
      cible: objectifs.plafondDepenses,
      progression: Math.min(100, pourcentage(kpis.depensesMois, objectifs.plafondDepenses)),
      atteint: kpis.depensesMois <= objectifs.plafondDepenses,
      inverse: true,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Assistant financier intelligent                                      */
/* ------------------------------------------------------------------ */

export type ConseilFinancier = {
  id: string;
  ton: "succes" | "info" | "alerte" | "danger";
  titre: string;
  message: string;
};

export function assistantFinancier(input: {
  ventes: Vente[];
  produits: Produit[];
  depenses: Depense[];
  creances: Creance[];
  dettes: Dette[];
  kpis: KpisFinanciers;
  objectifs: ObjectifsFinanciers;
  previsions: Previsions;
}): ConseilFinancier[] {
  const conseils: ConseilFinancier[] = [];
  const { kpis, previsions } = input;

  const moisPrecedentDate = new Date();
  moisPrecedentDate.setMonth(moisPrecedentDate.getMonth() - 1);
  const clePrecedent = moisISO(moisPrecedentDate);

  const ventesMois = input.ventes.filter((v) => estCeMois(v.date));
  const ventesPrecedent = input.ventes.filter((v) => moisISO(v.date) === clePrecedent);

  /* 1. Produit en forte croissance */
  const rentaMois = rentabiliteProduits(ventesMois, input.produits);
  const rentaPrecedent = rentabiliteProduits(ventesPrecedent, input.produits);
  const croissances = rentaMois
    .map((p) => {
      const avant = rentaPrecedent.find((x) => x.produitId === p.produitId);
      if (!avant || avant.chiffreAffaires <= 0) return null;
      return {
        nom: p.nom,
        evolution: pourcentage(p.chiffreAffaires - avant.chiffreAffaires, avant.chiffreAffaires),
      };
    })
    .filter((x): x is { nom: string; evolution: number } => x !== null)
    .sort((a, b) => b.evolution - a.evolution);

  if (croissances[0] && croissances[0].evolution > 5) {
    conseils.push({
      id: "croissance-produit",
      ton: "succes",
      titre: "Produit en forte progression",
      message: `Les ventes de « ${croissances[0].nom} » ont augmenté de ${croissances[0].evolution} % ce mois-ci. Pensez à sécuriser votre stock.`,
    });
  }
  const baisse = croissances.at(-1);
  if (baisse && baisse.evolution < -10) {
    conseils.push({
      id: "baisse-produit",
      ton: "alerte",
      titre: "Produit en recul",
      message: `Les ventes de « ${baisse.nom} » ont baissé de ${Math.abs(baisse.evolution)} % par rapport au mois dernier. Une promotion pourrait relancer la demande.`,
    });
  }

  /* 2. Catégorie de dépense au-dessus de la moyenne */
  const depensesMois = input.depenses.filter((d) => estCeMois(d.date) && d.statut !== "annulee");
  const depensesAvant = input.depenses.filter(
    (d) => moisISO(d.date) === clePrecedent && d.statut !== "annulee",
  );
  CATEGORIES_DEPENSE.forEach((c) => {
    const actuel = depensesMois
      .filter((d) => d.categorie === c.value)
      .reduce((t, d) => t + d.montant, 0);
    const avant = depensesAvant
      .filter((d) => d.categorie === c.value)
      .reduce((t, d) => t + d.montant, 0);
    if (avant > 0 && actuel > avant * 1.2) {
      conseils.push({
        id: `depense-${c.value}`,
        ton: "alerte",
        titre: `Dépenses ${c.label.toLowerCase()} en hausse`,
        message: `Les dépenses de ${c.label.toLowerCase()} sont supérieures de ${pourcentage(actuel - avant, avant)} % à la moyenne du mois précédent.`,
      });
    }
  });

  /* 3. Rupture de stock probable */
  const ventesRecentes = input.ventes.filter(
    (v) => new Date(v.date).getTime() > Date.now() - 30 * 86400000,
  );
  const consommation = new Map<string, number>();
  ventesValides(ventesRecentes).forEach((v) =>
    v.lignes.forEach((l) =>
      consommation.set(l.produitId, (consommation.get(l.produitId) ?? 0) + l.quantite),
    ),
  );
  const ruptures = input.produits
    .map((p) => {
      const parJour = (consommation.get(p.id) ?? 0) / 30;
      if (parJour <= 0 || p.stock <= 0) return null;
      return { nom: p.nom, jours: Math.round(p.stock / parJour) };
    })
    .filter((x): x is { nom: string; jours: number } => x !== null && x.jours <= 15)
    .sort((a, b) => a.jours - b.jours);

  if (ruptures[0]) {
    conseils.push({
      id: "rupture-stock",
      ton: "danger",
      titre: "Rupture de stock à anticiper",
      message: `Le stock de « ${ruptures[0].nom} » sera probablement épuisé dans ${ruptures[0].jours} jours au rythme actuel des ventes.`,
    });
  }

  /* 4. Marge bénéficiaire */
  const caPrecedent = chiffreAffaires(ventesPrecedent);
  const beneficePrecedent = benefice(ventesPrecedent, input.produits, depensesAvant);
  const margePrecedente = caPrecedent > 0 ? pourcentage(beneficePrecedent, caPrecedent) : 0;
  conseils.push({
    id: "marge",
    ton: kpis.margeNette >= margePrecedente ? "succes" : "alerte",
    titre: "Marge bénéficiaire",
    message: `Votre marge nette est de ${kpis.margeNette} %, ${
      kpis.margeNette >= margePrecedente ? "en hausse" : "en baisse"
    } par rapport au mois précédent (${margePrecedente} %).`,
  });

  /* 5. Objectif mensuel */
  if (previsions.caPrevu >= input.objectifs.chiffreAffaires) {
    conseils.push({
      id: "objectif-ca",
      ton: "succes",
      titre: "Objectif mensuel en bonne voie",
      message: `Au rythme actuel, le chiffre d'affaires devrait atteindre ${new Intl.NumberFormat("fr-FR").format(previsions.caPrevu)} FCFA et dépasser votre objectif mensuel.`,
    });
  } else {
    conseils.push({
      id: "objectif-ca",
      ton: "info",
      titre: "Objectif mensuel à surveiller",
      message: `La projection du mois est de ${new Intl.NumberFormat("fr-FR").format(previsions.caPrevu)} FCFA, soit ${pourcentage(previsions.caPrevu, input.objectifs.chiffreAffaires)} % de votre objectif.`,
    });
  }

  /* 6. Créances en retard */
  const enRetard = input.creances.filter((c) => statutEcheance(c) === "en_retard");
  if (enRetard.length > 0) {
    const total = enRetard.reduce((t, c) => t + c.montant, 0);
    conseils.push({
      id: "creances",
      ton: "alerte",
      titre: "Créances clients en retard",
      message: `${enRetard.length} client(s) doivent encore ${new Intl.NumberFormat("fr-FR").format(total)} FCFA au-delà de l'échéance prévue.`,
    });
  }

  /* 7. Dettes fournisseurs */
  const dettesRetard = input.dettes.filter((d) => statutEcheance(d) === "en_retard");
  if (dettesRetard.length > 0) {
    conseils.push({
      id: "dettes",
      ton: "danger",
      titre: "Dettes fournisseurs à régler",
      message: `${dettesRetard.length} échéance(s) fournisseur sont dépassées pour ${new Intl.NumberFormat("fr-FR").format(dettesRetard.reduce((t, d) => t + d.montant, 0))} FCFA.`,
    });
  }

  /* 8. Trésorerie */
  if (previsions.joursAvantRupture !== null && previsions.joursAvantRupture < 45) {
    conseils.push({
      id: "tresorerie",
      ton: "danger",
      titre: "Trésorerie sous tension",
      message: `Au rythme actuel, la trésorerie pourrait devenir négative dans ${previsions.joursAvantRupture} jours. Réduisez les dépenses non essentielles.`,
    });
  }

  return conseils;
}
