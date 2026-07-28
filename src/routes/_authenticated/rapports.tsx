import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

const TITLE = "Rapports & Analyses";
const DESCRIPTION = "Analysez les performances de votre entreprise en temps réel.";

export const Route = createFileRoute("/_authenticated/rapports")({
  head: () => ({
    meta: [
      { title: `${TITLE} — Bekaye Sora Business Manager` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `${TITLE} — Bekaye Sora Business Manager` },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: RapportsLayout,
});

const ONGLETS = [
  { to: "/rapports", label: "Vue générale" },
  { to: "/rapports/performance", label: "Centre de performance" },
  { to: "/rapports/comparaison", label: "Comparaison" },
  { to: "/rapports/previsions", label: "Prévisions" },
  { to: "/rapports/planification", label: "Rapports automatiques" },
] as const;

function RapportsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5">
      <nav className="no-scrollbar flex w-full gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 shadow-[var(--shadow-card)] xl:w-fit">
        {ONGLETS.map((onglet) => {
          const actif =
            onglet.to === "/rapports" ? pathname === "/rapports" : pathname.startsWith(onglet.to);
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
