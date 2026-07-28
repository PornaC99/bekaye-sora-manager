/**
 * Modèle de données du module « Inventaire Intelligent ».
 * Structure pensée pour être branchée telle quelle sur Lovable Cloud (Supabase).
 */

export type StatutEcart = "conforme" | "mineur" | "important";

export const STATUT_ECART_LABEL: Record<StatutEcart, string> = {
  conforme: "Conforme",
  mineur: "Écart mineur",
  important: "Écart important",
};

export type LigneInventaire = {
  id: string;
  produitId: string;
  nom: string;
  codeBarres: string;
  image: string | null;
  stockTheorique: number;
  stockPhysique: number | null;
  prixAchat: number;
  commentaire: string;
};

export type StatutInventaire = "en_cours" | "termine" | "ajuste";

export const STATUT_INVENTAIRE_LABEL: Record<StatutInventaire, string> = {
  en_cours: "En cours",
  termine: "Terminé",
  ajuste: "Stock ajusté",
};

export type EvenementInventaire = {
  id: string;
  date: string; // ISO
  utilisateur: string;
  action: string;
};

export type Inventaire = {
  id: string;
  numero: string;
  nom: string;
  date: string; // ISO
  responsable: string;
  magasin: string;
  observation: string;
  statut: StatutInventaire;
  signature: string;
  lignes: LigneInventaire[];
  historique: EvenementInventaire[];
};

export type InventaireFormValues = {
  nom: string;
  date: string;
  responsable: string;
  magasin: string;
  observation: string;
};

export const MAGASINS = [
  "Boutique principale",
  "Réserve centrale",
  "Dépôt Ouaga 2000",
  "Point de vente Marché central",
] as const;

export const RESPONSABLES = [
  "Bekaye Sora",
  "Awa Traoré",
  "Moussa Diallo",
  "Fatou Ouédraogo",
] as const;

/* ------------------------------------------------------------------ */
/* Calculs                                                              */
/* ------------------------------------------------------------------ */

export const ligneVerifiee = (ligne: LigneInventaire) => ligne.stockPhysique !== null;

export const ecartLigne = (ligne: LigneInventaire) =>
  ligne.stockPhysique === null ? 0 : ligne.stockPhysique - ligne.stockTheorique;

export const valeurEcartLigne = (ligne: LigneInventaire) => ecartLigne(ligne) * ligne.prixAchat;

/** 🟢 conforme · 🟠 écart mineur (≤ 5 % ou ≤ 2 unités) · 🔴 écart important */
export function statutLigne(ligne: LigneInventaire): StatutEcart {
  const ecart = Math.abs(ecartLigne(ligne));
  if (!ligneVerifiee(ligne) || ecart === 0) return "conforme";
  const seuil = Math.max(2, Math.round(ligne.stockTheorique * 0.05));
  return ecart <= seuil ? "mineur" : "important";
}

export const lignesVerifiees = (inv: Pick<Inventaire, "lignes">) =>
  inv.lignes.filter(ligneVerifiee);

export const lignesEnEcart = (inv: Pick<Inventaire, "lignes">) =>
  lignesVerifiees(inv).filter((l) => ecartLigne(l) !== 0);

export const valeurStockTheorique = (inv: Pick<Inventaire, "lignes">) =>
  inv.lignes.reduce((t, l) => t + l.stockTheorique * l.prixAchat, 0);

export const valeurPertes = (inv: Pick<Inventaire, "lignes">) =>
  lignesVerifiees(inv).reduce((t, l) => t + Math.min(0, valeurEcartLigne(l)), 0);

export const valeurSurplus = (inv: Pick<Inventaire, "lignes">) =>
  lignesVerifiees(inv).reduce((t, l) => t + Math.max(0, valeurEcartLigne(l)), 0);

export const valeurEcartTotal = (inv: Pick<Inventaire, "lignes">) =>
  lignesVerifiees(inv).reduce((t, l) => t + valeurEcartLigne(l), 0);

export const tauxConformite = (inv: Pick<Inventaire, "lignes">) => {
  const verifiees = lignesVerifiees(inv).length;
  if (!verifiees) return 100;
  return Math.round(((verifiees - lignesEnEcart(inv).length) / verifiees) * 100);
};

export const progression = (inv: Pick<Inventaire, "lignes">) =>
  inv.lignes.length ? Math.round((lignesVerifiees(inv).length / inv.lignes.length) * 100) : 0;
