import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import { lowStockItems } from "@/lib/dashboard-data";
import { useDemoVierge } from "@/lib/demo/reset";
import { SectionCard } from "./section-card";

export function LowStock() {
  return (
    <SectionCard
      title="Produits bientôt en rupture"
      description="À réapprovisionner en priorité"
      action={
        <Link
          to="/entrees-stock"
          className="text-xs font-semibold text-primary transition-opacity hover:opacity-70"
        >
          Entrées de stock
        </Link>
      }
    >
      <ul className="flex flex-col gap-3">
        {(vierge ? [] : lowStockItems).map((item) => {
          const critique = item.stockActuel < item.stockMinimum;
          return (
            <li
              key={item.id}
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border p-3 transition-colors",
                critique
                  ? "border-primary/25 bg-primary-soft/50"
                  : "border-border hover:bg-muted/40",
              )}
            >
              <div className="min-w-0">
                <p
                  className={cn(
                    "truncate text-sm font-medium",
                    critique ? "text-primary" : "text-foreground",
                  )}
                >
                  {item.nom}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Stock actuel{" "}
                  <span className={cn("font-semibold", critique && "text-primary")}>
                    {item.stockActuel}
                  </span>{" "}
                  · minimum {item.stockMinimum}
                </p>
              </div>
              <button
                type="button"
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  critique
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "border border-border text-foreground hover:bg-muted",
                )}
              >
                Commander
              </button>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
