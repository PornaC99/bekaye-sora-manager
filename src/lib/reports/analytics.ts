import type { Client } from "@/lib/clients/types";
import { estFidele, estInactif, estVip } from "@/lib/clients/types";
import { CATEGORIE_DEPENSE_LABEL, type Depense } from "@/lib/finance/types";
import type { Employe, Presence } from "@/lib/hr/types";
import { expirationProche, statutProduit, type Produit } from "@/lib/products/types";
import { totalVente, type Retour, type Vente } from "@/lib/sales/types";
import type { CommandeAchat, Fournisseur } from "@/lib/suppliers/types";

import { dansPeriode, variation, type Periode } from "./types";

/**
 * Moteur d'analyse du module « Rapports & Business Intelligence ».
 * Toutes les fonctions sont pures : elles reçoivent les données des autres
 * modules et ne stockent rien. Aucune donnée n'est ressaisie.
 */

const somme = (valeurs: number[]) => valeurs.reduce((t, v) => t + v, 0);
const pct = (partie: number, total: number) =>
  total <= 0 ? 0 : Math.round((partie / total) * 100);

export const ventesPeriode = (ventes: Vente[], periode: Periode) =>
  ventes.filter((v) => v.statut !== "annulee" && dansPeriode(v.date, periode));

export const depensesPeriode = (depenses: Depense[], periode: Periode) =>
  depenses.filter((d) => d.statut !== "annulee" && dansPeriode(d.date, periode));

export const totalCommande = (commande: CommandeAchat) =>
  somme(commande.lignes.map((l) => l.prixAchat * l.quantite * (1 - (l.remise || 0) / 100)));

export function coutVente(vente: Vente, produits: Produit[]) {
  return somme(
    vente.lignes.map(
      (l) => (produits.find((p) => p.id === l.produitId)?.prixAchat ?? 0) * l.quantite,
    ),
  );
}

/* ------------------------------------------------------------------ */
/* KPIs globaux                                                         */
/* ------------------------------------------------------------------ */

export type KpisRapport = {
  chiffreAffaires: number;
  benefice: number;
  depenses: number;
  nombreVentes: number;
  produitsVendus: number;
  clientsActifs: number;
  fournisseursActifs: number;
  employesActifs: number;
  valeurStock: number;
  ruptures: number;
  margeBrute: number;
  margeNette: number;
  panierMoyen: number;
};

export function kpisRapport(input: {
  ventes: Vente[];
  produits: Produit[];
  depenses: Depense[];
  clients: Client[];
  fournisseurs: Fournisseur[];
  employes: Employe[];
  periode: Periode;
}): KpisRapport {
  const ventes = ventesPeriode(input.ventes, input.periode);
  const depenses = depensesPeriode(input.depenses, input.periode);

  const chiffreAffaires = somme(ventes.map(totalVente));
  const cout = somme(ventes.map((v) => coutVente(v, input.produits)));
  const totalDepenses = somme(depenses.map((d) => d.montant));
  const depensesHorsAchats = somme(
    depenses.filter((d) => d.categorie !== "achats").map((d) => d.montant),
  );
  const benefice = chiffreAffaires - cout - depensesHorsAchats;

  return {
    chiffreAffaires,
    benefice,
    depenses: totalDepenses,
    nombreVentes: ventes.length,
    produitsVendus: somme(ventes.flatMap((v) => v.lignes.map((l) => l.quantite))),
    clientsActifs: input.clients.filter((c) => !estInactif(c)).length,
    fournisseursActifs: input.fournisseurs.filter((f) => f.actif).length,
    employesActifs: input.employes.filter((e) => e.statut === "actif").length,
    valeurStock: somme(input.produits.map((p) => p.stock * p.prixAchat)),
    ruptures: input.produits.filter((p) => statutProduit(p) === "rupture").length,
    margeBrute: pct(chiffreAffaires - cout, chiffreAffaires),
    margeNette: pct(benefice, chiffreAffaires),
    panierMoyen: ventes.length ? Math.round(chiffreAffaires / ventes.length) : 0,
  };
}

