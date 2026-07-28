import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/page";
import { cn } from "@/lib/utils";

const TITLE = "Administration";
const DESCRIPTION = "Configurez et sécurisez votre entreprise.";

export const Route = createFileRoute("/administration")({
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
  component: AdministrationLayout,
});

const ONGLETS = [
  { to: "/administration", label: "Entreprise" },
  { to: "/administration/personnalisation", label: "Personnalisation" },
  { to: "/administration/utilisateurs", label: "Utilisateurs & rôles" },
  { to: "/administration/audit", label: "Journal d'audit" },
  { to: "/administration/securite", label: "Sécurité" },
  { to: "/administration/sauvegardes", label: "Sauvegardes" },
  { to: "/administration/notifications", label: "Notifications" },
  { to: "/administration/magasins", label: "Multi-magasins" },
  { to: "/administration/entreprises", label: "Multi-entreprises" },
  { to: "/administration/preferences", label: "Paramètres métiers" },
  { to: "/administration/donnees", label: "Import / Export" },
  { to: "/administration/maintenance", label: "Maintenance" },
  { to: "/administration/a-propos", label: "À propos" },
] as const;

function AdministrationLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5">
      <PageHeader eyebrow="Système" title={TITLE} description={DESCRIPTION} />

      <nav className="flex w-full gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 shadow-[var(--shadow-card)]">
        {ONGLETS.map((onglet) => {
          const actif =
            onglet.to === "/administration"
              ? pathname === "/administration"
              : pathname.startsWith(onglet.to);
          return (
            <Link
              key={onglet.to}
              to={onglet.to}
              className={cn(
                "whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition",
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
