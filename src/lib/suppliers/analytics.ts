import type { LigneHistorique, Produit } from "@/lib/products/types";
import { statutProduit } from "@/lib/products/types";

import {
  commandeEnRetard,
  montantCommande,
  quantiteCommande,
  type CommandeAchat,
  type Fournisseur,
} from "./types";

const JOUR = 86_400_000;
const jours = (iso: string) => (Date.now() - new Date(iso).getTime()) / JOUR;

/* ------------------------------------------------------------------ */
/* KPI                                                                  */
/* ------------------------------------------------------------------ */

export function kpisFournisseurs(fournisseurs: Fournisseur[], commandes: CommandeAchat[]) {
  const enAttente = commandes.filter((c) => !["recue", "annulee", "brouillon"].includes(c.statut));
  const recues = commandes.filter((c) => c.statut === "recue");

  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);
  const achatsMois = commandes
    .filter((c) => c.statut !== "annulee" && new Date(c.date) >= debutMois)
    .reduce((acc, c) => acc + montantCommande(c), 0);

  const parFournisseur = new Map<string, number>();
  commandes
    .filter((c) => c.statut !== "annulee")
    .forEach((c) =>
      parFournisseur.set(
        c.fournisseurId,
        (parFournisseur.get(c.fournisseurId) ?? 0) + montantCommande(c),
      ),
    );
  const principalId = [...parFournisseur.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const principal = fournisseurs.find((f) => f.id === principalId) ?? null;

  return {
    total: fournisseurs.length,
    actifs: fournisseurs.filter((f) => f.actif).length,
    enAttente: enAttente.length,
    recues: recues.length,
    achatsMois,
    principal,
    montantPrincipal: principalId ? (parFournisseur.get(principalId) ?? 0) : 0,
    retards: commandes.filter(commandeEnRetard).length,
  };
}

export function totalAchatsFournisseur(fournisseurId: string, commandes: CommandeAchat[]) {
  return commandes
    .filter((c) => c.fournisseurId === fournisseurId && c.statut !== "annulee")
    .reduce((acc, c) => acc + montantCommande(c), 0);
}

export function produitsDuFournisseur(fournisseur: Fournisseur, produits: Produit[]) {
  return produits.filter((p) => p.fournisseur === fournisseur.nom);
}

/* ------------------------------------------------------------------ */
/* Analyse fournisseurs                                                 */
/* ------------------------------------------------------------------ */

export type AnalyseFournisseur = {
  fournisseur: Fournisseur;
  montant: number;
  nombreCommandes: number;
  delaiMoyen: number | null;
  tauxRespect: number | null;
  quantite: number;
};

export function analyseFournisseurs(
  fournisseurs: Fournisseur[],
  commandes: CommandeAchat[],
): AnalyseFournisseur[] {
  return fournisseurs
    .map((fournisseur) => {
      const liees = commandes.filter(
        (c) => c.fournisseurId === fournisseur.id && c.statut !== "annulee",
      );
      const recues = liees.filter((c) => c.statut === "recue" && c.dateReception);

      const delais = recues.map(
        (c) => (new Date(c.dateReception!).getTime() - new Date(c.date).getTime()) / JOUR,
      );
      const respect = recues.filter(
        (c) => new Date(c.dateReception!).getTime() <= new Date(c.dateLivraisonPrevue).getTime(),
      );

      return {
        fournisseur,
        montant: liees.reduce((acc, c) => acc + montantCommande(c), 0),
        nombreCommandes: liees.length,
        quantite: liees.reduce((acc, c) => acc + quantiteCommande(c), 0),
        delaiMoyen: delais.length ? delais.reduce((a, b) => a + b, 0) / delais.length : null,
        tauxRespect: recues.length ? (respect.length / recues.length) * 100 : null,
      };
    })
    .sort((a, b) => b.montant - a.montant);
}

