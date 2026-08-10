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
    details: details as never,
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
        /** Matricule de la fiche employé associée (traçabilité RH ↔ compte). */
        employeMatricule: z.string().trim().max(40).optional(),
        /** Statut initial du compte (désactivé = connexion refusée). */
        actif: z.boolean().optional(),
        /** Fiche RH à créer et relier au compte authentifié. */
        employe: z
          .object({
            email: z.string().trim().email().max(255).nullable().optional(),
            adresse: z.string().trim().max(255).nullable().optional(),
            poste: z.string().trim().min(1).max(120),
            dateEmbauche: z.string().date(),
            salaireBase: z.number().nonnegative(),
          })
          .optional(),
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
      user_metadata: {
        nom_complet: data.nomComplet,
        // Mot de passe temporaire : changement obligatoire à la 1re connexion.
        doit_changer_mot_de_passe: true,
        ...(data.employeMatricule ? { employe_matricule: data.employeMatricule } : {}),
      },
    });
    if (error || !cree.user) throw new Error(error?.message ?? "Création du compte impossible");

    const nouvelId = cree.user.id;
    try {
      const { error: erreurProfil } = await supabaseAdmin.from("profiles").upsert(
        {
          user_id: nouvelId,
          entreprise_id: entrepriseId,
          magasin_id: data.magasinId ?? null,
          nom_complet: data.nomComplet,
          email: data.email,
          telephone: data.telephone ?? null,
          actif: data.actif ?? true,
        },
        { onConflict: "user_id" },
      );
      if (erreurProfil) throw new Error(erreurProfil.message);

      await supabaseAdmin.from("user_roles").delete().eq("user_id", nouvelId);
      const { error: erreurRole } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: nouvelId, entreprise_id: entrepriseId, role: data.role });
      if (erreurRole) throw new Error(erreurRole.message);

      let employeId: string | null = null;
      if (data.employe) {
        const matricule =
          data.employeMatricule ??
          `BS-${new Date().getFullYear()}-${nouvelId.slice(0, 8).toUpperCase()}`;
        const { data: employeCree, error: erreurEmploye } = await supabaseAdmin
          .from("employes")
          .insert({
            entreprise_id: entrepriseId,
            magasin_id: data.magasinId ?? null,
            user_id: nouvelId,
            matricule,
            nom_complet: data.nomComplet,
            telephone: data.telephone ?? null,
            email: data.employe.email ?? null,
            adresse: data.employe.adresse ?? null,
            poste: data.employe.poste,
            role: data.role,
            date_embauche: data.employe.dateEmbauche,
            salaire_base: data.employe.salaireBase,
            actif: data.actif ?? true,
          })
          .select("id")
          .single();
        if (erreurEmploye) throw new Error(erreurEmploye.message);
        employeId = employeCree.id;
      }

      if (data.actif === false) {
        const { error: erreurStatut } = await supabaseAdmin.auth.admin.updateUserById(nouvelId, {
          ban_duration: "876000h",
        });
        if (erreurStatut) throw new Error(erreurStatut.message);
      }

      await auditer(entrepriseId, context.userId, acteur, "users.create", nouvelId, {
        email: data.email,
        role: data.role,
        magasin_id: data.magasinId ?? null,
        employe_id: employeId,
        employe_matricule: data.employeMatricule ?? null,
        actif: data.actif ?? true,
      });

      return { userId: nouvelId, employeId, email: cree.user.email ?? data.email };
    } catch (liaisonError) {
      // Évite tout compte Auth orphelin si une liaison métier échoue.
      await supabaseAdmin.auth.admin.deleteUser(nouvelId);
      throw liaisonError;
    }
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

    const majProfil: {
      nom_complet?: string;
      telephone?: string | null;
      magasin_id?: string | null;
    } = {};
    if (data.nomComplet !== undefined) majProfil.nom_complet = data.nomComplet;
    if (data.telephone !== undefined) majProfil.telephone = data.telephone ?? null;
    if (data.magasinId !== undefined) majProfil.magasin_id = data.magasinId ?? null;
    if (Object.keys(majProfil).length > 0) {
      await supabaseAdmin.from("profiles").update(majProfil).eq("user_id", data.userId);
    }

    if (data.role) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, entreprise_id: entrepriseId, role: data.role });
    }

    await auditer(entrepriseId, context.userId, acteur, "users.update", data.userId, { ...data } as Record<string, unknown>);
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
      // Mot de passe temporaire : l'utilisateur devra en définir un nouveau.
      user_metadata: { doit_changer_mot_de_passe: true },
    });
    if (error) throw new Error(error.message);

    await auditer(entrepriseId, context.userId, acteur, "users.reset_password", data.userId, {});
    return { ok: true };
  });
