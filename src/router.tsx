import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Moins d'allers-retours Supabase : les données restent fraîches 1 min
        // et sont conservées 10 min en cache pour une navigation instantanée.
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: false,
        retry: (echecs, erreur) => {
          const code = (erreur as { status?: number } | null)?.status;
          if (code && code >= 400 && code < 500) return false;
          return echecs < 2;
        },
      },
      mutations: { retry: 0 },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 30_000,
  });

  return router;
};

