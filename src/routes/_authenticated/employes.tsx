import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

const TITLE = "Employés";
const DESCRIPTION =
  "Équipe, rôles, permissions, présence et performances du personnel de Bekaye Sora.";

export const Route = createFileRoute("/_authenticated/employes")({
  head: () => ({
    meta: [
      { title: `${TITLE} — Bekaye Sora Business Manager` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `${TITLE} — Bekaye Sora Business Manager` },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: EmployesLayout,
});

const ONGLETS = [
  { to: "/employes", label: "Équipe" },
  { to: "/employes/presence", label: "Présence" },
  { to: "/employes/conges", label: "Congés" },
  { to: "/employes/permissions", label: "Rôles & permissions" },
  { to: "/employes/performance", label: "Performances" },
  { to: "/employes/journal", label: "Journal d'activité" },
] as const;

function EmployesLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5">
      <nav className="no-scrollbar flex w-full gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 shadow-[var(--shadow-card)] xl:w-fit">
        {ONGLETS.map((onglet) => {
          const actif =
            onglet.to === "/employes" ? pathname === "/employes" : pathname.startsWith(onglet.to);
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
