/**
 * Modèle de données du module « Ventes & Caisse » (point de vente).
 * Structure pensée pour être branchée telle quelle sur Lovable Cloud (Supabase).
 */

export type ModePaiement = "especes" | "orange_money" | "moov_money" | "wave" | "carte";

export const MODES_PAIEMENT: { value: ModePaiement; label: string }[] = [
  { value: "especes", label: "Espèces" },
  { value: "orange_money", label: "Orange Money" },
  { value: "moov_money", label: "Moov Money" },
  { value: "wave", label: "Wave" },
  { value: "carte", label: "Carte bancaire" },
];

export const MODE_PAIEMENT_LABEL: Record<ModePaiement, string> = {
  especes: "Espèces",
  orange_money: "Orange Money",
  moov_money: "Moov Money",
  wave: "Wave",
  carte: "Carte bancaire",
};

export type Paiement = { mode: ModePaiement; montant: number };

export type LigneVente = {
  id: string;
  produitId: string;
  nom: string;
  codeBarres: string;
  prixUnitaire: number;
  quantite: number;
};

export type StatutVente = "payee" | "annulee" | "retour";

export const STATUT_VENTE_LABEL: Record<StatutVente, string> = {
  payee: "Payée",
  annulee: "Annulée",
  retour: "Retour partiel",
};

export type Vente = {
  id: string;
  numero: string;
  date: string; // ISO
  client: string;
  telephoneClient: string;
  vendeur: string;
  lignes: LigneVente[];
  remise: number; // montant en FCFA
  tauxTva: number; // 0 = TVA désactivée
  paiements: Paiement[];
  montantRecu: number;
  statut: StatutVente;
  observation: string;
};

export type VenteFormValues = Omit<Vente, "id" | "numero" | "statut">;

export type LigneRetour = { produitId: string; quantite: number; montant: number };

export type Retour = {
  id: string;
  numero: string;
  venteId: string;
  venteNumero: string;
  date: string;
  utilisateur: string;
  motif: string;
  lignes: LigneRetour[];
  montant: number;
};

export const MOTIFS_RETOUR = [
  "Produit défectueux",
  "Erreur de produit",
  "Produit expiré",
  "Client non satisfait",
  "Emballage abîmé",
] as const;

export type TypeOperationCaisse = "ouverture" | "vente" | "retour" | "depense" | "cloture";

export const TYPE_OPERATION_LABEL: Record<TypeOperationCaisse, string> = {
  ouverture: "Ouverture",
  vente: "Vente",
  retour: "Retour",
  depense: "Dépense",
  cloture: "Clôture",
};

export type OperationCaisse = {
  id: string;
  date: string;
  type: TypeOperationCaisse;
  libelle: string;
  montant: number; // positif = entrée, négatif = sortie
  utilisateur: string;
  mode?: ModePaiement;
};

export type SessionCaisse = {
  id: string;
  numero: string;
  dateOuverture: string;
  montantOuverture: number;
  utilisateur: string;
  dateFermeture: string | null;
  montantReel: number | null;
  observation: string;
  operations: OperationCaisse[];
};

export type NotificationVente = {
  id: string;
  date: string;
  type: "vente" | "paiement" | "retour" | "caisse";
  titre: string;
  message: string;
};

/* ------------------------------------------------------------------ */
/* Calculs                                                              */
/* ------------------------------------------------------------------ */

export const sousTotalVente = (vente: Pick<Vente, "lignes">) =>
  vente.lignes.reduce((total, l) => total + l.prixUnitaire * l.quantite, 0);

export const montantTva = (vente: Pick<Vente, "lignes" | "remise" | "tauxTva">) =>
  Math.round(((sousTotalVente(vente) - vente.remise) * vente.tauxTva) / 100);

export const totalVente = (vente: Pick<Vente, "lignes" | "remise" | "tauxTva">) =>
  Math.max(0, sousTotalVente(vente) - vente.remise + montantTva(vente));

export const quantiteVente = (vente: Pick<Vente, "lignes">) =>
  vente.lignes.reduce((total, l) => total + l.quantite, 0);

export const monnaieARendre = (vente: Vente) => Math.max(0, vente.montantRecu - totalVente(vente));

export const libellePaiements = (paiements: Paiement[]) =>
  paiements.length > 1
    ? "Paiement mixte"
    : (MODE_PAIEMENT_LABEL[paiements[0]?.mode ?? "especes"] ?? "—");

/** Montant encaissé en espèces (seul flux qui impacte physiquement le tiroir-caisse). */
export const montantEspeces = (paiements: Paiement[]) =>
  paiements.filter((p) => p.mode === "especes").reduce((t, p) => t + p.montant, 0);

export const soldeCaisse = (session: SessionCaisse) =>
  session.operations.reduce((total, o) => total + o.montant, session.montantOuverture);

export const totalParType = (session: SessionCaisse, type: TypeOperationCaisse) =>
  session.operations.filter((o) => o.type === type).reduce((t, o) => t + o.montant, 0);

export const memeJourVente = (iso: string, reference = new Date()) => {
  const d = new Date(iso);
  return (
    d.getDate() === reference.getDate() &&
    d.getMonth() === reference.getMonth() &&
    d.getFullYear() === reference.getFullYear()
  );
};
