import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type RoleBase = Database["public"]["Enums"]["app_role"];

export const ROLES_BASE: { value: RoleBase; label: string; description: string }[] = [
  { value: "directeur", label: "Directeur", description: "Accès total à l'ensemble des modules." },
  {
    value: "administrateur",
    label: "Administrateur",
    description: "Administration technique et gestion des comptes.",
  },
  {
    value: "manager",
    label: "Responsable stock",
    description: "Catalogue, stock, entrées, sorties et inventaires.",
  },
  { value: "magasinier", label: "Magasinier", description: "Entrées, sorties et inventaires." },
  { value: "vendeur", label: "Vendeur", description: "Ventes, caisse, clients et catalogue." },
  { value: "caissier", label: "Caissier", description: "Encaissement, ventes du jour et clients." },
  { value: "comptable", label: "Comptable", description: "Dépenses, trésorerie et rapports." },
];

export const LABEL_ROLE_BASE = ROLES_BASE.reduce(
  (acc, r) => ({ ...acc, [r.value]: r.label }),
  {} as Record<RoleBase, string>,
);

export type UtilisateurEntreprise = {
  userId: string;
  nomComplet: string;
  email: string;
  telephone: string;
  actif: boolean;
  magasinId: string | null;
  role: RoleBase | null;
  creeLe: string;
};

export async function listerUtilisateurs(): Promise<UtilisateurEntreprise[]> {
  const [{ data: profils, error }, { data: roles }] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id, nom_complet, email, telephone, actif, magasin_id, created_at")
      .order("nom_complet"),
    supabase.from("user_roles").select("user_id, role"),
  ]);
  if (error) throw error;

  const parUtilisateur = new Map((roles ?? []).map((r) => [r.user_id, r.role]));
  return (profils ?? []).map((p) => ({
    userId: p.user_id,
    nomComplet: p.nom_complet,
    email: p.email ?? "",
    telephone: p.telephone ?? "",
    actif: p.actif,
    magasinId: p.magasin_id,
    role: parUtilisateur.get(p.user_id) ?? null,
    creeLe: p.created_at,
  }));
}

export type Permission = { code: string; module: string; libelle: string };

export async function listerCataloguePermissions(): Promise<Permission[]> {
  const { data, error } = await supabase
    .from("permissions")
    .select("code, module, libelle")
    .order("module")
    .order("code");
  if (error) throw error;
  return data ?? [];
}

export async function listerMatricePermissions(): Promise<Record<string, string[]>> {
  const { data, error } = await supabase
    .from("role_permissions")
    .select("role, permission, autorise");
  if (error) throw error;
  const matrice: Record<string, string[]> = {};
  for (const ligne of data ?? []) {
    if (!ligne.autorise) continue;
    (matrice[ligne.role] ??= []).push(ligne.permission);
  }
  return matrice;
}

export async function basculerPermissionRole(
  role: RoleBase,
  permission: string,
  autorise: boolean,
) {
  const { data: profil } = await supabase
    .from("profiles")
    .select("entreprise_id")
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .maybeSingle();
  const entreprise_id = profil?.entreprise_id;
  if (!entreprise_id) throw new Error("Aucune entreprise associée à votre compte.");

  const { error } = await supabase
    .from("role_permissions")
    .upsert(
      { entreprise_id, role, permission, autorise },
      { onConflict: "entreprise_id,role,permission" },
    );
  if (error) throw error;
}
