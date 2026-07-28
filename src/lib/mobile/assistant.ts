import { useMemo } from "react";

import { useHrStore } from "@/lib/hr/store";
import { calculerPerformances } from "@/lib/hr/analytics";
import { useProductsStore } from "@/lib/products/store";
import { expirationProche, formatFCFA, statutProduit } from "@/lib/products/types";
import { useSalesStore } from "@/lib/sales/store";
import { totalVente } from "@/lib/sales/types";
import { useFinances } from "@/lib/finance/use-finance";
import { rentabiliteProduits } from "@/lib/finance/analytics";
import { useClientsStore } from "@/lib/clients/store";

export type ReponseAssistant = {
  id: string;
  question: string;
  titre: string;
  valeur: string;
  detail: string;
  ton: "primary" | "success" | "warning" | "danger";
  lignes: { label: string; valeur: string }[];
};

const jour = (iso: string) => new Date(iso).toISOString().slice(0, 10);
const aujourdHui = () => new Date().toISOString().slice(0, 10);

/**
 * Moteur de réponses du tableau de bord intelligent.
 * 100 % dérivé des modules existants : aucune donnée saisie en double.
 */
export function useAssistantDirecteur(): ReponseAssistant[] {
  const { produits } = useProductsStore();
  const { ventes } = useSalesStore();
  const { employes, presences } = useHrStore();
  const { clients } = useClientsStore();
  const { kpis } = useFinances();

  return useMemo(() => {
    const ventesJour = ventes.filter(
      (v) => v.statut !== "annulee" && jour(v.date) === aujourdHui(),
    );
    const rentaJour = rentabiliteProduits(ventesJour, produits);
    const meilleur = rentaJour[0];
    const performances = calculerPerformances(employes, ventes, presences);
    const topVendeur = performances[0];
    const aCommander = produits
      .filter((p) => ["rupture", "faible"].includes(statutProduit(p)))
      .sort((a, b) => a.stock - b.stock);
    const expirent = produits.filter((p) => expirationProche(p, 90));
    const vip = [...clients].sort((a, b) => b.totalDepense - a.totalDepense).slice(0, 3);

    return [
      {
        id: "Q1",
        question: "Quel est mon meilleur produit aujourd'hui ?",
        titre: meilleur ? meilleur.nom : "Aucune vente aujourd'hui",
        valeur: meilleur ? formatFCFA(meilleur.chiffreAffaires) : "—",
        detail: meilleur
          ? `${meilleur.quantite} unité(s) vendue(s) · marge ${meilleur.marge} %`
          : "Les ventes du jour ne sont pas encore enregistrées.",
        ton: "success",
        lignes: rentaJour.slice(0, 3).map((p) => ({
          label: p.nom,
          valeur: formatFCFA(p.chiffreAffaires),
        })),
      },
      {
        id: "Q2",
        question: "Quel employé vend le plus ?",
        titre: topVendeur ? topVendeur.employe.nom : "Aucun vendeur actif",
        valeur: topVendeur ? formatFCFA(topVendeur.chiffreAffaires) : "—",
        detail: topVendeur
          ? `${topVendeur.nombreVentes} vente(s) ce mois · objectif ${topVendeur.progression} %`
          : "Aucune vente enregistrée ce mois-ci.",
        ton: "primary",
        lignes: performances.slice(0, 3).map((p) => ({
          label: p.employe.nom,
          valeur: formatFCFA(p.chiffreAffaires),
        })),
      },
      {
        id: "Q3",
        question: "Quels produits dois-je recommander ?",
        titre: `${aCommander.length} produit(s) à réapprovisionner`,
        valeur: aCommander.length ? "Action requise" : "Stock sain",
        detail: aCommander.length
          ? "Ces références sont sous le seuil minimum de stock."
          : "Aucun produit sous le seuil minimum.",
        ton: aCommander.length ? "warning" : "success",
        lignes: aCommander.slice(0, 4).map((p) => ({
          label: p.nom,
          valeur: `${p.stock} / min ${p.stockMinimum}`,
        })),
      },
      {
        id: "Q4",
        question: "Combien ai-je gagné aujourd'hui ?",
        titre: "Bénéfice du jour",
        valeur: formatFCFA(kpis.beneficeJour),
        detail: `Chiffre d'affaires du jour : ${formatFCFA(kpis.caJour)} · ${ventesJour.length} vente(s)`,
        ton: kpis.beneficeJour >= 0 ? "success" : "danger",
        lignes: [
          { label: "CA du jour", valeur: formatFCFA(kpis.caJour) },
          {
            label: "Panier moyen",
            valeur: formatFCFA(
              ventesJour.length
                ? ventesJour.reduce((t, v) => t + totalVente(v), 0) / ventesJour.length
                : 0,
            ),
          },
          { label: "Bénéfice du mois", valeur: formatFCFA(kpis.beneficeMois) },
        ],
      },
      {
        id: "Q5",
        question: "Quels produits expirent bientôt ?",
        titre: `${expirent.length} produit(s) à surveiller`,
        valeur: expirent.length ? "Sous 90 jours" : "Rien à signaler",
        detail: expirent.length
          ? "Prévoyez une promotion pour écouler ces lots."
          : "Aucun lot n'approche de sa date d'expiration.",
        ton: expirent.length ? "warning" : "success",
        lignes: expirent.slice(0, 4).map((p) => ({
          label: p.nom,
          valeur: new Intl.DateTimeFormat("fr-FR").format(new Date(p.dateExpiration!)),
        })),
      },
      {
        id: "Q6",
        question: "Qui sont mes meilleurs clients ?",
        titre: vip[0]?.nom ?? "Aucun client",
        valeur: vip[0] ? formatFCFA(vip[0].totalDepense) : "—",
        detail: "Classement par dépenses cumulées.",
        ton: "primary",
        lignes: vip.map((c) => ({ label: c.nom, valeur: formatFCFA(c.totalDepense) })),
      },
    ];
  }, [produits, ventes, employes, presences, clients, kpis]);
}
