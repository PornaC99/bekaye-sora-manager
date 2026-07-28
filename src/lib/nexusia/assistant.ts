import { formatFCFA } from "@/lib/products/types";
import { estInactif, estVip } from "@/lib/clients/types";
import { variation } from "@/lib/reports/types";

import type { DonneesNexusia } from "./insight";
import { formatNombre, type PointReponse, type ReponseNexus } from "./types";

/**
 * Conseiller décisionnel : transforme une question en langage naturel
 * en une réponse structurée calculée sur les données réelles de l'entreprise.
 * Aucune ressaisie : chaque réponse interroge les modules existants.
 */

type Regle = {
  cle: string;
  motsCles: string[];
  construire: (d: DonneesNexusia) => Omit<ReponseNexus, "id" | "question">;
};

const sansAccent = (texte: string) =>
  texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const REGLES: Regle[] = [
  {
    cle: "ca-jour",
    motsCles: ["chiffre d'affaires aujourd", "ca aujourd", "vendu aujourd", "recette du jour", "journee"],
    construire: (d) => {
      const evolution = variation(d.jour.kpis.chiffreAffaires, d.jour.kpisPrecedents.chiffreAffaires);
      return {
        titre: "Chiffre d'affaires du jour",
        texte: `Aujourd'hui, vous avez réalisé ${formatFCFA(d.jour.kpis.chiffreAffaires)} sur ${d.jour.kpis.nombreVentes} vente(s), soit ${evolution} % par rapport à hier.`,
        points: [
          { label: "Chiffre d'affaires", valeur: formatFCFA(d.jour.kpis.chiffreAffaires) },
          { label: "Bénéfice", valeur: formatFCFA(d.jour.kpis.benefice) },
          { label: "Panier moyen", valeur: formatFCFA(d.jour.kpis.panierMoyen) },
          {
            label: "Évolution",
            valeur: `${evolution} %`,
            ton: evolution >= 0 ? "succes" : "danger",
          },
        ],
        conseil:
          evolution >= 0
            ? "La dynamique est bonne : maintenez la disponibilité des produits phares."
            : "Ciblez une relance WhatsApp sur vos clients fidèles pour rattraper la journée.",
        lien: { to: "/ventes", label: "Voir les ventes" },
      };
    },
  },
  {
    cle: "meilleurs-produits",
    motsCles: ["se vendent le mieux", "meilleurs produits", "produit le plus vendu", "top produits"],
    construire: (d) => ({
      titre: "Produits les plus vendus ce mois",
      texte: `Vos meilleures ventes du mois sont menées par ${d.mois.ventesAnalyse.meilleursProduits[0]?.nom ?? "aucun produit"}.`,
      points: d.mois.ventesAnalyse.meilleursProduits.slice(0, 5).map<PointReponse>((p) => ({
        label: p.nom,
        valeur: `${formatNombre(p.quantite)} u. · ${formatFCFA(p.chiffreAffaires)}`,
      })),
      conseil: "Sécurisez le réapprovisionnement de ces références avant la fin du mois.",
      lien: { to: "/nexusia/produits", label: "Analyse des produits" },
    }),
  },
  {
    cle: "rupture",
    motsCles: ["rupture", "stock critique", "manquer", "reappro"],
    construire: (d) => ({
      titre: "Produits à risque de rupture",
      texte: `${d.mois.previsions.risquesRupture.length} produit(s) risquent une rupture dans les 10 prochains jours.`,
      points: d.mois.previsions.risquesRupture.slice(0, 5).map<PointReponse>((r) => ({
        label: r.produit.nom,
        valeur: `${r.joursRestants} jour(s) de couverture`,
        ton: r.joursRestants <= 3 ? "danger" : "alerte",
      })),
      conseil: "Passez commande dès maintenant pour éviter les ventes perdues.",
      lien: { to: "/fournisseurs/commandes", label: "Préparer une commande" },
    }),
  },
  {
    cle: "vendeur",
    motsCles: ["vendeur", "employe vend", "meilleur employe", "performant"],
    construire: (d) => ({
      titre: "Performance de l'équipe de vente",
      texte: d.mois.vendeurs[0]
        ? `${d.mois.vendeurs[0].employe.nom} est votre meilleur vendeur ce mois avec ${formatFCFA(d.mois.vendeurs[0].chiffreAffaires)}.`
        : "Aucune vente n'est encore rattachée à un vendeur ce mois.",
      points: d.mois.vendeurs.slice(0, 5).map<PointReponse>((v) => ({
        label: v.employe.nom,
        valeur: `${formatFCFA(v.chiffreAffaires)} · objectif ${v.progression} %`,
        ton: v.progression >= 100 ? "succes" : v.progression >= 60 ? "info" : "alerte",
      })),
      conseil: "Valorisez les meilleurs résultats et accompagnez les vendeurs sous les 60 %.",
      lien: { to: "/nexusia/employes", label: "Analyse des employés" },
    }),
  },
  {
    cle: "gain-mois",
    motsCles: ["gagne ce mois", "benefice", "profit", "rentable ce mois"],
    construire: (d) => ({
      titre: "Résultat du mois",
      texte: `Vous avez dégagé ${formatFCFA(d.mois.kpis.benefice)} de bénéfice pour ${formatFCFA(d.mois.kpis.chiffreAffaires)} de ventes, soit une marge nette de ${d.mois.kpis.margeNette} %.`,
      points: [
        { label: "Chiffre d'affaires", valeur: formatFCFA(d.mois.kpis.chiffreAffaires) },
        { label: "Dépenses", valeur: formatFCFA(d.mois.kpis.depenses) },
        { label: "Bénéfice", valeur: formatFCFA(d.mois.kpis.benefice) },
        { label: "Fin de mois estimée", valeur: formatFCFA(d.mois.previsions.caPrevu), ton: "info" },
      ],
      conseil: "Comparez cette marge avec votre objectif mensuel pour ajuster vos achats.",
      lien: { to: "/nexusia/finances", label: "Analyse financière" },
    }),
  },
  {
    cle: "clients-fideles",
    motsCles: ["clients fideles", "meilleurs clients", "vip", "fidelite"],
    construire: (d) => ({
      titre: "Vos clients les plus fidèles",
      texte: `${d.mois.clientsAnalyse.fideles} client(s) fidèles et ${d.mois.clientsAnalyse.vip} client(s) VIP composent votre socle commercial.`,
      points: d.mois.clientsAnalyse.meilleurs.slice(0, 5).map<PointReponse>((c) => ({
        label: c.nom,
        valeur: `${formatFCFA(c.totalDepense)} · ${c.nombreAchats} achats`,
        ton: estVip(c) ? "succes" : "info",
      })),
      conseil: "Offrez un avantage fidélité aux trois premiers pour sécuriser leur récurrence.",
      lien: { to: "/nexusia/clients", label: "Analyse des clients" },
    }),
  },
  {
    cle: "depenses",
    motsCles: ["depense", "charges", "couts", "cout"],
    construire: (d) => {
      const parCategorie = new Map<string, number>();
      d.mois.depensesDeLaPeriode.forEach((x) =>
        parCategorie.set(x.categorie, (parCategorie.get(x.categorie) ?? 0) + x.montant),
      );
      const lignes = [...parCategorie.entries()].sort((a, b) => b[1] - a[1]);
      const evolution = variation(d.mois.kpis.depenses, d.mois.kpisPrecedents.depenses);
      return {
        titre: "Évolution des dépenses",
        texte: `Les dépenses du mois atteignent ${formatFCFA(d.mois.kpis.depenses)}, soit ${evolution} % par rapport à la période précédente.`,
        points: lignes.slice(0, 5).map<PointReponse>(([nom, montant]) => ({
          label: nom,
          valeur: formatFCFA(montant),
        })),
        conseil:
          evolution > 10
            ? "Concentrez-vous sur le premier poste de charge : une renégociation aura l'impact le plus rapide."
            : "Les charges restent maîtrisées, conservez ce rythme.",
        lien: { to: "/depenses", label: "Voir les dépenses" },
      };
    },
  },
  {
    cle: "fournisseurs",
    motsCles: ["fournisseur", "livraison", "delai"],
    construire: (d) => {
      const classement = [...d.mois.fournisseursAnalyse]
        .filter((f) => f.commandes > 0)
        .sort((a, b) => a.delaiMoyen - b.delaiMoyen);
      return {
        titre: "Fiabilité des fournisseurs",
        texte: classement[0]
          ? `${classement[0].fournisseur.nom} est le plus rapide avec ${classement[0].delaiMoyen} jour(s) de délai moyen.`
          : "Aucune commande réceptionnée sur la période analysée.",
        points: classement.slice(0, 5).map<PointReponse>((f) => ({
          label: f.fournisseur.nom,
          valeur: `${f.delaiMoyen} j · ${f.retards} retard(s)`,
          ton: f.retards > 0 ? "alerte" : "succes",
        })),
        conseil: "Privilégiez les fournisseurs rapides pour les produits à forte rotation.",
        lien: { to: "/fournisseurs", label: "Voir les fournisseurs" },
      };
    },
  },
  {
    cle: "baisse-ventes",
    motsCles: ["pourquoi les ventes baissent", "ventes baissent", "baisse des ventes"],
    construire: (d) => {
      const evolution = variation(
        d.mois.kpis.chiffreAffaires,
        d.mois.kpisPrecedents.chiffreAffaires,
      );
      const dormants = d.mois.ventesAnalyse.produitsFaibles.slice(0, 3);
      return {
        titre: "Analyse de la tendance des ventes",
        texte:
          evolution >= 0
            ? `Vos ventes ne baissent pas : elles progressent de ${evolution} % sur la période.`
            : `Vos ventes reculent de ${Math.abs(evolution)} %. Les ruptures et les produits dormants expliquent l'essentiel de l'écart.`,
        points: [
          { label: "Ruptures en cours", valeur: formatNombre(d.mois.kpis.ruptures), ton: "alerte" },
          {
            label: "Clients inactifs",
            valeur: formatNombre(d.mois.clientsAnalyse.inactifs),
            ton: "alerte",
          },
          ...dormants.map<PointReponse>((p) => ({
            label: `Faible rotation · ${p.nom}`,
            valeur: `${p.quantite} u. vendues`,
          })),
        ],
        conseil: "Réapprovisionnez les produits en rupture puis relancez les clients inactifs.",
        lien: { to: "/nexusia/decision", label: "Centre de décision" },
      };
    },
  },
  {
    cle: "produit-rentable",
    motsCles: ["rapporte le plus", "plus rentable", "meilleure marge"],
    construire: (d) => {
      const classement = [...d.mois.ventesAnalyse.lignes].sort((a, b) => b.benefice - a.benefice);
      return {
        titre: "Produits les plus rentables",
        texte: classement[0]
          ? `${classement[0].nom} génère le plus de bénéfice ce mois : ${formatFCFA(classement[0].benefice)} pour ${classement[0].marge} % de marge.`
          : "Aucune vente enregistrée sur la période.",
        points: classement.slice(0, 5).map<PointReponse>((p) => ({
          label: p.nom,
          valeur: `${formatFCFA(p.benefice)} · ${p.marge} %`,
          ton: p.marge >= 30 ? "succes" : "info",
        })),
        conseil: "Mettez ces références en avant en caisse et dans vos promotions.",
        lien: { to: "/nexusia/produits", label: "Analyse des produits" },
      };
    },
  },
  {
    cle: "magasin",
    motsCles: ["magasin", "boutique", "point de vente"],
    construire: (d) => ({
      titre: "Performance des points de vente",
      texte: `L'activité est aujourd'hui centralisée sur votre magasin principal : ${formatFCFA(d.mois.kpis.chiffreAffaires)} ce mois.`,
      points: [
        { label: "Ventes du mois", valeur: formatNombre(d.mois.kpis.nombreVentes) },
        { label: "Panier moyen", valeur: formatFCFA(d.mois.kpis.panierMoyen) },
        { label: "Valeur du stock", valeur: formatFCFA(d.mois.kpis.valeurStock) },
      ],
      conseil: "Ajoutez vos autres magasins dans l'Administration pour les comparer ici.",
      lien: { to: "/administration/magasins", label: "Gérer les magasins" },
    }),
  },
  {
    cle: "produits-dormants",
    motsCles: ["ne se vendent plus", "produits dormants", "sans vente", "invendu"],
    construire: (d) => {
      const dormants = d.mois.stocks.faibleRotation;
      return {
        titre: "Produits qui ne se vendent plus",
        texte: `${dormants.length} référence(s) présentent la plus faible rotation ce mois.`,
        points: dormants.slice(0, 5).map<PointReponse>((r) => ({
          label: r.produit.nom,
          valeur: `${r.quantiteVendue} u. vendues · ${r.produit.stock} en stock`,
          ton: "alerte",
        })),
        conseil: "Déstockez en lot ou associez-les en offre groupée avec vos produits phares.",
        lien: { to: "/produits", label: "Voir le catalogue" },
      };
    },
  },
  {
    cle: "tresorerie",
    motsCles: ["tresorerie", "caisse", "liquidite", "argent disponible"],
    construire: (d) => ({
      titre: "Situation de trésorerie",
      texte: `Votre solde de trésorerie s'établit à ${formatFCFA(d.finances.tresorerie.solde)}.`,
      points: [
        { label: "Encaissements", valeur: formatFCFA(d.finances.tresorerie.entrees), ton: "succes" },
        { label: "Décaissements", valeur: formatFCFA(d.finances.tresorerie.sorties), ton: "alerte" },
        { label: "Créances clients", valeur: formatFCFA(d.finances.kpis.creances) },
        { label: "Dettes fournisseurs", valeur: formatFCFA(d.finances.kpis.dettes) },
      ],
      conseil: "Recouvrez les créances échues avant d'engager de nouvelles commandes.",
      lien: { to: "/depenses/tresorerie", label: "Voir la trésorerie" },
    }),
  },
  {
    cle: "clients-perdus",
    motsCles: ["clients perdus", "clients inactifs", "ne reviennent plus"],
    construire: (d) => {
      const perdus = d.clients.filter(estInactif).sort((a, b) => b.totalDepense - a.totalDepense);
      return {
        titre: "Clients à reconquérir",
        texte: `${perdus.length} client(s) n'ont plus acheté depuis longtemps.`,
        points: perdus.slice(0, 5).map<PointReponse>((c) => ({
          label: c.nom,
          valeur: `${formatFCFA(c.totalDepense)} · ${c.nombreAchats} achats`,
          ton: estVip(c) ? "danger" : "alerte",
        })),
        conseil: "Envoyez une promotion personnalisée aux clients VIP inactifs en priorité.",
        lien: { to: "/nexusia/clients", label: "Analyse des clients" },
      };
    },
  },
];

