/**
 * Modèle de données du module « NEXUSIA Insight ».
 * Aucune donnée métier n'est stockée ici : tout est dérivé des modules
 * existants (Produits, Ventes, Clients, Employés, Fournisseurs, Finances).
 * Structure pensée pour être branchée telle quelle sur Lovable Cloud (Supabase).
 */

export type TonInsight = "succes" | "info" | "alerte" | "danger";

export type PointReponse = {
  label: string;
  valeur: string;
  ton?: TonInsight;
};

/** Réponse structurée renvoyée par le conseiller au Directeur. */
export type ReponseNexus = {
  id: string;
  question: string;
  titre: string;
  texte: string;
  points: PointReponse[];
  conseil?: string;
  lien?: { to: string; label: string };
};

export type RoleMessage = "assistant" | "directeur";

export type MessageNexus = {
  id: string;
  role: RoleMessage;
  date: string; // ISO
  texte: string;
  reponse?: ReponseNexus;
};

export type Recommandation = {
  id: string;
  ton: TonInsight;
  titre: string;
  message: string;
  impact: "faible" | "moyen" | "fort";
};

export type AlerteCritique = {
  id: string;
  categorie: "stock" | "expiration" | "ventes" | "caisse" | "facture" | "livraison";
  titre: string;
  message: string;
  gravite: "haute" | "moyenne";
};

export type NotificationNexus = {
  id: string;
  ton: TonInsight;
  titre: string;
  message: string;
};

export type ResultatRecherche = {
  id: string;
  type: "Produit" | "Client" | "Employé" | "Facture" | "Fournisseur" | "Rapport";
  titre: string;
  detail: string;
  to: string;
};

export type TypeRapport = "quotidien" | "hebdomadaire" | "mensuel" | "annuel";

export const TYPES_RAPPORT: { value: TypeRapport; label: string; description: string }[] = [
  {
    value: "quotidien",
    label: "Rapport quotidien",
    description: "Activité de la journée en cours.",
  },
  {
    value: "hebdomadaire",
    label: "Rapport hebdomadaire",
    description: "Synthèse des sept derniers jours.",
  },
  { value: "mensuel", label: "Rapport mensuel", description: "Performance complète du mois." },
  { value: "annuel", label: "Rapport annuel", description: "Bilan de l'année en cours." },
];

/** Objectif défini par le Directeur et suivi automatiquement. */
export type IndicateurObjectif =
  | "chiffreAffaires"
  | "benefice"
  | "ventes"
  | "clients"
  | "panierMoyen";

export const INDICATEURS_OBJECTIF: {
  value: IndicateurObjectif;
  label: string;
  unite: "FCFA" | "unite";
}[] = [
  { value: "chiffreAffaires", label: "Chiffre d'affaires du mois", unite: "FCFA" },
  { value: "benefice", label: "Bénéfice du mois", unite: "FCFA" },
  { value: "ventes", label: "Nombre de ventes du mois", unite: "unite" },
  { value: "clients", label: "Nouveaux clients du mois", unite: "unite" },
  { value: "panierMoyen", label: "Panier moyen", unite: "FCFA" },
];

export type ObjectifNexus = {
  id: string;
  intitule: string;
  indicateur: IndicateurObjectif;
  cible: number;
  echeance: string; // ISO (date)
};

export const SUGGESTIONS_RAPIDES = [
  "Quel est mon chiffre d'affaires aujourd'hui ?",
  "Quels produits se vendent le mieux ?",
  "Quels produits risquent une rupture ?",
  "Quel vendeur est le plus performant ?",
  "Combien ai-je gagné ce mois ?",
  "Quels clients sont les plus fidèles ?",
  "Quelles dépenses ont augmenté ?",
  "Quels fournisseurs livrent le plus rapidement ?",
] as const;

export const QUESTIONS_FREQUENTES = [
  "Pourquoi les ventes baissent ?",
  "Pourquoi les dépenses augmentent ?",
  "Quel produit rapporte le plus ?",
  "Quel est le meilleur magasin ?",
  "Quel employé vend le plus ?",
  "Quels produits ne se vendent plus ?",
] as const;

export const MESSAGE_ACCUEIL = `Bonjour. Je suis votre assistant de gestion. Je peux analyser vos ventes, vos stocks, vos employés, vos clients et vos finances afin de vous aider à prendre de meilleures décisions.`;

export const formatNombre = (valeur: number) => valeur.toLocaleString("fr-FR");

export const formatPourcent = (valeur: number) => `${valeur > 0 ? "+" : ""}${valeur} %`;

export const TON_CLASSE: Record<TonInsight, string> = {
  succes: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  info: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  alerte: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  danger: "bg-primary-soft text-primary border-primary/20",
};
