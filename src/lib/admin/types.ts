/**
 * Modèle de données du module « Administration Générale ».
 * Architecture pensée multi-entreprises (multi-tenant) : chaque entité porte un
 * `entrepriseId` afin de permettre une isolation stricte des données lors du
 * branchement sur Lovable Cloud (RLS PostgreSQL par entreprise).
 */

export type Devise = "XOF" | "EUR" | "USD";
export type FormatDate = "jj/mm/aaaa" | "aaaa-mm-jj" | "mm/jj/aaaa";
export type Langue = "fr" | "en";

export type InfosEntreprise = {
  logo: string;
  nom: string;
  nomCommercial: string;
  slogan: string;
  adresse: string;
  telephone: string;
  whatsapp: string;
  email: string;
  siteWeb: string;
  identifiant: string;
  devise: Devise;
  fuseauHoraire: string;
  langue: Langue;
  formatDate: FormatDate;
};

export type Personnalisation = {
  couleurPrincipale: string;
  logoClair: string;
  logoSombre: string;
  favicon: string;
  theme: "clair" | "sombre" | "auto";
  police: "Sora" | "Inter" | "Manrope";
};

export type StatutUtilisateur = "actif" | "suspendu" | "invite";

export type Utilisateur = {
  id: string;
  entrepriseId: string;
  magasinId: string | null;
  nom: string;
  email: string;
  telephone: string;
  /** Fonction occupée dans l'entreprise (libellé libre). */
  fonction?: string;
  /** URL de la photo de profil (facultative : initiales par défaut). */
  photo?: string;
  roleId: string;
  statut: StatutUtilisateur;
  derniereConnexion: string | null;
  creeLe: string;
};

export type UtilisateurFormValues = Omit<
  Utilisateur,
  "id" | "entrepriseId" | "derniereConnexion" | "creeLe"
>;

export const PERMISSIONS = [
  { cle: "voir", label: "Voir uniquement" },
  { cle: "creer", label: "Créer" },
  { cle: "modifier", label: "Modifier" },
  { cle: "supprimer", label: "Supprimer" },
  { cle: "exporter", label: "Exporter" },
  { cle: "imprimer", label: "Imprimer" },
  { cle: "valider", label: "Validation" },
  { cle: "administrer", label: "Administration" },
] as const;

export type PermissionCle = (typeof PERMISSIONS)[number]["cle"];

export type Role = {
  id: string;
  entrepriseId: string;
  nom: string;
  description: string;
  systeme: boolean;
  permissions: PermissionCle[];
};

export type ActionAudit =
  | "connexion"
  | "deconnexion"
  | "creation"
  | "modification"
  | "suppression"
  | "export"
  | "connexion_echouee"
  | "acces_refuse";

export const LABEL_ACTION: Record<ActionAudit, string> = {
  connexion: "Connexion",
  deconnexion: "Déconnexion",
  creation: "Création",
  modification: "Modification",
  suppression: "Suppression",
  export: "Export",
  connexion_echouee: "Connexion échouée",
  acces_refuse: "Accès refusé",
};

export type EntreeAudit = {
  id: string;
  entrepriseId: string;
  date: string; // ISO
  utilisateur: string;
  action: ActionAudit;
  module: string;
  details: string;
  ip: string;
  appareil: string;
};

export type Session = {
  id: string;
  utilisateur: string;
  appareil: string;
  ip: string;
  localisation: string;
  debut: string;
  courante: boolean;
};

export type PolitiqueMotDePasse = {
  longueurMin: number;
  majuscule: boolean;
  chiffre: boolean;
  special: boolean;
  expirationJours: number;
  double_authentification: boolean;
};

export type Sauvegarde = {
  id: string;
  date: string;
  taille: string;
  type: "manuelle" | "automatique";
  statut: "reussie" | "en_cours" | "echouee";
  auteur: string;
};

export type PlanificationSauvegarde = {
  active: boolean;
  frequence: "quotidienne" | "hebdomadaire" | "mensuelle";
  heure: string;
  retentionJours: number;
};

export type PreferencesNotifications = {
  internes: boolean;
  email: boolean;
  whatsapp: boolean;
  push: boolean;
  emailDestinataire: string;
};

export type Magasin = {
  id: string;
  entrepriseId: string;
  nom: string;
  adresse: string;
  responsable: string;
  telephone: string;
  actif: boolean;
  employes: number;
  valeurStock: number;
  caisseJour: number;
};

export type MagasinFormValues = Omit<Magasin, "id" | "entrepriseId">;

export type Entreprise = {
  id: string;
  nom: string;
  logo: string;
  secteur: string;
  pays: string;
  plan: "Essentiel" | "Business" | "Enterprise";
  active: boolean;
  creeLe: string;
};

export type ParametresVentes = {
  tvaActive: boolean;
  tauxTva: number;
  remiseMaxPourcent: number;
  prefixeFacture: string;
  prochainNumero: number;
  conditionsPaiement: string;
};

export type ParametresStocks = {
  stockMinimumDefaut: number;
  gestionLots: boolean;
  datesPeremption: boolean;
  alerteExpirationJours: number;
  inventaireAutomatique: "aucun" | "mensuel" | "trimestriel";
};

export type ParametresFinanciers = {
  devise: Devise;
  categoriesDepenses: string[];
  objectifCaMensuel: number;
  budgetDepensesMensuel: number;
};

export type EtapeConfiguration = {
  cle: string;
  titre: string;
  description: string;
  lien: string;
  faite: boolean;
};

export const formatDateHeure = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
