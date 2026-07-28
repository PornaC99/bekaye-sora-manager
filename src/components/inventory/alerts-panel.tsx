import { AlertTriangle, CalendarClock, Moon, PackageX, Scale, type LucideIcon } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import type { Alerte } from "@/lib/inventory/insights";
import { cn } from "@/lib/utils";

const ICONES: Record<Alerte["type"], LucideIcon> = {
  rupture: PackageX,
  dormant: Moon,
  ecart: Scale,
  peremption: CalendarClock,
};

const TITRES: Record<Alerte["type"], string> = {
  rupture: "Produits souvent en rupture",
  dormant: "Produits qui ne se vendent pas",
  ecart: "Produits avec des écarts fréquents",
  peremption: "Produits proches de la péremption",
};

const TONS: Record<Alerte["gravite"], string> = {
  info: "bg-muted text-muted-foreground",
  attention: "bg-amber-500/10 text-amber-600",
  critique: "bg-primary-soft text-primary",
};

export function AlertsPanel({ alertes }: { alertes: Alerte[] }) {
  const groupes = (Object.keys(TITRES) as Alerte["type"][]).map((type) => ({
    type,
    items: alertes.filter((a) => a.type === type).slice(0, 5),
    total: alertes.filter((a) => a.type === type).length,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {groupes.map((groupe) => {
        const Icon = ICONES[groupe.type];
        return (
          <SectionCard
            key={groupe.type}
            title={TITRES[groupe.type]}
            description={`${groupe.total} produit${groupe.total > 1 ? "s" : ""} détecté${groupe.total > 1 ? "s" : ""} automatiquement`}
            action={
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-muted text-muted-foreground">
                <Icon className="h-4 w-4" />
              </span>
            }
          >
            {groupe.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun signalement. Tout va bien 👍</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {groupe.items.map((alerte) => (
                  <li key={alerte.id} className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg",
                        TONS[alerte.gravite],
                      )}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{alerte.titre}</p>
                      <p className="text-xs text-muted-foreground">{alerte.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        );
      })}
    </div>
  );
}
