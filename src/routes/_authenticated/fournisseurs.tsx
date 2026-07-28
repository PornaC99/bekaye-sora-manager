import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/fournisseurs")({
  component: FournisseursLayout,
});

const ONGLETS = [
  { to: "/fournisseurs", label: "Fournisseurs" },
  { to: "/fournisseurs/commandes", label: "Commandes d'achat" },
  { to: "/fournisseurs/analyse", label: "Analyse" },
  { to: "/fournisseurs/approvisionnement", label: "Assistant appro" },
] as const;

function FournisseursLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5">
      <nav className="flex w-full gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 shadow-[var(--shadow-card)] sm:w-fit">
        {ONGLETS.map((onglet) => {
          const actif =
            onglet.to === "/fournisseurs"
              ? pathname === "/fournisseurs" || /^\/fournisseurs\/F-/.test(pathname)
              : pathname.startsWith(onglet.to);
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
