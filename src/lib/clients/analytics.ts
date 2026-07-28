import { lireProduits } from "@/lib/products/store";
import type { AchatClient, Client } from "./types";
import {
  estInactif,
  estVip,
  joursDepuis,
  niveauFidelite,
  panierMoyen,
  statutClient,
} from "./types";

/** Indicateurs globaux du fichier client. */
export function kpisClients(clients: Client[]) {
  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);

  const nouveaux = clients.filter((c) => new Date(c.dateInscription) >= debutMois).length;
  const inactifs = clients.filter(estInactif).length;
  const chiffreAffaires = clients.reduce((t, c) => t + c.totalDepense, 0);
  const achats = clients.reduce((t, c) => t + c.nombreAchats, 0);

  return {
    total: clients.length,
    nouveaux,
    actifs: clients.length - inactifs,
    inactifs,
    chiffreAffaires,
    panierMoyen: achats ? chiffreAffaires / achats : 0,
    vip: clients.filter(estVip).length,
    dettes: clients.filter((c) => c.dette > 0).length,
  };
}

/** Produits les plus achetés par un client. */
export function produitsPreferes(achats: AchatClient[], limite = 5) {
  const parProduit = new Map<string, { nom: string; quantite: number; montant: number }>();
  for (const achat of achats) {
    for (const ligne of achat.produits) {
      const courant = parProduit.get(ligne.produitId) ?? {
        nom: ligne.nom,
        quantite: 0,
        montant: 0,
      };
      courant.quantite += ligne.quantite;
      courant.montant += ligne.quantite * ligne.prixUnitaire;
      parProduit.set(ligne.produitId, courant);
    }
  }
  return [...parProduit.entries()]
    .map(([produitId, valeur]) => ({ produitId, ...valeur }))
    .sort((a, b) => b.quantite - a.quantite)
    .slice(0, limite);
}

/** Nombre moyen de jours entre deux achats. */
export function frequenceAchat(achats: AchatClient[]) {
  if (achats.length < 2) return null;
  const dates = achats.map((a) => new Date(a.date).getTime()).sort((a, b) => a - b);
  const ecarts = dates.slice(1).map((d, i) => (d - dates[i]) / 86_400_000);
  return ecarts.reduce((t, e) => t + e, 0) / ecarts.length;
}

/** Dépenses des 6 derniers mois. */
export function evolutionDepenses(achats: AchatClient[], mois = 6) {
  const points: { mois: string; montant: number }[] = [];
  const now = new Date();
  for (let i = mois - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(d);
    const montant = achats
      .filter((a) => {
        const date = new Date(a.date);
        return date.getFullYear() === d.getFullYear() && date.getMonth() === d.getMonth();
      })
      .reduce((t, a) => t + a.montant, 0);
    points.push({ mois: label, montant });
  }
  return points;
}

/** Recommandation commerciale simple et lisible. */
export function recommandation(client: Client, achats: AchatClient[]) {
  const preferes = produitsPreferes(achats, 2);
  const catalogue = lireProduits();
  const dejaAchetes = new Set(achats.flatMap((a) => a.produits.map((p) => p.produitId)));
  const suggestion = catalogue.find((p) => !dejaAchetes.has(p.id) && p.stock > 0);
  const jours = joursDepuis(client.dernierAchat);

  if (!achats.length) {
    return `${client.nom} n'a pas encore effectué d'achat. Proposez-lui une première remise de bienvenue pour l'encourager.`;
  }

  if (jours !== null && jours > 90) {
    return `${client.nom} n'a pas acheté depuis ${jours} jours. Envoyez un message de relance avec une remise sur ${preferes[0]?.nom ?? "ses produits habituels"}.`;
  }

  const habitudes = preferes.map((p) => p.nom).join(" et ");
  if (suggestion) {
    return `Ce client achète régulièrement ${habitudes}. Il est recommandé de lui proposer une réduction sur ${suggestion.nom}.`;
  }
  return `Ce client achète régulièrement ${habitudes}. Proposez-lui le programme VIP pour renforcer sa fidélité.`;
}

/** Analyse complète d'un client (utilisée par la page Analyse Client). */
export function analyseClient(client: Client, achats: AchatClient[]) {
  return {
    preferes: produitsPreferes(achats),
    panierMoyen: panierMoyen(client),
    frequence: frequenceAchat(achats),
    evolution: evolutionDepenses(achats),
    niveau: niveauFidelite(client.points),
    statut: statutClient(client),
    recommandation: recommandation(client, achats),
    joursDepuisDernierAchat: joursDepuis(client.dernierAchat),
  };
}

/** Répartition par ville. */
export function repartitionVilles(clients: Client[]) {
  const map = new Map<string, number>();
  clients.forEach((c) => map.set(c.ville || "Non précisé", (map.get(c.ville) ?? 0) + 1));
  return [...map.entries()]
    .map(([ville, total]) => ({ ville, total }))
    .sort((a, b) => b.total - a.total);
}

/** Répartition par sexe. */
export function repartitionSexe(clients: Client[]) {
  const map = new Map<string, number>();
  clients.forEach((c) => map.set(c.sexe, (map.get(c.sexe) ?? 0) + 1));
  return map;
}

/** Nouveaux clients par mois (6 derniers mois). */
export function nouveauxParMois(clients: Client[], mois = 6) {
  const points: { mois: string; total: number }[] = [];
  const now = new Date();
  for (let i = mois - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(d);
    const total = clients.filter((c) => {
      const date = new Date(c.dateInscription);
      return date.getFullYear() === d.getFullYear() && date.getMonth() === d.getMonth();
    }).length;
    points.push({ mois: label, total });
  }
  return points;
}

/** Classement des meilleurs clients. */
export function meilleursClients(clients: Client[], limite = 20) {
  return [...clients].sort((a, b) => b.totalDepense - a.totalDepense).slice(0, limite);
}