/* ------------------------------------------------------------------ */
/* Séries d'évolution                                                   */
/* ------------------------------------------------------------------ */

export type PointRapport = {
  label: string;
  ca: number;
  ventes: number;
  benefice: number;
  depenses: number;
  stock: number;
};

type Seau = { label: string; cle: string };

function seauxPeriode(periode: Periode): { seaux: Seau[]; cleDe: (iso: string) => string } {
  const jours = Math.max(
    1,
    Math.round((periode.fin.getTime() - periode.debut.getTime()) / 86_400_000),
  );

  if (jours <= 1) {
    const seaux: Seau[] = [];
    for (let h = 7; h <= 21; h += 2) {
      seaux.push({ label: `${String(h).padStart(2, "0")}h`, cle: String(h) });
    }
    return {
      seaux,
      cleDe: (iso) => {
        const d = new Date(iso);
        const h = Math.min(21, Math.max(7, d.getHours()));
        return String(h % 2 === 0 ? h : h - 1);
      },
    };
  }

  if (jours <= 62) {
    const seaux: Seau[] = [];
    const curseur = new Date(periode.debut);
    while (curseur <= periode.fin) {
      seaux.push({
        label: curseur.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
        cle: curseur.toISOString().slice(0, 10),
      });
      curseur.setDate(curseur.getDate() + 1);
    }
    return { seaux, cleDe: (iso) => new Date(iso).toISOString().slice(0, 10) };
  }

  const seaux: Seau[] = [];
  const curseur = new Date(periode.debut.getFullYear(), periode.debut.getMonth(), 1);
  while (curseur <= periode.fin) {
    seaux.push({
      label: curseur.toLocaleDateString("fr-FR", { month: "short" }),
      cle: `${curseur.getFullYear()}-${String(curseur.getMonth() + 1).padStart(2, "0")}`,
    });
    curseur.setMonth(curseur.getMonth() + 1);
  }
  return { seaux, cleDe: (iso) => iso.slice(0, 7) };
}

export function serieRapport(input: {
  ventes: Vente[];
  produits: Produit[];
  depenses: Depense[];
  periode: Periode;
}): PointRapport[] {
  const { seaux, cleDe } = seauxPeriode(input.periode);
  const index = new Map<string, PointRapport>();
  seaux.forEach((s) =>
    index.set(s.cle, { label: s.label, ca: 0, ventes: 0, benefice: 0, depenses: 0, stock: 0 }),
  );

  const couts = new Map<string, number>();

  ventesPeriode(input.ventes, input.periode).forEach((v) => {
    const point = index.get(cleDe(v.date));
    if (!point) return;
    const ca = totalVente(v);
    const cout = coutVente(v, input.produits);
    point.ca += ca;
    point.ventes += 1;
    point.benefice += ca - cout;
    couts.set(cleDe(v.date), (couts.get(cleDe(v.date)) ?? 0) + cout);
  });

  depensesPeriode(input.depenses, input.periode).forEach((d) => {
    const point = index.get(cleDe(d.date));
    if (!point) return;
    point.depenses += d.montant;
    if (d.categorie !== "achats") point.benefice -= d.montant;
  });

  const liste = seaux.map((s) => index.get(s.cle)!);

  // Évolution estimée de la valeur du stock : on remonte le temps depuis la
  // valeur actuelle en réintégrant le coût des marchandises vendues ensuite.
  const stockActuel = somme(input.produits.map((p) => p.stock * p.prixAchat));
  let cumul = 0;
  for (let i = liste.length - 1; i >= 0; i -= 1) {
    liste[i].stock = Math.round(stockActuel + cumul);
    cumul += couts.get(seaux[i].cle) ?? 0;
  }

  return liste;
}

/* ------------------------------------------------------------------ */
/* Analyse des ventes                                                   */
/* ------------------------------------------------------------------ */

