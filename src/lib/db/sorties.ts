import { supabase } from "@/integrations/supabase/client";
import { publier } from "@/lib/core/notifications";

/**
 * Sorties de stock — accès Supabase.
 * L'écriture passe exclusivement par la fonction serveur `creer_sortie_stock`
 * (vérification de permission, contrôle du stock et journal d'audit côté base).
 */

export const MOTIFS_SORTIE = [
  { value: "vente", label: "Vente" },
  { value: "transfert", label: "Transfert entre magasins" },
  { value: "perte", label: "Perte" },
  { value: "casse", label: "Casse" },
  { value: "peremption", label: "Péremption" },
  { value: "echantillon", label: "Échantillon / offert" },
  { value: "retour_fournisseur", label: "Retour fournisseur" },
  { value: "ajustement", label: "Ajustement d'inventaire" },
] as const;

export type MotifSortie = (typeof MOTIFS_SORTIE)[number]["value"];

export const LABEL_MOTIF: Record<string, string> = MOTIFS_SORTIE.reduce(
  (acc, m) => ({ ...acc, [m.value]: m.label }),
  {} as Record<string, string>,
);

export type SortieStock = {
  id: string;
  numero: string;
  date: string;
  produitId: string;
  produit: string;
  quantite: number;
  unite: string;
  motif: string;
  commentaire: string;
  lot: string;
  reference: string;
  valeurUnitaire: number;
  valeurTotale: number;
  stockApres: number | null;
  magasin: string;
};

export type FiltresSorties = {
  recherche?: string;
  motif?: string;
  magasinId?: string;
  du?: string;
  au?: string;
};

export async function listerSorties(filtres: FiltresSorties = {}): Promise<SortieStock[]> {
  let requete = supabase
    .from("mouvements_stock")
    .select(
      "id, numero, date_mouvement, quantite, motif, commentaire, lot, unite, reference, valeur_unitaire, stock_apres, produit_id, produits(nom, unite), magasins(nom)",
    )
    .eq("type", "sortie")
    .order("date_mouvement", { ascending: false })
    .limit(500);

  if (filtres.motif && filtres.motif !== "tous") requete = requete.eq("motif", filtres.motif);
  if (filtres.magasinId && filtres.magasinId !== "tous")
    requete = requete.eq("magasin_id", filtres.magasinId);
  if (filtres.du) requete = requete.gte("date_mouvement", `${filtres.du}T00:00:00`);
  if (filtres.au) requete = requete.lte("date_mouvement", `${filtres.au}T23:59:59`);

  const { data, error } = await requete;
  if (error) throw error;

  const recherche = filtres.recherche?.trim().toLowerCase() ?? "";

  return (data ?? [])
    .map((m) => {
      const produit = (m.produits as { nom?: string; unite?: string } | null) ?? null;
      const valeur = Number(m.valeur_unitaire ?? 0);
      return {
        id: m.id,
        numero: m.numero ?? "—",
        date: m.date_mouvement,
        produitId: m.produit_id,
        produit: produit?.nom ?? "Produit supprimé",
        quantite: m.quantite,
        unite: m.unite ?? produit?.unite ?? "unité",
        motif: m.motif ?? "ajustement",
        commentaire: m.commentaire ?? "",
        lot: m.lot ?? "",
        reference: m.reference ?? "",
        valeurUnitaire: valeur,
        valeurTotale: valeur * m.quantite,
        stockApres: m.stock_apres,
        magasin: (m.magasins as { nom?: string } | null)?.nom ?? "Magasin principal",
      } satisfies SortieStock;
    })
    .filter((s) =>
      recherche
        ? `${s.numero} ${s.produit} ${s.reference} ${s.lot} ${s.commentaire}`
            .toLowerCase()
            .includes(recherche)
        : true,
    );
}

export type ProduitSortie = {
  id: string;
  nom: string;
  stock: number;
  unite: string;
  cump: number;
  magasinId: string | null;
};

export async function listerProduitsDisponibles(): Promise<ProduitSortie[]> {
  const { data, error } = await supabase
    .from("produits")
    .select("id, nom, stock, unite, cump, magasin_id")
    .eq("actif", true)
    .order("nom");
  if (error) throw error;
  return (data ?? []).map((p) => ({
    id: p.id,
    nom: p.nom,
    stock: p.stock,
    unite: p.unite,
    cump: Number(p.cump ?? 0),
    magasinId: p.magasin_id,
  }));
}

export async function listerMagasins(): Promise<{ id: string; nom: string }[]> {
  const { data, error } = await supabase
    .from("magasins")
    .select("id, nom")
    .eq("actif", true)
    .order("nom");
  if (error) throw error;
  return data ?? [];
}

export async function listerLots(
  produitId: string,
): Promise<{ id: string; lot: string; quantiteRestante: number; dateExpiration: string | null }[]> {
  const { data, error } = await supabase
    .from("lots_stock")
    .select("id, lot, quantite_restante, date_expiration")
    .eq("produit_id", produitId)
    .gt("quantite_restante", 0)
    .order("date_expiration", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []).map((l) => ({
    id: l.id,
    lot: l.lot,
    quantiteRestante: l.quantite_restante,
    dateExpiration: l.date_expiration,
  }));
}

export type SortieFormValues = {
  produitId: string;
  quantite: number;
  motif: string;
  magasinId?: string | null;
  commentaire?: string;
  reference?: string;
  lot?: string | null;
};

export async function creerSortie(values: SortieFormValues): Promise<string> {
  const { data, error } = await supabase.rpc("creer_sortie_stock", {
    _produit_id: values.produitId,
    _quantite: values.quantite,
    _motif: values.motif,
    _magasin_id: values.magasinId ?? undefined,
    _commentaire: values.commentaire?.trim() || undefined,
    _reference: values.reference?.trim() || undefined,
    _lot: values.lot || undefined,
  });
  if (error) throw new Error(traduireErreur(error.message));

  publier({
    module: "stock",
    ton: "alerte",
    titre: "Sortie de stock enregistrée",
    message: `${values.quantite} unité(s) sorties · ${LABEL_MOTIF[values.motif] ?? values.motif}.`,
    lien: "/sorties-stock",
  });
  return data as string;
}

function traduireErreur(message: string) {
  if (message.includes("Permission refusée"))
    return "Votre rôle ne vous autorise pas à enregistrer une sortie de stock.";
  if (message.includes("Stock insuffisant")) return message;
  if (message.includes("Produit introuvable")) return "Ce produit n'existe pas dans votre entreprise.";
  return message;
}
