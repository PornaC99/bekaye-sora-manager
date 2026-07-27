/**
 * Modèle de données du module « Entrées de stock » (réceptions fournisseurs).
 * Structure pensée pour être branchée telle quelle sur Lovable Cloud (Supabase).
 */

export type LigneEntree = {
  id: string;
  produitId: string;
  codeBarres: string;
  quantite: number;
  prixAchat: number;
  prixVente: number;
  dateExpiration: string | null;
  numeroLot: string;
};

export type StatutEntree = "validee" | "brouillon" | "annulee";

export type EvenementEntree = {
  id: string;
  date: string; // ISO
  utilisateur: string;
  action: string;
};

export type EntreeStock = {
  id: string;
  numero: string;
  date: string; // ISO (date + heure de la réception)
  fournisseur: string;
  referenceFacture: string;
  bonLivraison: string;
  observation: string;
  utilisateur: string;
  statut: StatutEntree;
  lignes: LigneEntree[];
  historique: EvenementEntree[];
};

export type EntreeFormValues = Omit<EntreeStock, "id" | "numero" | "historique">;

export const STATUT_ENTREE_LABEL: Record<StatutEntree, string> = {
  validee: "Validée",
  brouillon: "Brouillon",
  annulee: "Annulée",
};

export const sousTotalLigne = (ligne: Pick<LigneEntree, "quantite" | "prixAchat">) =>
  ligne.quantite * ligne.prixAchat;

export const montantEntree = (entree: Pick<EntreeStock, "lignes">) =>
  entree.lignes.reduce((total, ligne) => total + sousTotalLigne(ligne), 0);

export const quantiteEntree = (entree: Pick<EntreeStock, "lignes">) =>
  entree.lignes.reduce((total, ligne) => total + ligne.quantite, 0);

export const memeJour = (iso: string, reference = new Date()) => {
  const d = new Date(iso);
  return (
    d.getDate() === reference.getDate() &&
    d.getMonth() === reference.getMonth() &&
    d.getFullYear() === reference.getFullYear()
  );
};

export const dansLaSemaine = (iso: string) => {
  const d = new Date(iso).getTime();
  return d >= Date.now() - 7 * 86_400_000;
};

export const dansLeMois = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};