function reponseGenerale(d: DonneesNexusia): Omit<ReponseNexus, "id" | "question"> {
  const evolution = variation(d.mois.kpis.chiffreAffaires, d.mois.kpisPrecedents.chiffreAffaires);
  return {
    titre: "Situation générale de votre entreprise",
    texte: `${d.mois.resume.phrases[0]} ${d.mois.resume.phrases[1] ?? ""}`.trim(),
    points: [
      { label: "Chiffre d'affaires du mois", valeur: formatFCFA(d.mois.kpis.chiffreAffaires) },
      { label: "Bénéfice", valeur: formatFCFA(d.mois.kpis.benefice) },
      { label: "Évolution", valeur: `${evolution} %`, ton: evolution >= 0 ? "succes" : "danger" },
      { label: "Alertes actives", valeur: formatNombre(d.alertes.length), ton: "alerte" },
    ],
    conseil:
      d.recommandations[0]?.titre ??
      "Posez une question précise : ventes, stock, employés, clients ou finances.",
    lien: { to: "/nexusia/decision", label: "Centre de décision" },
  };
}

export function repondre(question: string, donnees: DonneesNexusia): ReponseNexus {
  const normalisee = sansAccent(question);
  const regle = REGLES.find((r) => r.motsCles.some((mot) => normalisee.includes(sansAccent(mot))));
  const corps = regle ? regle.construire(donnees) : reponseGenerale(donnees);
  return {
    id: `rep-${Math.random().toString(36).slice(2, 10)}`,
    question,
    ...corps,
  };
}
