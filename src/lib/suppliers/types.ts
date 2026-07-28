/**
 * Modèle de données du module « Fournisseurs & Commandes d'achat ».
 * Structure pensée pour être branchée telle quelle sur Lovable Cloud (Supabase).
 */

export type Fournisseur = {
  id: string;
  nom: string; // nom commercial (correspond au champ `fournisseur` des produits)
  entreprise: string;
  telephone: string;
  whatsapp: string;
  email: string;
  adresse: string;
  ville: string;
  pays: string;
  contactPrincipal: string;
  conditionsPaiement: string;
  delaiLivraisonJours: number;
  notes: string;
  logo: string | null;
  favori: boolean;
  actif: boolean;
  dateCreation: string;
};

export type FournisseurFormValues = Omit<Fournisseur, "id" | "dateCreation">;

export type StatutCommande =
  | "brouillon"
  | "envoyee"
  | "confirmee"
  | "preparation"
  | "expediee"
  | "recue"
  | "annulee";

export const STATUTS_COMMANDE: StatutCommande[] = [
  "brouillon",
  "envoyee",
  "confirmee",
  "preparation",
  "expediee",
  "recue",
  "annulee",
];

export const STATUT_COMMANDE_LABEL: Record<StatutCommande, string> = {
  brouillon: "Brouillon",
  envoyee: "Envoyée",
  confirmee: "Confirmée",
  preparation: "En préparation",
  expediee: "Expédiée",
  recue: "Reçue",
  annulee: "Annulée",
};

export const STATUT_COMMANDE_CLASSE: Record<StatutCommande, string> = {
  brouillon: "bg-muted text-muted-foreground",
  envoyee: "bg-primary-soft text-primary",
  confirmee: "bg-sky-500/10 text-sky-600",
  preparation: "bg-amber-500/10 text-amber-600",
  expediee: "bg-violet-500/10 text-violet-600",
  recue: "bg-success/10 text-success",
  annulee: "bg-destructive/10 text-destructive",
};

export const MODES_PAIEMENT_ACHAT = [
  "Espèces",
  "Virement bancaire",
  "Chèque",
  "Orange Money",
  "Crédit 30 jours",
] as const;

export type LigneCommande = {
  produitId: string;
  nom: string;
  quantite: number;
  prixAchat: number;
  remise: number; // en pourcentage
};

export type EvenementCommande = {
  date: string;
  libelle: string;
  utilisateur: string;
};

export type CommentaireCommande = {
  id: string;
  date: string;
  auteur: string;
  texte: string;
};

export type CommandeAchat = {
  id: string;
  numero: string;
  date: string; // ISO
  fournisseurId: string;
  dateLivraisonPrevue: string; // ISO
  dateReception: string | null;
  modePaiement: string;
  observation: string;
  responsable: string;
  statut: StatutCommande;
  lignes: LigneCommande[];
  historique: EvenementCommande[];
  commentaires: CommentaireCommande[];
};

export type CommandeFormValues = {
  fournisseurId: string;
  date: string;
  dateLivraisonPrevue: string;
  modePaiement: string;
  observation: string;
  responsable: string;
  statut: StatutCommande;
  lignes: LigneCommande[];
};

export type NotificationFournisseur = {
  id: string;
  date: string;
  type: "commande" | "reception" | "retard" | "alerte";
  titre: string;
  message: string;
};

/* ------------------------------------------------------------------ */
/* Calculs                                                              */
/* ------------------------------------------------------------------ */

export const sousTotalLigneCommande = (ligne: LigneCommande) =>
  ligne.quantite * ligne.prixAchat;

export const remiseLigneCommande = (ligne: LigneCommande) =>
  (sousTotalLigneCommande(ligne) * ligne.remise) / 100;

export const totalLigneCommande = (ligne: LigneCommande) =>
  sousTotalLigneCommande(ligne) - remiseLigneCommande(ligne);

export const sousTotalCommande = (commande: Pick<CommandeAchat, "lignes">) =>
  commande.lignes.reduce((acc, l) => acc + sousTotalLigneCommande(l), 0);

export const remiseCommande = (commande: Pick<CommandeAchat, "lignes">) =>
  commande.lignes.reduce((acc, l) => acc + remiseLigneCommande(l), 0);

export const montantCommande = (commande: Pick<CommandeAchat, "lignes">) =>
  sousTotalCommande(commande) - remiseCommande(commande);

export const quantiteCommande = (commande: Pick<CommandeAchat, "lignes">) =>
  commande.lignes.reduce((acc, l) => acc + l.quantite, 0);

/** Une commande est en retard si la livraison prévue est dépassée sans réception. */
export function commandeEnRetard(commande: CommandeAchat) {
  if (commande.statut === "recue" || commande.statut === "annulee") return false;
  if (commande.statut === "brouillon") return false;
  return new Date(commande.dateLivraisonPrevue).getTime() < Date.now();
}

export const initialesFournisseur = (nom: string) =>
  nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0]?.toUpperCase() ?? "")
    .join("");