export function produitsLesPlusAchetes(commandes: CommandeAchat[], limite = 8) {
  const map = new Map<string, { nom: string; quantite: number; montant: number }>();
  commandes
    .filter((c) => c.statut !== "annulee")
    .forEach((c) =>
      c.lignes.forEach((l) => {
        const courant = map.get(l.produitId) ?? { nom: l.nom, quantite: 0, montant: 0 };
        courant.quantite += l.quantite;
        courant.montant += l.quantite * l.prixAchat * (1 - l.remise / 100);
        map.set(l.produitId, courant);
      }),
    );
  return [...map.entries()]
    .map(([produitId, valeur]) => ({ produitId, ...valeur }))
    .sort((a, b) => b.quantite - a.quantite)
    .slice(0, limite);
}

/* ------------------------------------------------------------------ */
/* Alertes intelligentes                                                */
/* ------------------------------------------------------------------ */

export type AlerteFournisseur = {
  id: string;
  niveau: "critique" | "attention" | "info";
  titre: string;
  message: string;
};

export function alertesApprovisionnement(
  produits: Produit[],
  fournisseurs: Fournisseur[],
  commandes: CommandeAchat[],
): AlerteFournisseur[] {
  const alertes: AlerteFournisseur[] = [];

  produits
    .filter((p) => p.actif && statutProduit(p) === "rupture")
    .forEach((p) =>
      alertes.push({
        id: `rupture-${p.id}`,
        niveau: "critique",
        titre: "Produit en rupture",
        message: `${p.nom} est épuisé — fournisseur habituel : ${p.fournisseur}.`,
      }),
    );

  produits
    .filter((p) => p.actif && statutProduit(p) === "faible")
    .forEach((p) =>
      alertes.push({
        id: `faible-${p.id}`,
        niveau: "attention",
        titre: "Produit bientôt en rupture",
        message: `${p.nom} : ${p.stock} unité(s) restantes (seuil ${p.stockMinimum}). À recommander chez ${p.fournisseur}.`,
      }),
    );

  commandes.filter(commandeEnRetard).forEach((c) => {
    const f = fournisseurs.find((x) => x.id === c.fournisseurId);
    const retard = Math.round(jours(c.dateLivraisonPrevue));
    alertes.push({
      id: `retard-${c.id}`,
      niveau: "critique",
      titre: "Livraison en retard",
      message: `${c.numero} (${f?.nom ?? "—"}) accuse ${retard} jour(s) de retard.`,
    });
  });

  commandes
    .filter((c) => c.statut === "expediee" && !commandeEnRetard(c))
    .forEach((c) =>
      alertes.push({
        id: `non-recue-${c.id}`,
        niveau: "info",
        titre: "Commande non réceptionnée",
        message: `${c.numero} est expédiée : pensez à la réceptionner à son arrivée.`,
      }),
    );

  fournisseurs
    .filter((f) => f.actif)
    .forEach((f) => {
      const derniere = commandes
        .filter((c) => c.fournisseurId === f.id)
        .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
      if (!derniere || jours(derniere.date) > 90) {
        alertes.push({
          id: `inactif-${f.id}`,
          niveau: "info",
          titre: "Fournisseur inactif",
          message: `${f.nom} n'a reçu aucune commande depuis plus de 3 mois.`,
        });
      }
    });

  const ordre = { critique: 0, attention: 1, info: 2 } as const;
  return alertes.sort((a, b) => ordre[a.niveau] - ordre[b.niveau]);
}

/* ------------------------------------------------------------------ */
/* BONUS — Assistant intelligent d'approvisionnement                    */
/* ------------------------------------------------------------------ */

export type SuggestionAppro = {
  produit: Produit;
  ventes30: number;
  ventes60: number;
  ventes90: number;
  moyenneJournaliere: number;
  joursAvantRupture: number | null;
  quantiteRecommandee: number;
  fournisseur: Fournisseur | null;
  delai: number;
  dateIdeale: string | null;
  priorite: "haute" | "moyenne" | "basse";
  montantEstime: number;
  motif: string;
};

