import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BadgeCheck,
  CalendarRange,
  Coins,
  PackageX,
  Package,
  ShoppingCart,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { kpis, type Kpi } from "@/lib/dashboard-data";

const icons: Record<Kpi["icon"], LucideIcon> = {
  revenue: Coins,
  month: CalendarRange,
  sales: ShoppingCart,
  stock: Package,
  out: PackageX,
  low: TriangleAlert,
  cash: Banknote,
  clients: Users,
  staff: BadgeCheck,
};

const tones: Record<Kpi["tone"], string> = {
  primary: "bg-primary-soft text-primary",
  neutral: "bg-muted text-muted-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-chart-4/15 text-chart-4",
  danger: "bg-primary-soft text-primary",
};

function Trend({ trend, hint }: { trend: number | null; hint: string }) {
  if (trend === null) {
    return <span className="text-xs text-muted-foreground">{hint}</span>;
  }
  const positive = trend >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-xs">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold",
          positive ? "bg-success/10 text-success" : "bg-primary-soft text-primary",
        )}
      >
        <Icon className="h-3 w-3" />
        {positive ? "+" : ""}
        {trend}
        {Number.isInteger(trend) && Math.abs(trend) < 10 ? "" : " %"}
      </span>
      <span className="truncate text-muted-foreground">{hint}</span>
    </span>
  );
}

export function KpiCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {kpis.map((kpi) => {
        const Icon = icons[kpi.icon];
        return (
          <article
            key={kpi.id}
            className="group rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[var(--shadow-soft)]"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                {kpi.label}
              </p>
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-105",
                  tones[kpi.tone],
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
              </span>
            </div>
            <p className="mt-4 font-display text-2xl font-semibold tracking-tight text-foreground">
              {kpi.value}
            </p>
            <div className="mt-2">
              <Trend trend={kpi.trend} hint={kpi.hint} />
            </div>
          </article>
        );
      })}
    </div>
  );
}
