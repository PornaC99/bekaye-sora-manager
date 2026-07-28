import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/page";
import { BRAND } from "@/lib/navigation";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { RecentSalesTable } from "@/components/dashboard/recent-sales-table";
import { TopProducts } from "@/components/dashboard/top-products";
import { LowStock } from "@/components/dashboard/low-stock";
import { RecentNotifications } from "@/components/dashboard/recent-notifications";
import { EmployeeActivityList } from "@/components/dashboard/employee-activity";
import { MonthlyGoal } from "@/components/dashboard/monthly-goal";
import { QuickActions } from "@/components/dashboard/quick-actions";

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
  const today = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        eyebrow="Pilotage"
        title="Tableau de bord"
        description={DESCRIPTION}
        actions={
          <div className="rounded-xl border border-border bg-card px-4 py-2.5 text-right shadow-[var(--shadow-card)]">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{today}</p>
            <p className="mt-0.5 font-display text-xs font-medium text-primary">{BRAND.slogan}</p>
          </div>
        }
      />

      <KpiCards />

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <SalesChart />
        <CategoryChart />
      </div>

      <MonthlyGoal />

      <RecentSalesTable />

      <div className="grid gap-6 xl:grid-cols-2">
        <TopProducts />
        <LowStock />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <RecentNotifications />
        <EmployeeActivityList />
      </div>

      <QuickActions />
    </div>
  );
}