function ventesSur(ventes: LigneHistorique[], produitId: string, nbJours: number) {
  return ventes
    .filter((v) => v.produitId === produitId && jours(v.date) <= nbJours)
    .reduce((acc, v) => acc + v.quantite, 0);
}

/**
 * Analyse les ventes des 30/60/90 derniers jours, le stock disponible et le
 * délai de livraison de chaque fournisseur pour proposer un plan de réassort.
 */
export function suggestionsApprovisionnement(
  produits: Produit[],
  ventes: LigneHistorique[],
  fournisseurs: Fournisseur[],
  commandes: CommandeAchat[],
  couvertureJours = 45,
): SuggestionAppro[] {
  const enCours = new Map<string, number>();
  commandes
    .filter((c) => !["recue", "annulee"].includes(c.statut))
    .forEach((c) =>
      c.lignes.forEach((l) =>
        enCours.set(l.produitId, (enCours.get(l.produitId) ?? 0) + l.quantite),
      ),
    );

  return produits
    .filter((p) => p.actif)
    .map((produit) => {
      const ventes30 = ventesSur(ventes, produit.id, 30);
      const ventes60 = ventesSur(ventes, produit.id, 60);
      const ventes90 = ventesSur(ventes, produit.id, 90);

      // Moyenne pondérée : le passé récent pèse davantage.
      const moyenneJournaliere =
        (ventes30 / 30) * 0.5 + (ventes60 / 60) * 0.3 + (ventes90 / 90) * 0.2;

      const stockUtile = produit.stock + (enCours.get(produit.id) ?? 0);
      const joursAvantRupture =
        moyenneJournaliere > 0 ? Math.round(stockUtile / moyenneJournaliere) : null;

      const fournisseur =
        fournisseurs.find((f) => f.nom === produit.fournisseur && f.actif) ??
        fournisseurs.find((f) => f.nom === produit.fournisseur) ??
        null;
      const delai = fournisseur?.delaiLivraisonJours ?? 10;

      const besoin = Math.ceil(moyenneJournaliere * (couvertureJours + delai)) - stockUtile;
      const quantiteRecommandee = Math.max(
        0,
        Math.ceil(
          Math.max(
            besoin,
            produit.stock <= produit.stockMinimum ? produit.stockMinimum * 2 - stockUtile : 0,
          ) / 10,
        ) * 10,
      );

      const priorite: SuggestionAppro["priorite"] =
        produit.stock <= 0 || (joursAvantRupture !== null && joursAvantRupture <= delai)
          ? "haute"
          : produit.stock <= produit.stockMinimum ||
              (joursAvantRupture !== null && joursAvantRupture <= delai + 15)
            ? "moyenne"
            : "basse";

      const dateIdeale =
        joursAvantRupture !== null
          ? new Date(Date.now() + Math.max(0, joursAvantRupture - delai) * JOUR).toISOString()
          : null;

      const motif =
        produit.stock <= 0
          ? "Produit en rupture : réassort immédiat indispensable."
          : joursAvantRupture !== null && joursAvantRupture <= delai
            ? `Rupture estimée dans ${joursAvantRupture} jour(s), soit avant le délai de livraison (${delai} j).`
            : produit.stock <= produit.stockMinimum
              ? "Stock sous le seuil minimum défini."
              : `Rythme de vente de ${moyenneJournaliere.toFixed(1)} unité(s)/jour sur 90 jours.`;

      return {
        produit,
        ventes30,
        ventes60,
        ventes90,
        moyenneJournaliere,
        joursAvantRupture,
        quantiteRecommandee,
        fournisseur,
        delai,
        dateIdeale,
        priorite,
        montantEstime: quantiteRecommandee * produit.prixAchat,
        motif,
      };
    })
    .filter((s) => s.quantiteRecommandee > 0)
    .sort((a, b) => {
      const ordre = { haute: 0, moyenne: 1, basse: 2 } as const;
      if (ordre[a.priorite] !== ordre[b.priorite]) return ordre[a.priorite] - ordre[b.priorite];
      return (a.joursAvantRupture ?? 999) - (b.joursAvantRupture ?? 999);
    });
}
