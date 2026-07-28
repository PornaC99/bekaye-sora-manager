import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import { formatFCFA } from "@/lib/products/types";
import {
  TYPE_FLUX_CLASSE,
  TYPE_FLUX_LABEL,
  formatDateHeure,
  type FluxFinancier,
} from "@/lib/finance/types";
import { cn } from "@/lib/utils";

export function TreasuryPanel({
  entrees,
  sorties,
  solde,
  mouvements,
}: {
  entrees: number;
  sorties: number;
  solde: number;
  mouvements: FluxFinancier[];
}) {
  const cartes = [
    { label: "Entrées", value: entrees, icon: ArrowDownLeft, tone: "bg-success/10 text-success" },
    {
      label: "Sorties",
      value: sorties,
      icon: ArrowUpRight,
      tone: "bg-destructive/10 text-destructive",
    },
    { label: "Solde", value: solde, icon: Wallet, tone: "bg-primary-soft text-primary" },
  ];

  return (
    <SectionCard title="Trésorerie" description="Argent entré et sorti depuis le début de l'activité">
      <div className="grid gap-3 sm:grid-cols-3">
        {cartes.map((carte) => (
          <div key={carte.label} className="rounded-xl border border-border px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {carte.label}
              </p>
              <span className={cn("grid h-8 w-8 place-items-center rounded-lg", carte.tone)}>
                <carte.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-1 font-display text-lg font-semibold text-foreground">
              {formatFCFA(carte.value)}
            </p>
          </div>
        ))}
      </div>

      <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        Derniers mouvements
      </h3>
      <ul className="mt-3 flex flex-col gap-2">
        {mouvements.slice(0, 8).map((mouvement) => (
          <li
            key={mouvement.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{mouvement.libelle}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {formatDateHeure(mouvement.date)} · {mouvement.tiers}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 text-sm font-semibold",
                mouvement.montant >= 0 ? "text-success" : "text-destructive",
              )}
            >
              {mouvement.montant >= 0 ? "+" : "−"}
              {formatFCFA(Math.abs(mouvement.montant))}
            </span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

export function FluxTimeline({ flux }: { flux: FluxFinancier[] }) {
  return (
    <SectionCard
      title="Flux financiers"
      description="Chronologie des ventes, achats, dépenses, salaires et retours"
    >
      {flux.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Aucune opération enregistrée.
        </p>
      ) : (
        <ol className="relative flex flex-col gap-4 border-l border-border pl-5">
          {flux.map((operation) => (
            <li key={operation.id} className="relative">
              <span
                className={cn(
                  "absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-card",
                  operation.montant >= 0 ? "bg-success" : "bg-destructive",
                )}
              />
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        TYPE_FLUX_CLASSE[operation.type],
                      )}
                    >
                      {TYPE_FLUX_LABEL[operation.type]}
                    </span>
                    <p className="min-w-0 truncate text-sm font-medium text-foreground">
                      {operation.libelle}
                    </p>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {formatDateHeure(operation.date)} · {operation.tiers}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-sm font-semibold",
                    operation.montant >= 0 ? "text-success" : "text-destructive",
                  )}
                >
                  {operation.montant >= 0 ? "+" : "−"}
                  {formatFCFA(Math.abs(operation.montant))}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  );
}
