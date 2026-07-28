import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

const TITLE = "NEXUSIA Insight";
const DESCRIPTION = "Votre conseiller intelligent pour piloter votre entreprise.";

export const Route = createFileRoute("/_authenticated/nexusia")({
  head: () => ({
    meta: [
      { title: `${TITLE} — Bekaye Sora Business Manager` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `${TITLE} — Bekaye Sora Business Manager` },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NexusiaLayout,
});

const ONGLETS = [
  { to: "/nexusia", label: "Conseiller" },
  { to: "/nexusia/decision", label: "Centre de décision" },
  { to: "/nexusia/produits", label: "Produits" },
  { to: "/nexusia/employes", label: "Employés" },
  { to: "/nexusia/finances", label: "Finances" },
  { to: "/nexusia/clients", label: "Clients" },
  { to: "/nexusia/rapports", label: "Rapports" },
  { to: "/nexusia/recherche", label: "Recherche" },
  { to: "/nexusia/objectifs", label: "Objectifs" },
] as const;

function NexusiaLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5">
      <nav className="flex w-full gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 shadow-[var(--shadow-card)] xl:w-fit">
        {ONGLETS.map((onglet) => {
          const actif =
            onglet.to === "/nexusia" ? pathname === "/nexusia" : pathname.startsWith(onglet.to);
          return (
            <Link
              key={onglet.to}
              to={onglet.to}
              className={cn(
                "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition",
                actif
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {onglet.label}
            </Link>
          );
        })}
      </nav>
      <Outlet />
    </div>
  );
}
