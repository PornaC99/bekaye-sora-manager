import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

/** Session Supabase réactive, alimentée par onAuthStateChange. */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setChargement(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChargement(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, chargement };
}

export function nomAffiche(user: User | null) {
  if (!user) return "Utilisateur";
  const meta = user.user_metadata as { nom_complet?: string; full_name?: string } | undefined;
  return meta?.nom_complet || meta?.full_name || user.email?.split("@")[0] || "Utilisateur";
}

export function initialesUtilisateur(nom: string) {
  return nom
    .split(/\s+/)
    .slice(0, 2)
    .map((m) => m[0]?.toUpperCase() ?? "")
    .join("");
}
