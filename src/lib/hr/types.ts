/**
 * Modèle de données du module « Employés, Rôles, Permissions & Salaires ».
 * Structure pensée pour être branchée telle quelle sur Lovable Cloud (Supabase) :
 * chaque entité possède un identifiant stable et des clés étrangères explicites.
 */

/* ------------------------------------------------------------------ */
/* Rôles & permissions                                                  */
/* ------------------------------------------------------------------ */

export type RoleEmploye =
  | "administrateur"
  | "directeur"
  | "manager"
  | "caissier"
  | "vendeur"
  | "magasinier"
  | "comptable";

export const ROLES: { value: RoleEmploye; label: string; description: string }[] = [
  {
    value: "administrateur",
    label: "Administrateur",
    description: "Accès technique complet, gestion des comptes et des permissions.",
  },
  {
    value: "directeur",
    label: "Directeur",
    description: "Vision totale de l'entreprise : ventes, stock, RH et finances.",
  },
  {
    value: "manager",
    label: "Manager",
    description: "Pilote l'équipe et les opérations quotidiennes du magasin.",
  },
  {
    value: "caissier",
    label: "Caissier",
    description: "Encaisse les ventes et gère la caisse, sans suppression possible.",
  },
  {
    value: "vendeur",
    label: "Vendeur",
    description: "Vend les produits sans pouvoir modifier les prix du catalogue.",
  },
  {
    value: "magasinier",
    label: "Magasinier",
    description: "Gère le stock et les réceptions, aucun accès aux salaires.",
  },
  {
    value: "comptable",
    label: "Comptable",
    description: "Suit les finances, les salaires et les rapports comptables.",
  },
];

export const ROLE_LABEL: Record<RoleEmploye, string> = ROLES.reduce(
  (acc, r) => ({ ...acc, [r.value]: r.label }),
  {} as Record<RoleEmploye, string>,
);

export type Permission =
  | "dashboard.voir"
  | "produits.voir"
  | "produits.modifier"
  | "produits.prix"
  | "stock.gerer"
  | "ventes.creer"
  | "ventes.supprimer"
  | "caisse.gerer"
  | "clients.gerer"
  | "fournisseurs.gerer"
  | "employes.gerer"
  | "salaires.voir"
  | "salaires.payer"
  | "rapports.voir"
  | "parametres.gerer";

export const PERMISSIONS: {
  value: Permission;
  label: string;
  groupe: string;
}[] = [
  { value: "dashboard.voir", label: "Voir le tableau de bord", groupe: "Pilotage" },
  { value: "produits.voir", label: "Consulter les produits", groupe: "Catalogue" },
  { value: "produits.modifier", label: "Modifier les produits", groupe: "Catalogue" },
  { value: "produits.prix", label: "Modifier les prix", groupe: "Catalogue" },
  { value: "stock.gerer", label: "Gérer le stock", groupe: "Stock" },
  { value: "ventes.creer", label: "Enregistrer une vente", groupe: "Commerce" },
  { value: "ventes.supprimer", label: "Supprimer une vente", groupe: "Commerce" },
  { value: "caisse.gerer", label: "Ouvrir / fermer la caisse", groupe: "Commerce" },
  { value: "clients.gerer", label: "Gérer les clients", groupe: "Commerce" },
  { value: "fournisseurs.gerer", label: "Gérer les fournisseurs", groupe: "Achats" },
  { value: "employes.gerer", label: "Gérer les employés", groupe: "Ressources humaines" },
  { value: "salaires.voir", label: "Consulter les salaires", groupe: "Ressources humaines" },
  { value: "salaires.payer", label: "Payer les salaires", groupe: "Ressources humaines" },
  { value: "rapports.voir", label: "Consulter les rapports", groupe: "Analyse" },
  { value: "parametres.gerer", label: "Modifier les paramètres", groupe: "Système" },
];

export const TOUTES_PERMISSIONS = PERMISSIONS.map((p) => p.value);

/** Matrice par défaut : le directeur voit tout, chaque rôle a son périmètre. */
export const PERMISSIONS_PAR_ROLE: Record<RoleEmploye, Permission[]> = {
  administrateur: [...TOUTES_PERMISSIONS],
  directeur: [...TOUTES_PERMISSIONS],
  manager: [
    "dashboard.voir",
    "produits.voir",
    "produits.modifier",
    "stock.gerer",
    "ventes.creer",
    "ventes.supprimer",
    "caisse.gerer",
    "clients.gerer",
    "fournisseurs.gerer",
    "employes.gerer",
    "rapports.voir",
  ],
  caissier: ["dashboard.voir", "produits.voir", "ventes.creer", "caisse.gerer", "clients.gerer"],
  vendeur: ["produits.voir", "ventes.creer", "clients.gerer"],
  magasinier: ["produits.voir", "produits.modifier", "stock.gerer", "fournisseurs.gerer"],
  comptable: ["dashboard.voir", "salaires.voir", "salaires.payer", "rapports.voir"],
};

