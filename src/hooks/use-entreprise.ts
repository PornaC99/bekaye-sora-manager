import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { creerEntreprise, lireEntrepriseId, reinitialiserTenant } from "@/lib/db/tenant";

export type Entreprise = {
  id: string;
  nom: string;
  secteur: string;
  devise: string;
  ville: string | null;
  logo_url: string | null;
};

export function useEntreprise() {
  return useQuery({
    queryKey: ["entreprise"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<{ entreprise: Entreprise | null; role: string | null }> => {
      const id = await lireEntrepriseId();
      if (!id) return { entreprise: null, role: null };

      const [{ data: entreprise, error }, { data: roles }] = await Promise.all([
        supabase
          .from("entreprises")
          .select("id, nom, secteur, devise, ville, logo_url")
          .eq("id", id)
          .maybeSingle(),
        supabase.from("user_roles").select("role").limit(1),
      ]);
      if (error) throw error;
      return { entreprise: entreprise as Entreprise | null, role: roles?.[0]?.role ?? null };
    },
  });
}

export function useCreerEntreprise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerEntreprise,
    onSuccess: async () => {
      reinitialiserTenant();
      await queryClient.invalidateQueries();
    },
  });
}
