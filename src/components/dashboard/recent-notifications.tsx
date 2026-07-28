import { Bell, LogIn, PackageX, ShoppingCart, Truck, Wallet, type LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import { notifications, type Notification } from "@/lib/dashboard-data";
import { useDemoVierge } from "@/lib/demo/reset";
import { SectionCard } from "./section-card";

const config: Record<Notification["type"], { icon: LucideIcon; tone: string }> = {
  vente: { icon: ShoppingCart, tone: "bg-success/10 text-success" },
  rupture: { icon: PackageX, tone: "bg-primary-soft text-primary" },
  livraison: { icon: Truck, tone: "bg-muted text-muted-foreground" },
  caisse: { icon: Wallet, tone: "bg-chart-4/15 text-chart-4" },
  employe: { icon: LogIn, tone: "bg-muted text-muted-foreground" },
};

const priorityStyles: Record<Notification["priorite"], string> = {
  Haute: "bg-primary-soft text-primary",
  Moyenne: "bg-chart-4/15 text-chart-4",
  Basse: "bg-muted text-muted-foreground",
};

export function RecentNotifications() {
  const vierge = useDemoVierge();
  return (
    <SectionCard
      title="Notifications récentes"
      description="Activité de la journée"
      action={
        <Link
          to="/notifications"
          className="text-xs font-semibold text-primary transition-opacity hover:opacity-70"
        >
          Tout voir
        </Link>
      }
    >
      <ul className="flex flex-col gap-3">
        {(vierge ? [] : notifications).map((notif) => {
          const { icon: Icon, tone } = config[notif.type] ?? { icon: Bell, tone: "bg-muted" };
          return (
            <li
              key={notif.id}
              className="flex items-start gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/40"
            >
              <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", tone)}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">{notif.message}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{notif.heure}</span>
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      priorityStyles[notif.priorite],
                    )}
                  >
                    {notif.priorite}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