export type LigneProduitVendu = {
  produitId: string;
  nom: string;
  categorie: string;
  marque: string;
  quantite: number;
  chiffreAffaires: number;
  benefice: number;
  marge: number;
};

export function produitsVendus(ventes: Vente[], produits: Produit[]): LigneProduitVendu[] {
  const index = new Map<string, LigneProduitVendu>();
  ventes.forEach((v) =>
    v.lignes.forEach((l) => {
      const produit = produits.find((p) => p.id === l.produitId);
      const courant = index.get(l.produitId) ?? {
        produitId: l.produitId,
        nom: produit?.nom ?? l.nom,
        categorie: produit?.categorie ?? "Autres",
        marque: produit?.marque ?? "—",
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
    }),
  );
  return [...index.values()]
    .map((p) => ({ ...p, marge: pct(p.benefice, p.chiffreAffaires) }))
    .sort((a, b) => b.quantite - a.quantite);
}

export type Regroupement = { nom: string; quantite: number; chiffreAffaires: number; part: number };

function regrouper(lignes: LigneProduitVendu[], cle: "categorie" | "marque"): Regroupement[] {
  const index = new Map<string, Regroupement>();
  lignes.forEach((l) => {
    const nom = l[cle] || "Autres";
    const courant = index.get(nom) ?? { nom, quantite: 0, chiffreAffaires: 0, part: 0 };
    courant.quantite += l.quantite;
    courant.chiffreAffaires += l.chiffreAffaires;
    index.set(nom, courant);
  });
  const total = somme([...index.values()].map((c) => c.chiffreAffaires));
  return [...index.values()]
    .map((c) => ({ ...c, part: pct(c.chiffreAffaires, total) }))
    .sort((a, b) => b.chiffreAffaires - a.chiffreAffaires);
}

export type CreneauHoraire = { label: string; ventes: number; chiffreAffaires: number };

export function heuresAffluence(ventes: Vente[]): CreneauHoraire[] {
  const index = new Map<number, CreneauHoraire>();
  for (let h = 7; h <= 21; h += 1) {
    index.set(h, { label: `${String(h).padStart(2, "0")}h`, ventes: 0, chiffreAffaires: 0 });
  }
  ventes.forEach((v) => {
    const h = Math.min(21, Math.max(7, new Date(v.date).getHours()));
    const creneau = index.get(h)!;
    creneau.ventes += 1;
    creneau.chiffreAffaires += totalVente(v);
  });
  return [...index.values()];
}

const JOURS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export type JourRentable = {
  label: string;
  ventes: number;
  chiffreAffaires: number;
  benefice: number;
};

export function joursRentables(ventes: Vente[], produits: Produit[]): JourRentable[] {
  const index = new Map<number, JourRentable>();
  JOURS.forEach((label, i) => index.set(i, { label, ventes: 0, chiffreAffaires: 0, benefice: 0 }));
  ventes.forEach((v) => {
    const jour = index.get(new Date(v.date).getDay())!;
    const ca = totalVente(v);
    jour.ventes += 1;
    jour.chiffreAffaires += ca;
    jour.benefice += ca - coutVente(v, produits);
  });
  return [...index.values()].sort((a, b) => b.chiffreAffaires - a.chiffreAffaires);
}

export function analyseVentes(ventes: Vente[], produits: Produit[]) {
  const lignes = produitsVendus(ventes, produits);
  return {
    lignes,
    meilleursProduits: lignes.slice(0, 8),
    produitsFaibles: [...lignes].reverse().slice(0, 8),
    categories: regrouper(lignes, "categorie"),
    marques: regrouper(lignes, "marque"),
    heures: heuresAffluence(ventes),
    jours: joursRentables(ventes, produits),
  };
}

/* ------------------------------------------------------------------ */
/* Analyse des stocks                                                   */
/* ------------------------------------------------------------------ */

export type RotationProduit = {
  produit: Produit;
  quantiteVendue: number;
  rotation: number; // nombre de fois que le stock a tourné
  joursRestants: number | null;
};

export function rotationStocks(
  ventes: Vente[],
  produits: Produit[],
  joursPeriode: number,
): RotationProduit[] {
  const vendus = new Map<string, number>();
  ventes.forEach((v) =>
    v.lignes.forEach((l) => vendus.set(l.produitId, (vendus.get(l.produitId) ?? 0) + l.quantite)),
  );

  return produits
    .map((produit) => {
      const quantiteVendue = vendus.get(produit.id) ?? 0;
      const parJour = quantiteVendue / Math.max(1, joursPeriode);
      return {
        produit,
        quantiteVendue,
        rotation: produit.stock > 0 ? Math.round((quantiteVendue / produit.stock) * 100) / 100 : 0,
        joursRestants: parJour > 0 ? Math.round(produit.stock / parJour) : null,
      };
    })
    .sort((a, b) => b.quantiteVendue - a.quantiteVendue);
}

export function analyseStocks(ventes: Vente[], produits: Produit[], joursPeriode: number) {
  const rotations = rotationStocks(ventes, produits, joursPeriode);
  const maintenant = Date.now();
  return {
    rotations,
    forteRotation: rotations.slice(0, 6),
    faibleRotation: [...rotations].reverse().slice(0, 6),
    prochesRupture: produits
      .filter((p) => statutProduit(p) === "faible" || statutProduit(p) === "rupture")
      .sort((a, b) => a.stock - b.stock),
    expires: produits.filter(
      (p) => p.dateExpiration && new Date(p.dateExpiration).getTime() < maintenant,
    ),
    prochePeremption: produits.filter((p) => expirationProche(p, 90)),
  };
}

/* ------------------------------------------------------------------ */
/* Analyse des employés                                                 */
/* ------------------------------------------------------------------ */

export type ClassementVendeur = {
  employe: Employe;
  nombreVentes: number;
  chiffreAffaires: number;
  panierMoyen: number;
  objectif: number;
  progression: number;
  tauxPresence: number;
};

export function analyseEmployes(
  employes: Employe[],
  ventes: Vente[],
  presences: Presence[],
  periode: Periode,
): ClassementVendeur[] {
  return employes
    .map((employe) => {
      const siennes = ventes.filter((v) => v.vendeur === employe.nom);
      const chiffreAffaires = somme(siennes.map(totalVente));
      const presencesPeriode = presences.filter(
        (p) => p.employeId === employe.id && dansPeriode(p.date, periode),
      );
      const presents = presencesPeriode.filter(
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
        tauxPresence: presencesPeriode.length ? pct(presents, presencesPeriode.length) : 0,
      };
    })
    .sort((a, b) => b.chiffreAffaires - a.chiffreAffaires);
}

/* ------------------------------------------------------------------ */
/* Analyse des clients                                                  */
/* ------------------------------------------------------------------ */

export function analyseClients(clients: Client[], ventes: Vente[], periode: Periode) {
  const nouveaux = clients.filter((c) => dansPeriode(c.dateInscription, periode));
  const ca = somme(ventes.map(totalVente));
  const acheteurs = new Set(ventes.map((v) => v.client).filter(Boolean));

  return {
    total: clients.length,
    nouveaux: nouveaux.length,
    fideles: clients.filter(estFidele).length,
    vip: clients.filter(estVip).length,
    inactifs: clients.filter(estInactif).length,
    panierMoyen: ventes.length ? Math.round(ca / ventes.length) : 0,
    frequenceAchat: acheteurs.size > 0 ? Math.round((ventes.length / acheteurs.size) * 10) / 10 : 0,
    meilleurs: [...clients].sort((a, b) => b.totalDepense - a.totalDepense).slice(0, 8),
  };
}

/* ------------------------------------------------------------------ */
/* Analyse des fournisseurs                                             */
/* ------------------------------------------------------------------ */

export type LigneFournisseur = {
  fournisseur: Fournisseur;
  commandes: number;
  montant: number;
  delaiMoyen: number;
  retards: number;
};

export function analyseFournisseurs(
  fournisseurs: Fournisseur[],
  commandes: CommandeAchat[],
  periode: Periode,
): LigneFournisseur[] {
  const dansPlage = commandes.filter((c) => dansPeriode(c.date, periode));

  return fournisseurs
    .map((fournisseur) => {
      const siennes = dansPlage.filter((c) => c.fournisseurId === fournisseur.id);
      const recues = siennes.filter((c) => c.dateReception);
      const delais = recues.map((c) =>
        Math.max(
          0,
          Math.round(
            (new Date(c.dateReception!).getTime() - new Date(c.date).getTime()) / 86_400_000,
          ),
        ),
      );
      const retards = recues.filter(
        (c) => new Date(c.dateReception!).getTime() > new Date(c.dateLivraisonPrevue).getTime(),
      ).length;
      return {
        fournisseur,
        commandes: siennes.length,
        montant: somme(siennes.map(totalCommande)),
        delaiMoyen: delais.length ? Math.round(somme(delais) / delais.length) : 0,
        retards,
      };
    })
    .sort((a, b) => b.montant - a.montant);
}

/* ------------------------------------------------------------------ */
/* Prévisions                                                           */
/* ------------------------------------------------------------------ */

export type PrevisionRapport = {
  joursEcoules: number;
  joursDuMois: number;
  caRealise: number;
  caPrevu: number;
  beneficeRealise: number;
  beneficePrevu: number;
  depensesPrevues: number;
  besoins: { produit: Produit; besoinEstime: number; joursRestants: number }[];
  risquesRupture: { produit: Produit; joursRestants: number }[];
};

export function previsionsRapport(input: {
  ventes: Vente[];
  produits: Produit[];
  depenses: Depense[];
}): PrevisionRapport {
  const maintenant = new Date();
  const joursEcoules = maintenant.getDate();
  const joursDuMois = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0).getDate();
  const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
  const periodeMois: Periode = {
    cle: "mois",
    label: "Ce mois",
    debut: debutMois,
    fin: maintenant,
  };

  const ventes = ventesPeriode(input.ventes, periodeMois);
  const depenses = depensesPeriode(input.depenses, periodeMois);
  const caRealise = somme(ventes.map(totalVente));
  const cout = somme(ventes.map((v) => coutVente(v, input.produits)));
  const depensesHorsAchats = somme(
    depenses.filter((d) => d.categorie !== "achats").map((d) => d.montant),
  );
  const beneficeRealise = caRealise - cout - depensesHorsAchats;
  const ratio = joursDuMois / Math.max(1, joursEcoules);

  const consommation = new Map<string, number>();
  input.ventes
    .filter(
      (v) => v.statut !== "annulee" && Date.now() - new Date(v.date).getTime() <= 30 * 86_400_000,
    )
    .forEach((v) =>
      v.lignes.forEach((l) =>
        consommation.set(l.produitId, (consommation.get(l.produitId) ?? 0) + l.quantite),
      ),
    );

  const projections = input.produits
    .map((produit) => {
      const parJour = (consommation.get(produit.id) ?? 0) / 30;
      if (parJour <= 0) return null;
      const joursRestants = Math.round(produit.stock / parJour);
      return {
        produit,
        joursRestants,
        besoinEstime: Math.max(0, Math.ceil(parJour * 30 - produit.stock)),
      };
    })
    .filter(
      (x): x is { produit: Produit; joursRestants: number; besoinEstime: number } => x !== null,
    );

  return {
    joursEcoules,
    joursDuMois,
    caRealise,
    caPrevu: Math.round(caRealise * ratio),
    beneficeRealise,
    beneficePrevu: Math.round(beneficeRealise * ratio),
    depensesPrevues: Math.round(somme(depenses.map((d) => d.montant)) * ratio),
    besoins: projections
      .filter((p) => p.besoinEstime > 0)
      .sort((a, b) => b.besoinEstime - a.besoinEstime)
      .slice(0, 8),
    risquesRupture: projections
      .filter((p) => p.joursRestants <= 10)
      .sort((a, b) => a.joursRestants - b.joursRestants)
      .map(({ produit, joursRestants }) => ({ produit, joursRestants })),
  };
}

