import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/page";
import { BRAND } from "@/lib/navigation";
import { DashboardParRole, DESCRIPTION_ROLE } from "@/components/dashboard/role-dashboards";
import { useRoleActuel } from "@/hooks/use-role";
import { LABEL_ROLE } from "@/lib/access/roles";

const DESCRIPTION =
  "Vue d'ensemble de l'activité Bekaye Sora : ventes, stock, caisse et équipe en un seul coup d'œil.";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Bekaye Sora Business Manager" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Tableau de bord — Bekaye Sora Business Manager" },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { role } = useRoleActuel();

  const today = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <BrandBanner action={{ label: "Ouvrir la caisse", to: "/caisse" }} />

      <PageHeader
        eyebrow={`Pilotage · ${LABEL_ROLE[role]}`}
        title="Tableau de bord"
        description={DESCRIPTION_ROLE[role]}
        actions={
          <div className="card-luxe px-4 py-2.5 text-right">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{today}</p>
            <p className="mt-0.5 font-display text-xs font-medium text-primary">{BRAND.slogan}</p>
          </div>
        }
      />


      <DashboardParRole role={role} />
    </div>
  );
}
