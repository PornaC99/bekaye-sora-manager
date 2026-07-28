import { supabase } from "@/integrations/supabase/client";
import type { Produit, ProduitFormValues } from "@/lib/products/types";
import type { Fournisseur, FournisseurFormValues } from "@/lib/suppliers/types";

import { exigerEntreprise } from "./tenant";

/* ------------------------------------------------------------------ */
/* Catégories                                                           */
/* ------------------------------------------------------------------ */

export type Categorie = {
  id: string;
  nom: string;
  description: string;
  couleur: string;
  actif: boolean;
  dateCreation: string;
};

const COULEUR_DEFAUT = "#E11D2E";

export async function listerCategories(): Promise<Categorie[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, nom, description, couleur, actif, created_at")
    .order("nom");
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id,
    nom: c.nom,
    description: c.description ?? "",
    couleur: c.couleur ?? COULEUR_DEFAUT,
    actif: c.actif,
    dateCreation: c.created_at,
  }));
}

export async function creerCategorie(values: {
  nom: string;
  description?: string;
  couleur?: string;
}) {
  const entreprise_id = await exigerEntreprise();
  const { data, error } = await supabase
    .from("categories")
    .insert({
      entreprise_id,
      nom: values.nom.trim(),
      description: values.description ?? null,
      couleur: values.couleur ?? COULEUR_DEFAUT,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function majCategorie(
  id: string,
  values: { nom?: string; description?: string; couleur?: string; actif?: boolean },
) {
  const { error } = await supabase.from("categories").update(values).eq("id", id);
  if (error) throw error;
}

export async function supprimerCategorie(id: string) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

/** Retourne l'id d'une catégorie à partir de son nom, en la créant si besoin. */
export async function resoudreCategorie(nom: string): Promise<string | null> {
  const propre = nom?.trim();
  if (!propre) return null;
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .ilike("nom", propre)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (data) return data.id;
  return creerCategorie({ nom: propre });
}

/* ------------------------------------------------------------------ */
/* Fournisseurs                                                         */
/* ------------------------------------------------------------------ */

export async function listerFournisseurs(): Promise<Fournisseur[]> {
  const { data, error } = await supabase
    .from("fournisseurs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((f) => ({
    id: f.id,
    nom: f.nom,
    entreprise: f.entreprise ?? "",
    telephone: f.telephone ?? "",
    whatsapp: f.whatsapp ?? "",
    email: f.email ?? "",
    adresse: f.adresse ?? "",
    ville: f.ville ?? "",
    pays: f.pays ?? "",
    contactPrincipal: f.contact_principal ?? "",
    conditionsPaiement: f.conditions_paiement ?? "",
    delaiLivraisonJours: f.delai_livraison_jours ?? 0,
    notes: f.notes ?? "",
    logo: f.logo_url,
    favori: f.favori,
    actif: f.actif,
    dateCreation: f.created_at,
  }));
}

function versLigneFournisseur(values: FournisseurFormValues) {
  return {
    nom: values.nom,
    entreprise: values.entreprise || null,
    telephone: values.telephone || null,
    whatsapp: values.whatsapp || null,
    email: values.email || null,
    adresse: values.adresse || null,
    ville: values.ville || null,
    pays: values.pays || null,
    contact_principal: values.contactPrincipal || null,
    conditions_paiement: values.conditionsPaiement || null,
    delai_livraison_jours: values.delaiLivraisonJours ?? 0,
    notes: values.notes || null,
    logo_url: values.logo,
    favori: values.favori,
    actif: values.actif,
  };
}

export async function insererFournisseur(id: string, values: FournisseurFormValues) {
  const entreprise_id = await exigerEntreprise();
  const { error } = await supabase
    .from("fournisseurs")
    .insert({ id, entreprise_id, ...versLigneFournisseur(values) });
  if (error) throw error;
}

export async function majFournisseur(id: string, values: FournisseurFormValues) {
  const { error } = await supabase
    .from("fournisseurs")
    .update(versLigneFournisseur(values))
    .eq("id", id);
  if (error) throw error;
}

export async function supprimerFournisseurDb(id: string) {
  const { error } = await supabase.from("fournisseurs").delete().eq("id", id);
  if (error) throw error;
}

/** Retourne l'id d'un fournisseur à partir de son nom (sans le créer). */
export async function resoudreFournisseur(nom: string): Promise<string | null> {
  const propre = nom?.trim();
  if (!propre) return null;
  const { data, error } = await supabase
    .from("fournisseurs")
    .select("id")
    .ilike("nom", propre)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

/* ------------------------------------------------------------------ */
/* Produits                                                             */
/* ------------------------------------------------------------------ */

export async function listerProduits(): Promise<Produit[]> {
  const { data, error } = await supabase
    .from("produits")
    .select(
      "id, nom, description, marque, code_barres, unite, prix_achat, prix_vente, stock, stock_minimum, date_expiration, image_url, actif, created_at, updated_at, categories(nom), fournisseurs(nom)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((p) => ({
    id: p.id,
    nom: p.nom,
    description: p.description ?? "",
    marque: p.marque ?? "",
    categorie: p.categories?.nom ?? "",
    codeBarres: p.code_barres ?? "",
    unite: p.unite,
    prixAchat: Number(p.prix_achat),
    prixVente: Number(p.prix_vente),
    stock: p.stock,
    stockMinimum: p.stock_minimum,
    dateExpiration: p.date_expiration,
    fournisseur: p.fournisseurs?.nom ?? "",
    actif: p.actif,
    image: p.image_url,
    dateAjout: p.created_at,
    dateModification: p.updated_at,
  }));
}

async function versLigneProduit(values: ProduitFormValues) {
  const [categorie_id, fournisseur_id] = await Promise.all([
    resoudreCategorie(values.categorie),
    resoudreFournisseur(values.fournisseur),
  ]);
  return {
    nom: values.nom,
    description: values.description || null,
    marque: values.marque || null,
    code_barres: values.codeBarres || null,
    unite: values.unite,
    prix_achat: values.prixAchat,
    prix_vente: values.prixVente,
    stock: values.stock,
    stock_minimum: values.stockMinimum,
    date_expiration: values.dateExpiration,
    image_url: values.image,
    actif: values.actif,
    categorie_id,
    fournisseur_id,
  };
}

export async function insererProduit(id: string, values: ProduitFormValues) {
  const entreprise_id = await exigerEntreprise();
  const ligne = await versLigneProduit(values);
  const { error } = await supabase.from("produits").insert({ id, entreprise_id, ...ligne });
  if (error) throw error;
}

export async function majProduit(id: string, values: ProduitFormValues) {
  const ligne = await versLigneProduit(values);
  const { error } = await supabase.from("produits").update(ligne).eq("id", id);
  if (error) throw error;
}

export async function majChampsProduit(
  id: string,
  champs: { actif?: boolean; stock?: number; prix_achat?: number; prix_vente?: number },
) {
  const { error } = await supabase.from("produits").update(champs).eq("id", id);
  if (error) throw error;
}

export async function supprimerProduitDb(id: string) {
  const { error } = await supabase.from("produits").delete().eq("id", id);
  if (error) throw error;
}
