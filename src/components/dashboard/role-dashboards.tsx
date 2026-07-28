import type { ReactNode } from "react";

import { CategoryChart } from "@/components/dashboard/category-chart";
import { EmployeeActivityList } from "@/components/dashboard/employee-activity";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { LowStock } from "@/components/dashboard/low-stock";
import { MonthlyGoal } from "@/components/dashboard/monthly-goal";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentNotifications } from "@/components/dashboard/recent-notifications";
import { RecentSalesTable } from "@/components/dashboard/recent-sales-table";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { TopProducts } from "@/components/dashboard/top-products";
import type { RoleCle } from "@/lib/access/roles";

const Deux = ({ children }: { children: ReactNode }) => (
  <div className="grid gap-6 xl:grid-cols-2">{children}</div>
);

/** Tableau de bord complet du Directeur. */
function DashboardDirecteur() {
  return (
    <>
      <KpiCards />
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <SalesChart />
        <CategoryChart />
      </div>
      <MonthlyGoal />
      <RecentSalesTable />
      <Deux>
        <TopProducts />
        <LowStock />
      </Deux>
      <Deux>
        <RecentNotifications />
        <EmployeeActivityList />
      </Deux>
      <QuickActions />
    </>
  );
}

/** Comptable : finances, tendances et synthèse — sans opérations de stock. */
function DashboardComptable() {
  return (
    <>
      <KpiCards />
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <SalesChart />
        <CategoryChart />
      </div>
      <MonthlyGoal />
      <RecentSalesTable />
    </>
  );
}

/** Caissier / Vendeur : centré sur l'encaissement et les ventes du jour. */
function DashboardVente({ avecCatalogue }: { avecCatalogue: boolean }) {
  return (
    <>
      <QuickActions />
      <MonthlyGoal />
      <RecentSalesTable />
      <Deux>
        <TopProducts />
        {avecCatalogue ? <LowStock /> : <RecentNotifications />}
      </Deux>
    </>
  );
}

/** Magasinier / Gestionnaire de stock : disponibilité et rotation produits. */
function DashboardStock() {
  return (
    <>
      <Deux>
        <LowStock />
        <TopProducts />
      </Deux>
      <CategoryChart />
      <RecentNotifications />
      <QuickActions />
    </>
  );
}

export function DashboardParRole({ role }: { role: RoleCle }) {
  switch (role) {
    case "comptable":
      return <DashboardComptable />;
    case "caissier":
      return <DashboardVente avecCatalogue={false} />;
    case "vendeur":
      return <DashboardVente avecCatalogue />;
    case "magasinier":
    case "gestionnaire_stock":
      return <DashboardStock />;
    case "directeur":
    default:
      return <DashboardDirecteur />;
  }
}

export const DESCRIPTION_ROLE: Record<RoleCle, string> = {
  directeur:
    "Vue d'ensemble de l'activité Bekaye Sora : ventes, stock, caisse et équipe en un seul coup d'œil.",
  comptable: "Suivi financier : chiffre d'affaires, marges, dépenses et objectifs du mois.",
  caissier: "Votre poste d'encaissement : ventes du jour, objectif et accès rapides.",
  vendeur: "Vos ventes, les meilleurs produits et l'état du catalogue en temps réel.",
  magasinier: "État du stock : alertes de rupture, rotations et mouvements récents.",
  gestionnaire_stock:
    "Pilotage du stock et des approvisionnements : ruptures, rotations et catégories.",
};