/* ------------------------------------------------------------------ */
/* Employés                                                             */
/* ------------------------------------------------------------------ */

export type StatutEmploye = "actif" | "suspendu" | "conge" | "inactif";

export const STATUT_EMPLOYE_LABEL: Record<StatutEmploye, string> = {
  actif: "Actif",
  suspendu: "Suspendu",
  conge: "En congé",
  inactif: "Inactif",
};

export const STATUT_EMPLOYE_CLASSE: Record<StatutEmploye, string> = {
  actif: "bg-success/10 text-success",
  suspendu: "bg-destructive/10 text-destructive",
  conge: "bg-amber-500/10 text-amber-600",
  inactif: "bg-muted text-muted-foreground",
};

export type Departement = "Ventes" | "Caisse" | "Magasin" | "Administration" | "Comptabilité";

export const DEPARTEMENTS: Departement[] = [
  "Ventes",
  "Caisse",
  "Magasin",
  "Administration",
  "Comptabilité",
];

/** Méthodes de pointage prévues (compatibilité future). */
export type MethodePointage = "manuel" | "pin" | "qr" | "empreinte" | "faciale";

export const METHODES_POINTAGE: { value: MethodePointage; label: string; futur: boolean }[] = [
  { value: "manuel", label: "Pointage manuel", futur: false },
  { value: "pin", label: "Code PIN", futur: true },
  { value: "qr", label: "QR Code", futur: true },
  { value: "empreinte", label: "Empreinte digitale", futur: true },
  { value: "faciale", label: "Reconnaissance faciale", futur: true },
];

export type Employe = {
  id: string;
  matricule: string;
  nom: string;
  photo: string | null;
  dateNaissance: string | null;
  sexe: "Homme" | "Femme";
  telephone: string;
  whatsapp: string;
  adresse: string;
  email: string;
  fonction: string;
  departement: Departement;
  role: RoleEmploye;
  dateEmbauche: string;
  salaireBase: number;
  objectifMensuel: number;
  statut: StatutEmploye;
  derniereConnexion: string | null;
  notes: string;
  /** Permissions surchargées manuellement (sinon héritées du rôle). */
  permissions: Permission[] | null;
  /**
   * Accès au logiciel — distinct des informations personnelles :
   * `email` = e-mail professionnel/personnel, `emailConnexion` = identifiant
   * du compte d'authentification réellement créé côté backend.
   */
  emailConnexion?: string | null;
  /** Identifiant du compte authentifié associé (auth.users.id). */
  userId?: string | null;
  /** Statut du compte de connexion (indépendant du statut RH). */
  compteActif?: boolean;
};

export type EmployeFormValues = Omit<
  Employe,
  "id" | "matricule" | "derniereConnexion" | "permissions"
>;

export function permissionsEffectives(employe: Employe): Permission[] {
  return employe.permissions ?? PERMISSIONS_PAR_ROLE[employe.role];
}

export function aPermission(employe: Employe, permission: Permission) {
  return permissionsEffectives(employe).includes(permission);
}

export const initiales = (nom: string) =>
  nom
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0]?.toUpperCase() ?? "")
    .join("");

/* ------------------------------------------------------------------ */
/* Présence                                                             */
/* ------------------------------------------------------------------ */

export type StatutPresence = "present" | "retard" | "absent" | "conge";

export const STATUT_PRESENCE_LABEL: Record<StatutPresence, string> = {
  present: "Présent",
  retard: "En retard",
  absent: "Absent",
  conge: "En congé",
};

export const STATUT_PRESENCE_CLASSE: Record<StatutPresence, string> = {
  present: "bg-success/10 text-success",
  retard: "bg-amber-500/10 text-amber-600",
  absent: "bg-destructive/10 text-destructive",
  conge: "bg-primary-soft text-primary",
};

export type Presence = {
  id: string;
  employeId: string;
  date: string; // YYYY-MM-DD
  arrivee: string | null; // HH:mm
  depart: string | null; // HH:mm
  retardMinutes: number;
  statut: StatutPresence;
  methode: MethodePointage;
};

export const HEURE_ARRIVEE_REFERENCE = "08:00";

export function minutesEntre(debut: string | null, fin: string | null) {
  if (!debut || !fin) return 0;
  const [h1, m1] = debut.split(":").map(Number);
  const [h2, m2] = fin.split(":").map(Number);
  return Math.max(0, h2 * 60 + m2 - (h1 * 60 + m1));
}

