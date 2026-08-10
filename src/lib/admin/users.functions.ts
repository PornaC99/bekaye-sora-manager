import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Gestion réelle des comptes utilisateurs (côté serveur).
 *
 * Toutes les fonctions :
 *  - vérifient la permission `users.manage` via la base (jamais depuis le client) ;
 *  - dérivent l'entreprise du profil de l'appelant (aucun tenantId accepté du client) ;
 *  - écrivent une trace dans `journal_audit`.
 */

const ROLES = [
  "administrateur",
  "directeur",
  "manager",
  "caissier",
  "vendeur",
  "magasinier",
  "comptable",
] as const;

type Contexte = {
  supabase: {
    rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
    from: (table: string) => any;
  };
  userId: string;
};

async function exigerDroit(context: Contexte, permission: string) {
  const { data, error } = await context.supabase.rpc("a_permission", { _permission: permission });
  if (error || data !== true) {
    throw new Response("Forbidden", { status: 403 });
  }
  const { data: profil } = await context.supabase
    .from("profiles")
    .select("entreprise_id, nom_complet")
    .eq("user_id", context.userId)
    .maybeSingle();
  const entrepriseId = profil?.entreprise_id as string | undefined;
  if (!entrepriseId) throw new Response("Forbidden", { status: 403 });
  return { entrepriseId, acteur: (profil?.nom_complet as string) ?? "Utilisateur" };
}

async function auditer(
  entrepriseId: string,
  userId: string,
  acteur: string,
  action: string,
  cible: string | null,
  details: Record<string, unknown>,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("journal_audit").insert({
    entreprise_id: entrepriseId,
    user_id: userId,
    acteur,
    action,
    entite: "utilisateurs",
    entite_id: cible,
    details,
  });
}

export const creerCompteEmploye = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        nomComplet: z.string().trim().min(2).max(120),
        email: z.string().trim().email().max(255),
        motDePasse: z.string().min(8).max(72),
        telephone: z.string().trim().max(40).optional(),
        role: z.enum(ROLES),
        magasinId: z.string().uuid().nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { entrepriseId, acteur } = await exigerDroit(context as unknown as Contexte, "users.manage");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: cree, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.motDePasse,
      email_confirm: true,
      user_metadata: { nom_complet: data.nomComplet },
    });
    if (error || !cree.user) throw new Error(error?.message ?? "Création du compte impossible");

    const nouvelId = cree.user.id;

    const { error: erreurProfil } = await supabaseAdmin.from("profiles").upsert(
      {
        user_id: nouvelId,
        entreprise_id: entrepriseId,
        magasin_id: data.magasinId ?? null,
        nom_complet: data.nomComplet,
        email: data.email,
        telephone: data.telephone ?? null,
        actif: true,
      },
      { onConflict: "user_id" },
    );
    if (erreurProfil) throw new Error(erreurProfil.message);

    await supabaseAdmin.from("user_roles").delete().eq("user_id", nouvelId);
    const { error: erreurRole } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: nouvelId, entreprise_id: entrepriseId, role: data.role });
    if (erreurRole) throw new Error(erreurRole.message);

    await auditer(entrepriseId, context.userId, acteur, "users.create", nouvelId, {
      email: data.email,
      role: data.role,
      magasin_id: data.magasinId ?? null,
    });

    return { userId: nouvelId };
  });

export const modifierCompteEmploye = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        userId: z.string().uuid(),
        nomComplet: z.string().trim().min(2).max(120).optional(),
        telephone: z.string().trim().max(40).nullable().optional(),
        role: z.enum(ROLES).optional(),
        magasinId: z.string().uuid().nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { entrepriseId, acteur } = await exigerDroit(context as unknown as Contexte, "users.manage");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: cible } = await supabaseAdmin
      .from("profiles")
      .select("entreprise_id")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (!cible || cible.entreprise_id !== entrepriseId) {
      throw new Response("Forbidden", { status: 403 });
    }

    const majProfil: Record<string, unknown> = {};
    if (data.nomComplet !== undefined) majProfil["nom_complet"] = data.nomComplet;
    if (data.telephone !== undefined) majProfil["telephone"] = data.telephone;
    if (data.magasinId !== undefined) majProfil["magasin_id"] = data.magasinId;
    if (Object.keys(majProfil).length > 0) {
      await supabaseAdmin.from("profiles").update(majProfil).eq("user_id", data.userId);
    }

    if (data.role) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, entreprise_id: entrepriseId, role: data.role });
    }

    await auditer(entrepriseId, context.userId, acteur, "users.update", data.userId, { ...data });
    return { ok: true };
  });

export const basculerCompteEmploye = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ userId: z.string().uuid(), actif: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { entrepriseId, acteur } = await exigerDroit(context as unknown as Contexte, "users.manage");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: cible } = await supabaseAdmin
      .from("profiles")
      .select("entreprise_id")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (!cible || cible.entreprise_id !== entrepriseId) {
      throw new Response("Forbidden", { status: 403 });
    }
    if (data.userId === context.userId && !data.actif) {
      throw new Error("Vous ne pouvez pas désactiver votre propre compte.");
    }

    await supabaseAdmin.from("profiles").update({ actif: data.actif }).eq("user_id", data.userId);
    await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: data.actif ? "none" : "876000h",
    });

    await auditer(
      entrepriseId,
      context.userId,
      acteur,
      data.actif ? "users.enable" : "users.disable",
      data.userId,
      { actif: data.actif },
    );
    return { ok: true };
  });

export const reinitialiserMotDePasseEmploye = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ userId: z.string().uuid(), motDePasse: z.string().min(8).max(72) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { entrepriseId, acteur } = await exigerDroit(context as unknown as Contexte, "users.manage");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: cible } = await supabaseAdmin
      .from("profiles")
      .select("entreprise_id")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (!cible || cible.entreprise_id !== entrepriseId) {
      throw new Response("Forbidden", { status: 403 });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.motDePasse,
    });
    if (error) throw new Error(error.message);

    await auditer(entrepriseId, context.userId, acteur, "users.reset_password", data.userId, {});
    return { ok: true };
  });
