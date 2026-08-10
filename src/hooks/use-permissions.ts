import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

/**
 * Permissions réelles de l'utilisateur connecté, lues depuis la base
 * (`mes_permissions`). Le contrôle définitif reste côté serveur (RLS + RPC) :
 * ce hook sert uniquement à masquer les actions non autorisées.
 */
export function usePermissions() {
  const { data, isLoading } = useQuery({
    queryKey: ["mes-permissions"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.rpc("mes_permissions");
      if (error) throw error;
      return (data ?? []) as string[];
    },
  });

  const permissions = data ?? [];
  return {
    permissions,
    chargement: isLoading,
    peut: (code: string) => permissions.includes(code),
    peutUneDe: (codes: string[]) => codes.some((c) => permissions.includes(c)),
  };
}
