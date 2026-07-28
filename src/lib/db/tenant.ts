import { supabase } from "@/integrations/supabase/client";

/**
 * Contexte multi-entreprise (tenant).
 * Toutes les écritures Supabase passent par `exigerEntreprise()` afin que la
 * colonne `entreprise_id` soit toujours renseignée et que le RLS accepte la ligne.
 */

let cache: string | null | undefined;
let enCours: Promise<string | null> | null = null;

export async function lireEntrepriseId(): Promise<string | null> {
  if (cache !== undefined) return cache;
  if (enCours) return enCours;

  enCours = (async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      cache = null;
      return null;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("entreprise_id")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (error) throw error;
    cache = data?.entreprise_id ?? null;
    return cache;
  })();

  try {
    return await enCours;
  } finally {
    enCours = null;
  }
}

export async function exigerEntreprise(): Promise<string> {
  const id = await lireEntrepriseId();
  if (!id) throw new Error("Aucune entreprise associée à votre compte.");
  return id;
}

export function reinitialiserTenant() {
  cache = undefined;
  enCours = null;
}

export async function creerEntreprise(input: {
  nom: string;
  secteur?: string;
  devise?: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc("creer_entreprise", {
    _nom: input.nom,
    _secteur: input.secteur ?? "cosmetiques",
    _devise: input.devise ?? "XOF",
  });
  if (error) throw error;
  reinitialiserTenant();
  return data as string;
}
