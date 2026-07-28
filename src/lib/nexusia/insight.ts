import { useMemo } from "react";

import { useClientsStore } from "@/lib/clients/store";
import { estInactif, estVip } from "@/lib/clients/types";
import { useFinances } from "@/lib/finance/use-finance";
import { statutEcheance } from "@/lib/finance/types";
import { formatFCFA, statutProduit } from "@/lib/products/types";
import { useReports } from "@/lib/reports/use-reports";
import { construirePeriode, variation } from "@/lib/reports/types";
import { totalVente } from "@/lib/sales/types";
import { useSuppliersStore } from "@/lib/suppliers/store";

import { useNexusStore } from "./store";
import {
  formatNombre,
  INDICATEURS_OBJECTIF,
  type AlerteCritique,
  type NotificationNexus,
  type ObjectifNexus,
  type Recommandation,
  type ResultatRecherche,
} from "./types";

/* ------------------------------------------------------------------ */
/* Résumés automatiques                                                 */
/* ------------------------------------------------------------------ */

export type ResumeNexus = {
  cle: string;
  titre: string;
  phrase: string;
  lignes: { label: string; valeur: string }[];
  evolution: number | null;
};

export type SuiviObjectif = {
  objectif: ObjectifNexus;
  label: string;
  realise: number;
  progression: number;
  unite: "FCFA" | "unite";
  joursRestants: number;
};

/**
 * Agrège en une seule source toutes les analyses nécessaires au copilote.
 * Aucune donnée n'est ressaisie : tout provient des modules déjà développés.
 */
