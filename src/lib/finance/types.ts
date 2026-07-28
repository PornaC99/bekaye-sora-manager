/**
 * Modèle de données du module « Comptabilité, Dépenses, Trésorerie & Tableau financier ».
 * Structure pensée pour être branchée telle quelle sur Lovable Cloud (Supabase).
 */

export type CategorieDepense =
  | "salaires"
  | "achats"
  | "transport"
  | "loyer"
  | "electricite"
  | "internet"
  | "marketing"
  | "impots"
  | "autres";

export const CATEGORIES_DEPENSE: {
  value: CategorieDepense;
  label: string;
  couleur: string;
}[] = [
  { value: "salaires", label: "Salaires", couleur: "var(--chart-1)" },
  { value: "achats", label: "Achats", couleur: "var(--chart-2)" },
  { value: "transport", label: "Transport", couleur: "var(--chart-3)" },
  { value: "loyer", label: "Loyer", couleur: "var(--chart-4)" },
  { value: "electricite", label: "Électricité", couleur: "var(--chart-5)" },
  { value: "internet", label: "Internet", couleur: "#0ea5e9" },
  { value: "marketing", label: "Marketing", couleur: "#8b5cf6" },
  { value: "impots", label: "Impôts", couleur: "#f59e0b" },
  { value: "autres", label: "Autres", couleur: "#94a3b8" },
];

export const CATEGORIE_DEPENSE_LABEL: Record<CategorieDepense, string> =
  CATEGORIES_DEPENSE.reduce(
    (acc, c) => ({ ...acc, [c.value]: c.label }),
    {} as Record<CategorieDepense, string>,
  );

export const CATEGORIE_DEPENSE_COULEUR: Record<CategorieDepense, string> =
  CATEGORIES_DEPENSE.reduce(
    (acc, c) => ({ ...acc, [c.value]: c.couleur }),
    {} as Record<CategorieDepense, string>,
  );

export type ModePaiementDepense =
  | "especes"
  | "virement"
  | "orange_money"
  | "wave"
  | "cheque"
  | "carte";

export const MODES_PAIEMENT_DEPENSE: { value: ModePaiementDepense; label: string }[] = [
  { value: "especes", label: "Espèces" },
  { value: "virement", label: "Virement bancaire" },
  { value: "orange_money", label: "Orange Money" },
  { value: "wave", label: "Wave" },
  { value: "cheque", label: "Chèque" },
  { value: "carte", label: "Carte bancaire" },
];

export const MODE_PAIEMENT_DEPENSE_LABEL: Record<ModePaiementDepense, string> =
  MODES_PAIEMENT_DEPENSE.reduce(
    (acc, m) => ({ ...acc, [m.value]: m.label }),
    {} as Record<ModePaiementDepense, string>,
  );

export type StatutDepense = "payee" | "en_attente" | "annulee";

export const STATUT_DEPENSE_LABEL: Record<StatutDepense, string> = {
  payee: "Payée",
  en_attente: "En attente",
  annulee: "Annulée",
};

export const STATUT_DEPENSE_CLASSE: Record<StatutDepense, string> = {
  payee: "bg-success/10 text-success",
  en_attente: "bg-amber-500/10 text-amber-600",
  annulee: "bg-destructive/10 text-destructive",
};

/** Origine de la dépense : saisie manuelle ou synchronisation automatique. */
export type SourceDepense = "manuelle" | "salaires" | "achats" | "caisse" | "stock";

export const SOURCE_DEPENSE_LABEL: Record<SourceDepense, string> = {
  manuelle: "Saisie manuelle",
  salaires: "Module Salaires",
  achats: "Commandes d'achat",
  caisse: "Caisse",
  stock: "Inventaire & stock",
};

export type Justificatif = { nom: string; type: string; taille: number };

