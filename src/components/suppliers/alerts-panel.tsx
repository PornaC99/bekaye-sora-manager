import { AlertTriangle, Info, ShieldAlert } from "lucide-react";

import type { AlerteFournisseur } from "@/lib/suppliers/analytics";
import { cn } from "@/lib/utils";

const STYLES = {
  critique: {
    classe: "border-destructive/30 bg-destructive/5",
    icone: ShieldAlert,
    texte: "text-destructive",
  },
  attention: {
    classe: "border-amber-500/30 bg-amber-500/5",
    icone: AlertTriangle,
    texte: "text-amber-600",
  },
  info: { classe: "border-border bg-muted/30", icone: Info, texte: "text-muted-foreground" },
} as const;

export function SupplierAlertsPanel({
  alertes,
  limite = 8,
}: {
  alertes: AlerteFournisseur[];
  limite?: number;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <h2 className="font-display text-base font-semibold text-foreground">
        Alertes intelligentes
      </h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Ruptures, retards de livraison et fournisseurs inactifs détectés automatiquement.
      </p>

      <div className="mt-3 space-y-2">
        {alertes.slice(0, limite).map((alerte) => {
          const style = STYLES[alerte.niveau];
          const Icone = style.icone;
          return (
            <div
              key={alerte.id}
              className={cn("flex gap-3 rounded-xl border px-3 py-2.5", style.classe)}
            >
              <Icone className={cn("mt-0.5 h-4 w-4 shrink-0", style.texte)} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{alerte.titre}</p>
                <p className="text-xs text-muted-foreground">{alerte.message}</p>
              </div>
            </div>
          );
        })}
        {!alertes.length && (
          <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
            Aucune alerte : votre approvisionnement est sous contrôle.
          </p>
        )}
      </div>
    </section>
  );
}