/* ------------------------------------------------------------------ */
/* Centre de performance                                                */
/* ------------------------------------------------------------------ */

export type ScorePerformance = {
  cle: "commerciale" | "financiere" | "stocks" | "rh" | "globale";
  label: string;
  note: number; // sur 100
  detail: string;
};

const borne = (valeur: number) => Math.max(0, Math.min(100, Math.round(valeur)));

export function scoresPerformance(input: {
  kpis: KpisRapport;
  kpisPrecedents: KpisRapport;
  produits: Produit[];
  vendeurs: ClassementVendeur[];
}): ScorePerformance[] {
  const { kpis, kpisPrecedents } = input;

  const croissance = variation(kpis.chiffreAffaires, kpisPrecedents.chiffreAffaires);
  const commerciale = borne(60 + croissance);

  const financiere = borne(kpis.margeNette * 2.2 + (kpis.benefice > 0 ? 25 : 0));

  const total = Math.max(1, input.produits.length);
  const sains = input.produits.filter((p) => statutProduit(p) === "disponible").length;
  const stocks = borne((sains / total) * 100);

  const actifs = input.vendeurs.filter((v) => v.employe.statut === "actif");
  const progressionMoyenne = actifs.length
    ? somme(actifs.map((v) => Math.min(120, v.progression))) / actifs.length
    : 0;
  const presenceMoyenne = actifs.length
    ? somme(actifs.map((v) => v.tauxPresence)) / actifs.length
    : 0;
  const rh = borne(progressionMoyenne * 0.6 + presenceMoyenne * 0.4);

  const globale = borne((commerciale + financiere + stocks + rh) / 4);

  return [
    {
      cle: "commerciale",
      label: "Performance commerciale",
      note: commerciale,
      detail: `${kpis.nombreVentes} ventes · évolution ${croissance > 0 ? "+" : ""}${croissance} %`,
    },
    {
      cle: "financiere",
      label: "Performance financière",
      note: financiere,
      detail: `Marge nette ${kpis.margeNette} % · marge brute ${kpis.margeBrute} %`,
    },
    {
      cle: "stocks",
      label: "Performance des stocks",
      note: stocks,
      detail: `${sains}/${total} produits en stock sain · ${kpis.ruptures} rupture(s)`,
    },
    {
      cle: "rh",
      label: "Performance RH",
      note: rh,
      detail: `${actifs.length} employés actifs · objectifs à ${Math.round(progressionMoyenne)} %`,
    },
    {
      cle: "globale",
      label: "Performance globale",
      note: globale,
      detail: "Moyenne des quatre indicateurs de l'entreprise",
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Alertes intelligentes                                                */
/* ------------------------------------------------------------------ */

export type AlerteRapport = {
  id: string;
  ton: "succes" | "info" | "alerte" | "danger";
  titre: string;
  message: string;
};

export function alertesIntelligentes(input: {
  kpis: KpisRapport;
  kpisPrecedents: KpisRapport;
  serie: PointRapport[];
  vendeurs: ClassementVendeur[];
  ventesLignes: LigneProduitVendu[];
  previsions: PrevisionRapport;
  depenses: Depense[];
  depensesPrecedentes: Depense[];
}): AlerteRapport[] {
  const alertes: AlerteRapport[] = [];
  const { kpis, kpisPrecedents } = input;

  const evolutionCa = variation(kpis.chiffreAffaires, kpisPrecedents.chiffreAffaires);
  const derniers = input.serie.slice(-5);
  const baisseContinue =
    derniers.length === 5 && derniers.every((p, i) => i === 0 || p.ca <= derniers[i - 1].ca);

  if (baisseContinue) {
    alertes.push({
      id: "baisse-ventes",
      ton: "danger",
      titre: "Les ventes baissent",
      message: "Le chiffre d'affaires recule sur les 5 derniers points de la période analysée.",
    });
  } else if (evolutionCa >= 5) {
    alertes.push({
      id: "hausse-ca",
      ton: "succes",
      titre: "Chiffre d'affaires en hausse",
      message: `Le chiffre d'affaires progresse de ${evolutionCa} % par rapport à la période précédente.`,
    });
  }

  if (kpis.benefice > kpisPrecedents.benefice) {
    alertes.push({
      id: "benefice",
      ton: "succes",
      titre: "Le bénéfice augmente",
      message: `Le bénéfice passe de ${kpisPrecedents.benefice.toLocaleString("fr-FR")} à ${kpis.benefice.toLocaleString("fr-FR")} FCFA.`,
    });
  }

  input.vendeurs
    .filter((v) => v.progression >= 100)
    .slice(0, 2)
    .forEach((v) =>
      alertes.push({
        id: `objectif-${v.employe.id}`,
        ton: "succes",
        titre: "Objectif dépassé",
        message: `${v.employe.nom} atteint ${v.progression} % de son objectif avec ${v.nombreVentes} ventes.`,
      }),
    );

  const dormants = input.ventesLignes.filter((l) => l.quantite === 0);
  if (dormants.length > 0) {
    alertes.push({
      id: "produit-dormant",
      ton: "alerte",
      titre: "Produits sans vente",
      message: `${dormants.length} produit(s) n'ont enregistré aucune vente sur la période.`,
    });
  }

  const totalDepenses = somme(input.depenses.map((d) => d.montant));
  const totalPrecedent = somme(input.depensesPrecedentes.map((d) => d.montant));
  if (totalPrecedent > 0 && totalDepenses > totalPrecedent * 1.15) {
    alertes.push({
      id: "depenses",
      ton: "alerte",
      titre: "Dépenses supérieures à la moyenne",
      message: `Les dépenses dépassent de ${variation(totalDepenses, totalPrecedent)} % celles de la période précédente.`,
    });
  }

  input.previsions.risquesRupture.slice(0, 2).forEach((r) =>
    alertes.push({
      id: `rupture-${r.produit.id}`,
      ton: "danger",
      titre: "Rupture imminente",
      message: `« ${r.produit.nom} » sera épuisé dans environ ${r.joursRestants} jours au rythme actuel.`,
    }),
  );

  return alertes;
}

/* ------------------------------------------------------------------ */
/* Résumé exécutif en langage naturel                                   */
/* ------------------------------------------------------------------ */

export type ResumeExecutif = {
  sante: "excellente" | "bonne" | "fragile";
  phrases: string[];
  recommandations: string[];
};

export function resumeExecutif(input: {
  kpis: KpisRapport;
  kpisPrecedents: KpisRapport;
  scores: ScorePerformance[];
  ventesLignes: LigneProduitVendu[];
  vendeurs: ClassementVendeur[];
  previsions: PrevisionRapport;
  depenses: Depense[];
  depensesPrecedentes: Depense[];
  periodeLabel: string;
}): ResumeExecutif {
  const globale = input.scores.find((s) => s.cle === "globale")?.note ?? 0;
  const sante = globale >= 80 ? "excellente" : globale >= 60 ? "bonne" : "fragile";
  const evolution = variation(input.kpis.chiffreAffaires, input.kpisPrecedents.chiffreAffaires);

  const phrases: string[] = [
    `Votre entreprise est en ${sante === "excellente" ? "excellente santé" : sante === "bonne" ? "bonne santé" : "santé fragile"} avec une note globale de ${globale}/100.`,
    `Le chiffre d'affaires ${evolution >= 0 ? "a progressé" : "a reculé"} de ${Math.abs(evolution)} % sur la période « ${input.periodeLabel.toLowerCase()} ».`,
  ];

  const meilleur = [...input.ventesLignes].sort((a, b) => b.benefice - a.benefice)[0];
  if (meilleur) {
    phrases.push(
      `${meilleur.nom} reste votre produit le plus rentable avec ${meilleur.marge} % de marge.`,
    );
  }

  const risques = input.previsions.risquesRupture.length;
  if (risques > 0) {
    phrases.push(
      `${risques} produit${risques > 1 ? "s risquent" : " risque"} une rupture dans moins de 10 jours.`,
    );
  }

  // Catégorie de dépense en plus forte hausse
  const parCategorie = (liste: Depense[]) => {
    const index = new Map<string, number>();
    liste.forEach((d) => index.set(d.categorie, (index.get(d.categorie) ?? 0) + d.montant));
    return index;
  };
  const actuelles = parCategorie(input.depenses);
  const avant = parCategorie(input.depensesPrecedentes);
  let hausse: { label: string; taux: number } | null = null;
  actuelles.forEach((montant, categorie) => {
    const ancien = avant.get(categorie) ?? 0;
    if (ancien <= 0) return;
    const taux = variation(montant, ancien);
    if (taux > 5 && (!hausse || taux > hausse.taux)) {
      hausse = {
        label:
          CATEGORIE_DEPENSE_LABEL[categorie as keyof typeof CATEGORIE_DEPENSE_LABEL] ?? categorie,
        taux,
      };
    }
  });
  if (hausse) {
    const h = hausse as { label: string; taux: number };
    phrases.push(`Les dépenses de ${h.label.toLowerCase()} ont augmenté de ${h.taux} %.`);
  }

  const top = input.vendeurs[0];
  if (top && top.nombreVentes > 0) {
    phrases.push(
      `Votre meilleur vendeur est ${top.employe.nom.split(" ")[0]} avec ${top.nombreVentes} ventes.`,
    );
  }

  const recommandations: string[] = [];
  if (risques > 0) recommandations.push("Lancez une commande d'achat pour les produits à risque.");
  if (input.kpis.margeNette < 15)
    recommandations.push("Réduisez les charges fixes ou ajustez vos prix pour améliorer la marge.");
  if (evolution < 0)
    recommandations.push("Activez une promotion ciblée sur vos produits à faible rotation.");
  if (input.kpis.ruptures > 0)
    recommandations.push(`Réapprovisionnez les ${input.kpis.ruptures} produit(s) en rupture.`);
  if (recommandations.length === 0)
    recommandations.push("Maintenez le rythme actuel : tous les indicateurs sont au vert.");

  return { sante, phrases, recommandations };
}

/* ------------------------------------------------------------------ */
/* Comparaisons                                                         */
/* ------------------------------------------------------------------ */

export type LigneComparaison = {
  label: string;
  a: number;
  b: number;
  ecart: number;
  monnaie: boolean;
};

export function comparerKpis(a: KpisRapport, b: KpisRapport): LigneComparaison[] {
  const ligne = (label: string, cle: keyof KpisRapport, monnaie = true): LigneComparaison => ({
    label,
    a: a[cle],
    b: b[cle],
    ecart: variation(b[cle], a[cle]),
    monnaie,
  });
  return [
    ligne("Chiffre d'affaires", "chiffreAffaires"),
    ligne("Bénéfice", "benefice"),
    ligne("Dépenses", "depenses"),
    ligne("Nombre de ventes", "nombreVentes", false),
    ligne("Produits vendus", "produitsVendus", false),
    ligne("Panier moyen", "panierMoyen"),
    ligne("Marge nette (%)", "margeNette", false),
  ];
}

export function comparerRetours(retours: Retour[], periode: Periode) {
  const liste = retours.filter((r) => dansPeriode(r.date, periode));
  return { nombre: liste.length, montant: somme(liste.map((r) => r.montant)) };
}
