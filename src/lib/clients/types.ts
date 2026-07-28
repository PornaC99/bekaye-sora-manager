/**
 * Modèle de données du module « Clients & Fidélité ».
 * Structure pensée pour être branchée telle quelle sur Lovable Cloud (Supabase).
 */

export type Sexe = "F" | "H" | "non_precise";

export const SEXE_LABEL: Record<Sexe, string> = {
  F: "Femme",
  H: "Homme",
  non_precise: "Non précisé",
};

export type NiveauFidelite = "bronze" | "argent" | "or" | "platine";

export const NIVEAUX: {
  value: NiveauFidelite;
  label: string;
  seuil: number;
  classe: string;
  couleur: string;
}[] = [
  {
    value: "bronze",
    label: "Bronze",
    seuil: 0,
    classe: "bg-amber-700/10 text-amber-700",
    couleur: "#b45309",
  },
  {
    value: "argent",
    label: "Argent",
    seuil: 500,
    classe: "bg-slate-400/15 text-slate-600",
    couleur: "#64748b",
  },
  {
    value: "or",
    label: "Or",
    seuil: 1500,
    classe: "bg-amber-400/15 text-amber-600",
    couleur: "#d97706",
  },
  {
    value: "platine",
    label: "Platine",
    seuil: 3000,
    classe: "bg-primary-soft text-primary",
    couleur: "#e11d48",
  },
];

export function niveauFidelite(points: number): NiveauFidelite {
  return [...NIVEAUX].reverse().find((n) => points >= n.seuil)?.value ?? "bronze";
}

export function infoNiveau(niveau: NiveauFidelite) {
  return NIVEAUX.find((n) => n.value === niveau) ?? NIVEAUX[0];
}

export function prochainNiveau(points: number) {
  return NIVEAUX.find((n) => n.seuil > points) ?? null;
}

export type ProduitAchete = {
  produitId: string;
  nom: string;
  quantite: number;
  prixUnitaire: number;
};

export type AchatClient = {
  id: string;
  clientId: string;
  date: string; // ISO
  reference: string;
  produits: ProduitAchete[];
  montant: number;
  modePaiement: string;
  vendeur: string;
};

export type Client = {
  id: string;
  numero: string; // CLI-2026-0001
  nom: string;
  telephone: string;
  whatsapp: string;
  email: string;
  adresse: string;
  ville: string;
  sexe: Sexe;
  dateNaissance: string | null; // ISO
  dateInscription: string; // ISO
  notes: string;
  photo: string | null;
  points: number;
  totalDepense: number;
  nombreAchats: number;
  dernierAchat: string | null;
  dette: number;
};

export type ClientFormValues = Omit<
  Client,
  "id" | "numero" | "points" | "totalDepense" | "nombreAchats" | "dernierAchat"
>;

export type ReglesFidelite = {
  pointsActifs: boolean;
  trancheFCFA: number; // ex. 1000 FCFA
  pointsParTranche: number; // ex. 1 point
  remiseActive: boolean;
  remisePourcent: number; // remise accordée aux clients VIP
  cadeauActif: boolean;
  achatsAvantCadeau: number;
  cadeau: string;
};

export type NotificationClient = {
  id: string;
  date: string;
  type: "nouveau" | "vip" | "anniversaire" | "inactif" | "fidelite";
  titre: string;
  message: string;
};

/* ------------------------------------------------------------------ */
/* Règles métier                                                        */
/* ------------------------------------------------------------------ */

export const SEUIL_VIP = 250_000; // FCFA dépensés
export const SEUIL_FIDELE = 5; // nombre d'achats
export const JOURS_INACTIF = 90;

export const joursDepuis = (iso: string | null) =>
  iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000) : null;

export const estVip = (client: Client) =>
  client.totalDepense >= SEUIL_VIP || niveauFidelite(client.points) === "platine";

export const estFidele = (client: Client) => client.nombreAchats >= SEUIL_FIDELE;

export function estInactif(client: Client) {
  const jours = joursDepuis(client.dernierAchat);
  return jours === null || jours > JOURS_INACTIF;
}

export type StatutClient = "vip" | "fidele" | "inactif" | "nouveau";

export const STATUT_CLIENT_LABEL: Record<StatutClient, string> = {
  vip: "VIP",
  fidele: "Fidèle",
  inactif: "Inactif",
  nouveau: "Nouveau",
};

export const STATUT_CLIENT_CLASSE: Record<StatutClient, string> = {
  vip: "bg-primary-soft text-primary",
  fidele: "bg-success/10 text-success",
  inactif: "bg-muted text-muted-foreground",
  nouveau: "bg-sky-500/10 text-sky-600",
};

export function statutClient(client: Client): StatutClient {
  if (estVip(client)) return "vip";
  if (estInactif(client)) return "inactif";
  if (estFidele(client)) return "fidele";
  return "nouveau";
}

export const panierMoyen = (client: Client) =>
  client.nombreAchats ? client.totalDepense / client.nombreAchats : 0;

export function pointsGagnes(montant: number, regles: ReglesFidelite) {
  if (!regles.pointsActifs || regles.trancheFCFA <= 0) return 0;
  return Math.floor(montant / regles.trancheFCFA) * regles.pointsParTranche;
}

export const initiales = (nom: string) =>
  nom
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0]?.toUpperCase())
    .join("");

/** Anniversaire aujourd'hui (jour + mois). */
export function anniversaireAujourdhui(client: Client) {
  if (!client.dateNaissance) return false;
  const d = new Date(client.dateNaissance);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
}
