import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BellRing, CheckCheck, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MODULE_LABEL,
  TON_CLASSE,
  marquerLu,
  supprimerEvenement,
  toutMarquerLu,
  useCentreNotifications,
  type ModuleSysteme,
} from "@/lib/core/notifications";

const TITLE = "Notifications";
const DESCRIPTION =
  "Centre de liaisons : chaque vente, entrée de stock, réception, mouvement RH ou écriture financière remonte ici automatiquement.";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: `${TITLE} — Bekaye Sora Business Manager` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `${TITLE} — Bekaye Sora Business Manager` },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Page,
});

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

function Page() {
  const { evenements } = useCentreNotifications();
  const [filtre, setFiltre] = useState<ModuleSysteme | "tous">("tous");

  const modules = useMemo(
    () => Array.from(new Set(evenements.map((e) => e.module))),
    [evenements],
  );
  const liste = evenements.filter((e) => filtre === "tous" || e.module === filtre);
  const nonLus = evenements.filter((e) => !e.lu).length;

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-5">
      <PageHeader
        eyebrow="Système"
        title={TITLE}
        description={DESCRIPTION}
        actions={
          <Button variant="outline" onClick={toutMarquerLu} disabled={nonLus === 0}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Tout marquer comme lu
          </Button>
        }
      />

      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1 shadow-[var(--shadow-card)]">
        {(["tous", ...modules] as const).map((cle) => (
          <button
            key={cle}
            type="button"
            onClick={() => setFiltre(cle as ModuleSysteme | "tous")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              filtre === cle
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {cle === "tous" ? "Tout" : MODULE_LABEL[cle as ModuleSysteme]}
          </button>
        ))}
      </div>

      {liste.length === 0 ? (
        <section className="rounded-2xl border border-border bg-card p-12 text-center shadow-[var(--shadow-card)]">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary-soft">
            <BellRing className="h-5 w-5 text-primary" />
          </span>
          <h2 className="mt-4 text-base font-semibold text-foreground">Aucune notification</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Les évènements des modules apparaîtront ici dès la première opération (vente,
            réception, inventaire, salaire, dépense…).
          </p>
        </section>
      ) : (
        <ul className="flex flex-col gap-2">
          {liste.map((evenement) => (
            <li
              key={evenement.id}
              className={cn(
                "flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between",
                !evenement.lu && "border-l-4 border-l-primary",
              )}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      TON_CLASSE[evenement.ton],
                    )}
                  >
                    {MODULE_LABEL[evenement.module]}
                  </span>
                  <p className="truncate text-sm font-semibold text-foreground">
                    {evenement.titre}
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{evenement.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(evenement.date)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button asChild variant="outline" size="sm" onClick={() => marquerLu(evenement.id)}>
                  <Link to={evenement.lien}>Ouvrir</Link>
                </Button>
                {!evenement.lu && (
                  <Button variant="ghost" size="sm" onClick={() => marquerLu(evenement.id)}>
                    Lu
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Supprimer"
                  onClick={() => supprimerEvenement(evenement.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
