import { Activity } from "lucide-react";

import { TYPE_ACTIVITE_CLASSE, TYPE_ACTIVITE_LABEL, type ActiviteJournal } from "@/lib/hr/types";
import { formatDate } from "@/lib/products/types";
import { cn } from "@/lib/utils";

export function ActivityLog({
  activites,
  titre = "Journal d'activité",
}: {
  activites: ActiviteJournal[];
  titre?: string;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary">
          <Activity className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-foreground">{titre}</h2>
          <p className="text-xs text-muted-foreground">
            Traçabilité complète des actions réalisées dans l'application.
          </p>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {activites.length === 0 && (
          <li className="py-6 text-center text-sm text-muted-foreground">
            Aucune activité enregistrée.
          </li>
        )}
        {activites.map((activite) => (
          <li
            key={activite.id}
            className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-xl border border-border p-3"
          >
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                TYPE_ACTIVITE_CLASSE[activite.type],
              )}
            >
              {TYPE_ACTIVITE_LABEL[activite.type]}
            </span>
            <div className="min-w-0">
              <p className="text-sm text-foreground">{activite.description}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {activite.auteur} · {activite.module} · {formatDate(activite.date)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
