import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

const TITLE = "Comptabilité & Finances";
const DESCRIPTION =
  "Centre financier de Bekaye Sora : chiffre d'affaires, dépenses, trésorerie, créances, rentabilité et prévisions.";

export const Route = createFileRoute("/_authenticated/depenses")({
  head: () => ({
    meta: [
      { title: `${TITLE} — Bekaye Sora Business Manager` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `${TITLE} — Bekaye Sora Business Manager` },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: FinancesLayout,
});

const ONGLETS = [
  { to: "/depenses", label: "Vue générale" },
  { to: "/depenses/charges", label: "Dépenses" },
  { to: "/depenses/tresorerie", label: "Trésorerie" },
  { to: "/depenses/creances", label: "Créances & dettes" },
  { to: "/depenses/analyse", label: "Rentabilité" },
  { to: "/depenses/previsions", label: "Prévisions" },
] as const;

function FinancesLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5">
      <nav className="no-scrollbar flex w-full gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 shadow-[var(--shadow-card)] xl:w-fit">
        {ONGLETS.map((onglet) => {
          const actif =
            onglet.to === "/depenses" ? pathname === "/depenses" : pathname.startsWith(onglet.to);
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