export function formatDuree(minutes: number) {
  if (minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

/* ------------------------------------------------------------------ */
/* Congés                                                               */
/* ------------------------------------------------------------------ */

export type TypeConge = "annuel" | "maladie" | "maternite" | "exceptionnel" | "sans_solde";

export const TYPES_CONGE: { value: TypeConge; label: string }[] = [
  { value: "annuel", label: "Congé annuel" },
  { value: "maladie", label: "Congé maladie" },
  { value: "maternite", label: "Congé maternité" },
  { value: "exceptionnel", label: "Congé exceptionnel" },
  { value: "sans_solde", label: "Congé sans solde" },
];

export const TYPE_CONGE_LABEL: Record<TypeConge, string> = TYPES_CONGE.reduce(
  (acc, t) => ({ ...acc, [t.value]: t.label }),
  {} as Record<TypeConge, string>,
);

export type StatutConge = "en_attente" | "approuve" | "refuse";

export const STATUT_CONGE_LABEL: Record<StatutConge, string> = {
  en_attente: "En attente",
  approuve: "Approuvé",
  refuse: "Refusé",
};

export const STATUT_CONGE_CLASSE: Record<StatutConge, string> = {
  en_attente: "bg-amber-500/10 text-amber-600",
  approuve: "bg-success/10 text-success",
  refuse: "bg-destructive/10 text-destructive",
};

export type Conge = {
  id: string;
  employeId: string;
  type: TypeConge;
  dateDebut: string;
  dateFin: string;
  motif: string;
  statut: StatutConge;
  dateDemande: string;
  decidePar: string | null;
  commentaire: string;
};

export function joursConge(conge: Pick<Conge, "dateDebut" | "dateFin">) {
  const debut = new Date(conge.dateDebut).getTime();
  const fin = new Date(conge.dateFin).getTime();
  if (Number.isNaN(debut) || Number.isNaN(fin)) return 0;
  return Math.max(1, Math.round((fin - debut) / 86400000) + 1);
}

/* ------------------------------------------------------------------ */
/* Salaires                                                             */
/* ------------------------------------------------------------------ */

export type StatutPaie = "brouillon" | "valide" | "paye";

export const STATUT_PAIE_LABEL: Record<StatutPaie, string> = {
  brouillon: "Brouillon",
  valide: "Validé",
  paye: "Payé",
};

export const STATUT_PAIE_CLASSE: Record<StatutPaie, string> = {
  brouillon: "bg-muted text-muted-foreground",
  valide: "bg-amber-500/10 text-amber-600",
  paye: "bg-success/10 text-success",
};

export type ModePaiementSalaire = "especes" | "virement" | "orange_money" | "wave";

export const MODES_PAIEMENT_SALAIRE: { value: ModePaiementSalaire; label: string }[] = [
  { value: "especes", label: "Espèces" },
  { value: "virement", label: "Virement bancaire" },
  { value: "orange_money", label: "Orange Money" },
  { value: "wave", label: "Wave" },
];

export const MODE_PAIEMENT_SALAIRE_LABEL: Record<ModePaiementSalaire, string> =
  MODES_PAIEMENT_SALAIRE.reduce(
    (acc, m) => ({ ...acc, [m.value]: m.label }),
    {} as Record<ModePaiementSalaire, string>,
  );

export type BulletinPaie = {
  id: string;
  employeId: string;
  /** Période au format YYYY-MM. */
  mois: string;
  salaireBase: number;
  primes: number;
  heuresSupplementaires: number;
  tauxHeureSupplementaire: number;
  avances: number;
  retenues: number;
  statut: StatutPaie;
  datePaiement: string | null;
  modePaiement: ModePaiementSalaire;
  observation: string;
};

export function salaireNet(bulletin: BulletinPaie) {
  return Math.max(
    0,
    bulletin.salaireBase +
      bulletin.primes +
      bulletin.heuresSupplementaires * bulletin.tauxHeureSupplementaire -
      bulletin.avances -
      bulletin.retenues,
  );
}

export const MOIS_LABEL = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export function formatMois(mois: string) {
  const [annee, m] = mois.split("-");
  const index = Number(m) - 1;
  return `${MOIS_LABEL[index] ?? m} ${annee}`;
}

/* ------------------------------------------------------------------ */
/* Journal d'activité                                                   */
/* ------------------------------------------------------------------ */

export type TypeActivite =
  | "connexion"
  | "deconnexion"
  | "ajout"
  | "modification"
  | "suppression"
  | "validation";

export const TYPE_ACTIVITE_LABEL: Record<TypeActivite, string> = {
  connexion: "Connexion",
  deconnexion: "Déconnexion",
  ajout: "Ajout",
  modification: "Modification",
  suppression: "Suppression",
  validation: "Validation",
};

export const TYPE_ACTIVITE_CLASSE: Record<TypeActivite, string> = {
  connexion: "bg-primary-soft text-primary",
  deconnexion: "bg-muted text-muted-foreground",
  ajout: "bg-success/10 text-success",
  modification: "bg-amber-500/10 text-amber-600",
  suppression: "bg-destructive/10 text-destructive",
  validation: "bg-primary-soft text-primary",
};

export type ActiviteJournal = {
  id: string;
  date: string;
  employeId: string | null;
  auteur: string;
  type: TypeActivite;
  module: string;
  description: string;
};
