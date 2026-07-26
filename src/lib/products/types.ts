/**
 * Modèle de données du module Produits.
 * Structure pensée pour être branchée telle quelle sur Lovable Cloud (Supabase).
 */

export type StatutProduit = "disponible" | "faible" | "rupture" | "desactive";

export type Produit = {
  id: string;
  nom: string;
  description: string;
  marque: string;
  categorie: string;
  codeBarres: string;
  unite: string;
  prixAchat: number;
  prixVente: number;
  stock: number;
  stockMinimum: number;
  dateExpiration: string | null;
  fournisseur: string;
  actif: boolean;
  image: string | null;
  dateAjout: string;
  dateModification: string;
};

export type MouvementStock = {
  id: string;
  produitId: string;
  date: string; // ISO
  type: "entree" | "sortie";
  utilisateur: string;
  quantite: number;
  observation: string;
};

export type LigneHistorique = {
  id: string;
  produitId: string;
  date: string; // ISO
  reference: string;
  tiers: string;
  quantite: number;
  montant: number;
};

export type ProduitFormValues = Omit<
  Produit,
  "id" | "dateAjout" | "dateModification" | "actif"
> & { actif: boolean };

export const UNITES = ["Pièce", "Carton", "Bouteille", "Sachet", "Lot", "Flacon"] as const;

export function statutProduit(produit: Produit): StatutProduit {
  if (!produit.actif) return "desactive";
  if (produit.stock <= 0) return "rupture";
  if (produit.stock <= produit.stockMinimum) return "faible";
  return "disponible";
}

export const STATUT_LABEL: Record<StatutProduit, string> = {
  disponible: "Disponible",
  faible: "Stock faible",
  rupture: "Rupture",
  desactive: "Désactivé",
};

export const formatFCFA = (value: number) =>
  `${new Intl.NumberFormat("fr-FR").format(Math.round(value))} FCFA`;

export const formatDate = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(
        new Date(iso),
      )
    : "—";

export const formatDateCourt = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
        new Date(iso),
      )
    : "—";

export const formatHeure = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export function margeBeneficiaire(produit: Pick<Produit, "prixAchat" | "prixVente">) {
  if (!produit.prixAchat) return 0;
  return ((produit.prixVente - produit.prixAchat) / produit.prixAchat) * 100;
}

export function expirationProche(produit: Produit, jours = 90) {
  if (!produit.dateExpiration) return false;
  const diff = new Date(produit.dateExpiration).getTime() - Date.now();
  return diff > 0 && diff <= jours * 24 * 60 * 60 * 1000;
}
