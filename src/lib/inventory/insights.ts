import type { LigneHistorique, MouvementStock, Produit } from "@/lib/products/types";
import { expirationProche, margeBeneficiaire } from "@/lib/products/types";
import { ecartLigne, ligneVerifiee, type Inventaire } from "./types";

export type Alerte = {
  id: string;
  type: "rupture" | "dormant" | "ecart" | "peremption";
  titre: string;
  detail: string;
  gravite: "info" | "attention" | "critique";
};

export type Suggestion = {
  id: string;
  categorie: "commander" | "reduire" | "peremption" | "anomalie" | "rentabilite" | "rupture_prevue";
  titre: string;
  message: string;
  indicateur: string;
  ton: "success" | "warning" | "danger" | "neutral";
};

const JOURS_30 = 30 * 86_400_000;

const recent = (iso: string) => Date.now() - new Date(iso).getTime() <= JOURS_30;

/** Quantités vendues sur les 30 derniers jours, par produit. */
export function ventes30Jours(ventes: LigneHistorique[]) {
  const map = new Map<string, number>();
  ventes
    .filter((v) => recent(v.date))
    .forEach((v) => {
      map.set(v.produitId, (map.get(v.produitId) ?? 0) + v.quantite);
    });
  return map;
}

/** Nombre de jours estimés avant rupture selon le rythme des 30 derniers jours. */
export function joursAvantRupture(produit: Produit, vendus: number) {
  if (vendus <= 0) return null;
  const parJour = vendus / 30;
  return Math.max(0, Math.round(produit.stock / parJour));
}

/** Nombre d'écarts constatés par produit sur l'ensemble des inventaires. */
export function ecartsParProduit(inventaires: Inventaire[]) {
  const map = new Map<string, { occurrences: number; controles: number; cumul: number }>();
  inventaires.forEach((inv) =>
    inv.lignes.filter(ligneVerifiee).forEach((l) => {
      const item = map.get(l.produitId) ?? { occurrences: 0, controles: 0, cumul: 0 };
      const ecart = ecartLigne(l);
      map.set(l.produitId, {
        occurrences: item.occurrences + (ecart !== 0 ? 1 : 0),
        controles: item.controles + 1,
        cumul: item.cumul + Math.abs(ecart),
      });
    }),
  );
  return map;
}

export function construireAlertes(
  produits: Produit[],
  mouvements: MouvementStock[],
  ventes: LigneHistorique[],
  inventaires: Inventaire[],
): Alerte[] {
  const alertes: Alerte[] = [];
  const vendus = ventes30Jours(ventes);
  const ecarts = ecartsParProduit(inventaires);

  produits.forEach((p) => {
    if (p.stock <= 0) {
      alertes.push({
        id: `rupture-${p.id}`,
        type: "rupture",
        titre: p.nom,
        detail: "Produit en rupture : réapprovisionnement urgent.",
        gravite: "critique",
      });
    } else if (p.stock <= p.stockMinimum) {
      alertes.push({
        id: `rupture-${p.id}`,
        type: "rupture",
        titre: p.nom,
        detail: `Stock faible : ${p.stock} unités restantes (minimum ${p.stockMinimum}).`,
        gravite: "attention",
      });
    }

    if (!vendus.get(p.id)) {
      alertes.push({
        id: `dormant-${p.id}`,
        type: "dormant",
        titre: p.nom,
        detail: "Aucune vente sur les 30 derniers jours.",
        gravite: "info",
      });
    }

    const e = ecarts.get(p.id);
    if (e && e.occurrences >= 2) {
      alertes.push({
        id: `ecart-${p.id}`,
        type: "ecart",
        titre: p.nom,
        detail: `${e.occurrences} inventaires avec écart (${e.cumul} unités au total).`,
        gravite: "attention",
      });
    }

    if (expirationProche(p, 90)) {
      alertes.push({
        id: `peremption-${p.id}`,
        type: "peremption",
        titre: p.nom,
        detail: "Date de péremption dans moins de 90 jours.",
        gravite: "critique",
      });
    }
  });

  return alertes;
}