export function useNexusia() {
  const periodes = useMemo(
    () => ({
      jour: construirePeriode("aujourdhui"),
      semaine: construirePeriode("semaine"),
      mois: construirePeriode("mois"),
      annee: construirePeriode("annee"),
    }),
    [],
  );

  const jour = useReports(periodes.jour);
  const semaine = useReports(periodes.semaine);
  const mois = useReports(periodes.mois);
  const annee = useReports(periodes.annee);

  const finances = useFinances();
  const { clients } = useClientsStore();
  const { fournisseurs, commandes } = useSuppliersStore();
  const { messages, objectifs } = useNexusStore();

  return useMemo(() => {
    const resumes: ResumeNexus[] = [
      {
        cle: "jour",
        titre: "Résumé de la journée",
        phrase: `${jour.kpis.nombreVentes} vente(s) pour ${formatFCFA(jour.kpis.chiffreAffaires)} encaissés aujourd'hui.`,
        evolution: variation(jour.kpis.chiffreAffaires, jour.kpisPrecedents.chiffreAffaires),
        lignes: [
          { label: "Chiffre d'affaires", valeur: formatFCFA(jour.kpis.chiffreAffaires) },
          { label: "Bénéfice", valeur: formatFCFA(jour.kpis.benefice) },
          { label: "Panier moyen", valeur: formatFCFA(jour.kpis.panierMoyen) },
          { label: "Produits vendus", valeur: formatNombre(jour.kpis.produitsVendus) },
        ],
      },
      {
        cle: "semaine",
        titre: "Résumé de la semaine",
        phrase: `Cette semaine, l'activité représente ${formatFCFA(semaine.kpis.chiffreAffaires)} de chiffre d'affaires.`,
        evolution: variation(semaine.kpis.chiffreAffaires, semaine.kpisPrecedents.chiffreAffaires),
        lignes: [
          { label: "Ventes", valeur: formatNombre(semaine.kpis.nombreVentes) },
          { label: "Bénéfice", valeur: formatFCFA(semaine.kpis.benefice) },
          { label: "Marge nette", valeur: `${semaine.kpis.margeNette} %` },
          { label: "Clients actifs", valeur: formatNombre(semaine.kpis.clientsActifs) },
        ],
      },
      {
        cle: "mois",
        titre: "Résumé du mois",
        phrase: `Depuis le début du mois : ${formatFCFA(mois.kpis.chiffreAffaires)} de ventes et ${formatFCFA(mois.kpis.benefice)} de bénéfice.`,
        evolution: variation(mois.kpis.chiffreAffaires, mois.kpisPrecedents.chiffreAffaires),
        lignes: [
          { label: "Ventes", valeur: formatNombre(mois.kpis.nombreVentes) },
          { label: "Dépenses", valeur: formatFCFA(mois.kpis.depenses) },
          { label: "Marge brute", valeur: `${mois.kpis.margeBrute} %` },
          { label: "Panier moyen", valeur: formatFCFA(mois.kpis.panierMoyen) },
        ],
      },
      {
        cle: "finance",
        titre: "Résumé financier",
        phrase: `Trésorerie de ${formatFCFA(finances.tresorerie.solde)} avec ${formatFCFA(finances.kpis.creancesEnCours ?? 0)} en attente de règlement.`,
        evolution: variation(mois.kpis.benefice, mois.kpisPrecedents.benefice),
        lignes: [
          { label: "Encaissements", valeur: formatFCFA(finances.tresorerie.entrees) },
          { label: "Décaissements", valeur: formatFCFA(finances.tresorerie.sorties) },
          { label: "Solde", valeur: formatFCFA(finances.tresorerie.solde) },
          { label: "Valeur du stock", valeur: formatFCFA(mois.kpis.valeurStock) },
        ],
      },
      {
        cle: "commerce",
        titre: "Résumé commercial",
        phrase: `${mois.clientsAnalyse.nouveaux} nouveau(x) client(s) ce mois et ${mois.clientsAnalyse.vip} client(s) VIP au fichier.`,
        evolution: variation(mois.kpis.nombreVentes, mois.kpisPrecedents.nombreVentes),
        lignes: [
          { label: "Clients fidèles", valeur: formatNombre(mois.clientsAnalyse.fideles) },
          { label: "Clients inactifs", valeur: formatNombre(mois.clientsAnalyse.inactifs) },
          {
            label: "Meilleur produit",
            valeur: mois.ventesAnalyse.meilleursProduits[0]?.nom ?? "—",
          },
          {
            label: "Meilleur vendeur",
            valeur: mois.vendeurs[0]?.employe.nom ?? "—",
          },
        ],
      },
      {
        cle: "stock",
        titre: "Résumé du stock",
        phrase: `${mois.stocks.prochesRupture.length} produit(s) à surveiller dont ${mois.kpis.ruptures} en rupture.`,
        evolution: null,
        lignes: [
          { label: "Valeur du stock", valeur: formatFCFA(mois.kpis.valeurStock) },
          { label: "Ruptures", valeur: formatNombre(mois.kpis.ruptures) },
          { label: "Produits expirés", valeur: formatNombre(mois.stocks.expires.length) },
          {
            label: "Péremption proche",
            valeur: formatNombre(mois.stocks.prochePeremption.length),
          },
        ],
      },
    ];

    /* ---------------- Recommandations ---------------- */

    const recommandations: Recommandation[] = [];

    mois.previsions.besoins.slice(0, 3).forEach((b) =>
      recommandations.push({
        id: `cmd-${b.produit.id}`,
        ton: "info",
        impact: "fort",
        titre: `Commander ${formatNombre(b.besoinEstime)} unités supplémentaires de ${b.produit.nom}`,
        message: `Au rythme actuel, le stock couvre encore ${b.joursRestants} jour(s) de vente.`,
      }),
    );

    mois.ventesAnalyse.produitsFaibles
      .filter((p) => p.quantite > 0)
      .slice(0, 2)
      .forEach((p) =>
        recommandations.push({
          id: `faible-${p.produitId}`,
          ton: "alerte",
          impact: "moyen",
          titre: `${p.nom} se vend moins que d'habitude`,
          message: `Seulement ${p.quantite} unité(s) vendues ce mois. Une promotion ciblée peut relancer la demande.`,
        }),
      );

    const parCategorie = new Map<string, number>();
    mois.depensesDeLaPeriode.forEach((d) =>
      parCategorie.set(d.categorie, (parCategorie.get(d.categorie) ?? 0) + d.montant),
    );
    const categorieMax = [...parCategorie.entries()].sort((a, b) => b[1] - a[1])[0];
    if (categorieMax) {
      recommandations.push({
        id: "depense-cat",
        ton: "alerte",
        impact: "moyen",
        titre: `Les dépenses « ${categorieMax[0]} » pèsent le plus lourd`,
        message: `${formatFCFA(categorieMax[1])} sur le mois, soit le premier poste de charge à renégocier.`,
      });
    }

    const evolutionCa = variation(mois.kpis.chiffreAffaires, mois.kpisPrecedents.chiffreAffaires);
    recommandations.push({
      id: "tendance-ca",
      ton: evolutionCa >= 0 ? "succes" : "danger",
      impact: "fort",
      titre:
        evolutionCa >= 0 ? "Le chiffre d'affaires progresse" : "Le chiffre d'affaires recule",
      message: `Évolution de ${evolutionCa} % par rapport à la période précédente. Fin de mois estimée à ${formatFCFA(mois.previsions.caPrevu)}.`,
    });

    const performants = mois.vendeurs.filter((v) => v.progression >= 100);
    if (performants.length > 0) {
      recommandations.push({
        id: "rh-objectifs",
        ton: "succes",
        impact: "moyen",
        titre: `${performants.length} employé(s) dépassent leurs objectifs`,
        message: performants
          .slice(0, 3)
          .map((v) => `${v.employe.nom} (${v.progression} %)`)
          .join(" · "),
      });
    }

    /* ---------------- Alertes critiques ---------------- */

    const alertes: AlerteCritique[] = [];

    mois.stocks.prochesRupture.slice(0, 4).forEach((p) =>
      alertes.push({
        id: `stock-${p.id}`,
        categorie: "stock",
        gravite: statutProduit(p) === "rupture" ? "haute" : "moyenne",
        titre: statutProduit(p) === "rupture" ? "Stock épuisé" : "Stock critique",
        message: `${p.nom} : ${p.stock} unité(s) restantes pour un minimum de ${p.stockMinimum}.`,
      }),
    );

    mois.stocks.expires.slice(0, 3).forEach((p) =>
      alertes.push({
        id: `exp-${p.id}`,
        categorie: "expiration",
        gravite: "haute",
        titre: "Produit expiré",
        message: `${p.nom} a dépassé sa date d'expiration. Retirez-le de la vente.`,
      }),
    );

    if (evolutionCa <= -10) {
      alertes.push({
        id: "baisse-ventes",
        categorie: "ventes",
        gravite: "haute",
        titre: "Forte baisse des ventes",
        message: `Le chiffre d'affaires recule de ${Math.abs(evolutionCa)} % par rapport à la période précédente.`,
      });
    }

    const ecartCaisse = finances.kpis.montantCaisse ?? 0;
    if (ecartCaisse < 0) {
      alertes.push({
        id: "caisse",
        categorie: "caisse",
        gravite: "haute",
        titre: "Écart de caisse",
        message: `Le solde théorique de la caisse est négatif (${formatFCFA(ecartCaisse)}). Contrôlez la session en cours.`,
      });
    }

    finances.creances
      .filter((c) => statutEcheance(c) === "en_retard")
      .slice(0, 3)
      .forEach((c) =>
        alertes.push({
          id: `creance-${c.id}`,
          categorie: "facture",
          gravite: "moyenne",
          titre: "Facture impayée",
          message: `${c.nom} doit ${formatFCFA(c.montant)} depuis le ${new Date(c.echeance).toLocaleDateString("fr-FR")}.`,
        }),
      );

    commandes
      .filter(
        (c) =>
          !c.dateReception &&
          new Date(c.dateLivraisonPrevue).getTime() < Date.now() &&
          c.statut !== "annulee",
      )
      .slice(0, 3)
      .forEach((c) => {
        const fournisseur = fournisseurs.find((f) => f.id === c.fournisseurId);
        alertes.push({
          id: `livraison-${c.id}`,
          categorie: "livraison",
          gravite: "moyenne",
          titre: "Livraison en retard",
          message: `Commande ${c.numero} de ${fournisseur?.nom ?? "fournisseur"} attendue le ${new Date(c.dateLivraisonPrevue).toLocaleDateString("fr-FR")}.`,
        });
      });

    /* ---------------- Notifications intelligentes ---------------- */

    const notifications: NotificationNexus[] = [];
    const objectifCa = objectifs.find((o) => o.indicateur === "chiffreAffaires");
    if (objectifCa && mois.kpis.chiffreAffaires >= objectifCa.cible) {
      notifications.push({
        id: "notif-objectif",
        ton: "succes",
        titre: "Le chiffre d'affaires dépasse l'objectif",
        message: `${formatFCFA(mois.kpis.chiffreAffaires)} réalisés pour une cible de ${formatFCFA(objectifCa.cible)}.`,
      });
    }
    if (mois.kpis.benefice < mois.kpisPrecedents.benefice) {
      notifications.push({
        id: "notif-benefice",
        ton: "alerte",
        titre: "Le bénéfice diminue",
        message: `Le bénéfice passe de ${formatFCFA(mois.kpisPrecedents.benefice)} à ${formatFCFA(mois.kpis.benefice)}.`,
      });
    }
    const populaire = mois.ventesAnalyse.meilleursProduits[0];
    if (populaire) {
      notifications.push({
        id: "notif-produit",
        ton: "info",
        titre: "Un produit devient très populaire",
        message: `${populaire.nom} totalise ${populaire.quantite} unités vendues ce mois.`,
      });
    }
    const fournisseurRetard = mois.fournisseursAnalyse.find((f) => f.retards >= 1);
    if (fournisseurRetard) {
      notifications.push({
        id: "notif-fournisseur",
        ton: "alerte",
        titre: "Un fournisseur accumule des retards",
        message: `${fournisseurRetard.fournisseur.nom} : ${fournisseurRetard.retards} livraison(s) en retard.`,
      });
    }
    const vipDormant = clients
      .filter((c) => estVip(c) && estInactif(c))
      .sort((a, b) => b.totalDepense - a.totalDepense)[0];
    if (vipDormant) {
      notifications.push({
        id: "notif-vip",
        ton: "danger",
        titre: "Un client VIP n'a plus acheté depuis longtemps",
        message: `${vipDormant.nom} (${formatFCFA(vipDormant.totalDepense)} dépensés) n'est plus revenu récemment.`,
      });
    }

    /* ---------------- Centre de décision ---------------- */

    const informations = [
      `Chiffre d'affaires du mois : ${formatFCFA(mois.kpis.chiffreAffaires)} (${evolutionCa} %).`,
      `Bénéfice du mois : ${formatFCFA(mois.kpis.benefice)} pour une marge nette de ${mois.kpis.margeNette} %.`,
      `Trésorerie disponible : ${formatFCFA(finances.tresorerie.solde)}.`,
      `Produit le plus vendu : ${mois.ventesAnalyse.meilleursProduits[0]?.nom ?? "—"}.`,
      `Meilleur vendeur : ${mois.vendeurs[0]?.employe.nom ?? "—"} (${formatFCFA(mois.vendeurs[0]?.chiffreAffaires ?? 0)}).`,
    ];

    const opportunites: string[] = [];
    mois.ventesAnalyse.meilleursProduits.slice(0, 2).forEach((p) =>
      opportunites.push(
        `Renforcer le stock de ${p.nom} : ${p.marge} % de marge et forte demande.`,
      ),
    );
    if (mois.clientsAnalyse.inactifs > 0) {
      opportunites.push(
        `Relancer ${mois.clientsAnalyse.inactifs} client(s) inactif(s) par WhatsApp pour récupérer du chiffre d'affaires.`,
      );
    }
    const categoriePhare = mois.ventesAnalyse.categories[0];
    if (categoriePhare) {
      opportunites.push(
        `La catégorie ${categoriePhare.nom} représente ${categoriePhare.part} % des ventes : élargissez la gamme.`,
      );
    }
    const rapideLivreur = [...mois.fournisseursAnalyse]
      .filter((f) => f.commandes > 0)
      .sort((a, b) => a.delaiMoyen - b.delaiMoyen)[0];
    if (rapideLivreur) {
      opportunites.push(
        `${rapideLivreur.fournisseur.nom} livre en ${rapideLivreur.delaiMoyen} jour(s) : négociez un volume plus important.`,
      );
    }

    /* ---------------- Suivi des objectifs ---------------- */

    const valeurIndicateur = (cle: ObjectifNexus["indicateur"]) => {
      switch (cle) {
        case "chiffreAffaires":
          return mois.kpis.chiffreAffaires;
        case "benefice":
          return mois.kpis.benefice;
        case "ventes":
          return mois.kpis.nombreVentes;
        case "clients":
          return mois.clientsAnalyse.nouveaux;
        case "panierMoyen":
          return mois.kpis.panierMoyen;
      }
    };

    const suivis: SuiviObjectif[] = objectifs.map((objectif) => {
      const info = INDICATEURS_OBJECTIF.find((i) => i.value === objectif.indicateur)!;
      const realise = valeurIndicateur(objectif.indicateur);
      return {
        objectif,
        label: info.label,
        unite: info.unite,
        realise,
        progression: objectif.cible > 0 ? Math.round((realise / objectif.cible) * 100) : 0,
        joursRestants: Math.max(
          0,
          Math.ceil((new Date(objectif.echeance).getTime() - Date.now()) / 86_400_000),
        ),
      };
    });

    /* ---------------- Recherche globale ---------------- */

    const index: ResultatRecherche[] = [
      ...mois.produits.map((p) => ({
        id: `p-${p.id}`,
        type: "Produit" as const,
        titre: p.nom,
        detail: `${p.categorie} · ${p.stock} en stock · ${formatFCFA(p.prixVente)}`,
        to: "/produits",
      })),
      ...clients.map((c) => ({
        id: `c-${c.id}`,
        type: "Client" as const,
        titre: c.nom,
        detail: `${c.numero} · ${formatFCFA(c.totalDepense)} dépensés · ${c.points} points`,
        to: "/clients",
      })),
      ...mois.employes.map((e) => ({
        id: `e-${e.id}`,
        type: "Employé" as const,
        titre: e.nom,
        detail: `${e.fonction} · ${e.matricule}`,
        to: "/employes",
      })),
      ...mois.ventes.slice(0, 200).map((v) => ({
        id: `v-${v.id}`,
        type: "Facture" as const,
        titre: v.numero,
        detail: `${v.client || "Client comptoir"} · ${formatFCFA(totalVente(v))} · ${new Date(v.date).toLocaleDateString("fr-FR")}`,
        to: "/ventes",
      })),
      ...fournisseurs.map((f) => ({
        id: `f-${f.id}`,
        type: "Fournisseur" as const,
        titre: f.nom,
        detail: `${f.ville} · livraison ${f.delaiLivraisonJours} j`,
        to: "/fournisseurs",
      })),
      ...[
        { nom: "Rapport quotidien", to: "/nexusia/rapports" },
        { nom: "Rapport hebdomadaire", to: "/nexusia/rapports" },
        { nom: "Rapport mensuel", to: "/nexusia/rapports" },
        { nom: "Rapport annuel", to: "/nexusia/rapports" },
        { nom: "Analyse financière", to: "/nexusia/finances" },
        { nom: "Analyse des produits", to: "/nexusia/produits" },
      ].map((r, i) => ({
        id: `r-${i}`,
        type: "Rapport" as const,
        titre: r.nom,
        detail: "Génération automatique par NEXUSIA",
        to: r.to,
      })),
    ];

    return {
      periodes,
      jour,
      semaine,
      mois,
      annee,
      finances,
      clients,
      fournisseurs,
      commandes,
      messages,
      objectifs,
      resumes,
      recommandations,
      alertes,
      notifications,
      decision: {
        informations: informations.slice(0, 5),
        urgences: alertes.slice(0, 5),
        recommandations: recommandations.slice(0, 5),
        opportunites: opportunites.slice(0, 5),
      },
      suivis,
      index,
    };
  }, [jour, semaine, mois, annee, finances, clients, fournisseurs, commandes, messages, objectifs, periodes]);
}

export type DonneesNexusia = ReturnType<typeof useNexusia>;

export function rechercherGlobal(index: ResultatRecherche[], terme: string) {
  const q = terme.trim().toLowerCase();
  if (q.length < 2) return [];
  return index
    .filter((r) => `${r.titre} ${r.detail} ${r.type}`.toLowerCase().includes(q))
    .slice(0, 40);
}
