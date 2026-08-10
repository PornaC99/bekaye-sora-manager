import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AccessGuard } from "@/components/access/access-guard";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    // Mot de passe temporaire : passage obligatoire par la définition d'un
    // mot de passe personnel avant tout accès aux modules.
    const meta = data.user.user_metadata as { doit_changer_mot_de_passe?: boolean } | undefined;
    if (meta?.doit_changer_mot_de_passe) throw redirect({ to: "/reset-password" });
    return { user: data.user };
  },
  component: () => (
    <AccessGuard>
      <Outlet />
    </AccessGuard>
  ),
});