export type Depense = {
  id: string;
  date: string; // ISO
  montant: number;
  categorie: CategorieDepense;
  modePaiement: ModePaiementDepense;
  description: string;
  responsable: string;
  statut: StatutDepense;
  justificatif: Justificatif | null;
  source: SourceDepense;
};

export type DepenseFormValues = Omit<Depense, "id" | "source">;

/* ------------------------------------------------------------------ */
/* Créances & dettes                                                    */
/* ------------------------------------------------------------------ */

export type StatutEcheance = "a_venir" | "en_retard" | "regle";

export const STATUT_ECHEANCE_LABEL: Record<StatutEcheance, string> = {
  a_venir: "À venir",
  en_retard: "En retard",
  regle: "Réglé",
};

export const STATUT_ECHEANCE_CLASSE: Record<StatutEcheance, string> = {
  a_venir: "bg-amber-500/10 text-amber-600",
  en_retard: "bg-destructive/10 text-destructive",
  regle: "bg-success/10 text-success",
};

export type Creance = {
  id: string;
  clientId: string | null;
  nom: string;
  montant: number;
  date: string; // ISO
  echeance: string; // ISO
  regle: boolean;
  observation: string;
};

export type Dette = {
  id: string;
  fournisseurId: string | null;
  fournisseur: string;
  montant: number;
  date: string;
  echeance: string;
  regle: boolean;
  observation: string;
};

export function statutEcheance(item: { echeance: string; regle: boolean }): StatutEcheance {
  if (item.regle) return "regle";
  return new Date(item.echeance).getTime() < Date.now() ? "en_retard" : "a_venir";
}

/* ------------------------------------------------------------------ */
/* Objectifs financiers                                                 */
/* ------------------------------------------------------------------ */

export type ObjectifsFinanciers = {
  chiffreAffaires: number;
  benefice: number;
  /** Plafond de dépenses à ne pas dépasser sur le mois. */
  plafondDepenses: number;
};

/* ------------------------------------------------------------------ */
/* Flux financiers                                                      */
/* ------------------------------------------------------------------ */

export type TypeFlux = "vente" | "achat" | "depense" | "salaire" | "retour";

export const TYPE_FLUX_LABEL: Record<TypeFlux, string> = {
  vente: "Vente",
  achat: "Achat",
  depense: "Dépense",
  salaire: "Salaire",
  retour: "Retour",
};

export const TYPE_FLUX_CLASSE: Record<TypeFlux, string> = {
  vente: "bg-success/10 text-success",
  achat: "bg-sky-500/10 text-sky-600",
  depense: "bg-amber-500/10 text-amber-600",
  salaire: "bg-violet-500/10 text-violet-600",
  retour: "bg-destructive/10 text-destructive",
};

export type FluxFinancier = {
  id: string;
  date: string; // ISO
  type: TypeFlux;
  libelle: string;
  tiers: string;
  /** Positif = entrée d'argent, négatif = sortie. */
  montant: number;
};

/* ------------------------------------------------------------------ */
/* Notifications                                                        */
/* ------------------------------------------------------------------ */

export type NotificationFinance = {
  id: string;
  date: string;
  ton: "info" | "succes" | "alerte" | "danger";
  titre: string;
  message: string;
};

/* ------------------------------------------------------------------ */
/* Helpers de dates                                                     */
/* ------------------------------------------------------------------ */

export const jourISO = (d: Date | string = new Date()) =>
  (typeof d === "string" ? new Date(d) : d).toISOString().slice(0, 10);

export const moisISO = (d: Date | string = new Date()) =>
  (typeof d === "string" ? new Date(d) : d).toISOString().slice(0, 7);

export const estAujourdHui = (iso: string) => jourISO(iso) === jourISO();

export const estCeMois = (iso: string) => moisISO(iso) === moisISO();

export const formatDateCourte = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

export const formatDateHeure = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export const pourcentage = (partie: number, total: number) =>
  total <= 0 ? 0 : Math.round((partie / total) * 1000) / 10;