export function construireSuggestions(
  produits: Produit[],
  ventes: LigneHistorique[],
  inventaires: Inventaire[],
): Suggestion[] {
  const vendus = ventes30Jours(ventes);
  const ecarts = ecartsParProduit(inventaires);
  const suggestions: Suggestion[] = [];

  const parVentes = [...produits].sort((a, b) => (vendus.get(b.id) ?? 0) - (vendus.get(a.id) ?? 0));

  const fort = parVentes[0];
  if (fort && (vendus.get(fort.id) ?? 0) > 0) {
    suggestions.push({
      id: "commander",
      categorie: "commander",
      titre: "Commander davantage",
      message: `« ${fort.nom} » est votre produit le plus demandé avec ${vendus.get(fort.id)} unités vendues en 30 jours.`,
      indicateur: `${vendus.get(fort.id)} ventes / 30 j`,
      ton: "success",
    });
  }

  const faible = parVentes[parVentes.length - 1];
  if (faible && (vendus.get(faible.id) ?? 0) === 0) {
    suggestions.push({
      id: "reduire",
      categorie: "reduire",
      titre: "Réduire les achats",
      message: `« ${faible.nom} » ne s'est pas vendu ce mois-ci. Réduisez les prochaines commandes.`,
      indicateur: "0 vente / 30 j",
      ton: "neutral",
    });
  }

  const perime = produits.find((p) => expirationProche(p, 90));
  if (perime) {
    suggestions.push({
      id: "peremption",
      categorie: "peremption",
      titre: "Mettre en avant",
      message: `« ${perime.nom} » approche de sa date de péremption : proposez une promotion.`,
      indicateur: "Péremption < 90 j",
      ton: "warning",
    });
  }

  const anomalie = [...ecarts.entries()].sort((a, b) => b[1].cumul - a[1].cumul)[0];
  if (anomalie && anomalie[1].cumul > 0) {
    const produit = produits.find((p) => p.id === anomalie[0]);
    suggestions.push({
      id: "anomalie",
      categorie: "anomalie",
      titre: "Anomalie de stock",
      message: `« ${produit?.nom ?? anomalie[0]} » cumule ${anomalie[1].cumul} unités d'écart sur ${anomalie[1].controles} contrôles.`,
      indicateur: `${anomalie[1].occurrences} écarts`,
      ton: "danger",
    });
  }

  const rentable = [...produits].sort(
    (a, b) =>
      (vendus.get(b.id) ?? 0) * (b.prixVente - b.prixAchat) -
      (vendus.get(a.id) ?? 0) * (a.prixVente - a.prixAchat),
  )[0];
  if (rentable) {
    suggestions.push({
      id: "rentabilite",
      categorie: "rentabilite",
      titre: "Produit le plus rentable",
      message: `« ${rentable.nom} » dégage la meilleure marge sur les ventes récentes.`,
      indicateur: `${Math.round(margeBeneficiaire(rentable))} % de marge`,
      ton: "success",
    });
  }

  const risque = produits
    .map((p) => ({ produit: p, jours: joursAvantRupture(p, vendus.get(p.id) ?? 0) }))
    .filter((r): r is { produit: Produit; jours: number } => r.jours !== null)
    .sort((a, b) => a.jours - b.jours)[0];
  if (risque) {
    suggestions.push({
      id: "rupture_prevue",
      categorie: "rupture_prevue",
      titre: "Rupture estimée",
      message: `« ${risque.produit.nom} » sera épuisé dans environ ${risque.jours} jours au rythme actuel.`,
      indicateur: `${risque.jours} j restants`,
      ton: risque.jours <= 10 ? "danger" : "warning",
    });
  }

  return suggestions;
}

/** Top produits les plus contrôlés et les plus en écart. */
export function classementsInventaire(inventaires: Inventaire[], produits: Produit[]) {
  const ecarts = ecartsParProduit(inventaires);
  const nom = (id: string) => produits.find((p) => p.id === id)?.nom ?? id;

  const controles = [...ecarts.entries()]
    .map(([id, v]) => ({ id, nom: nom(id), valeur: v.controles }))
    .sort((a, b) => b.valeur - a.valeur)
    .slice(0, 10);

  const enEcart = [...ecarts.entries()]
    .map(([id, v]) => ({ id, nom: nom(id), valeur: v.cumul }))
    .filter((x) => x.valeur > 0)
    .sort((a, b) => b.valeur - a.valeur)
    .slice(0, 10);

  return { controles, enEcart };
}
