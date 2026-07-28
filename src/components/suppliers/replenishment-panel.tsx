import { CalendarClock, PackageSearch, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDateCourt, formatFCFA } from "@/lib/products/types";
import type { SuggestionAppro } from "@/lib/suppliers/analytics";
import { cn } from "@/lib/utils";

const PRIORITE = {
  haute: {
    label: "Priorité haute",
    classe: "bg-destructive/10 text-destructive",
    bordure: "border-destructive/30",
  },
  moyenne: {
    label: "Priorité moyenne",
    classe: "bg-amber-500/10 text-amber-600",
    bordure: "border-amber-500/30",
  },
  basse: {
    label: "Priorité basse",
    classe: "bg-success/10 text-success",
    bordure: "border-success/30",
  },
} as const;

export function ReplenishmentCards({
  suggestions,
  onCommander,
}: {
  suggestions: SuggestionAppro[];
  onCommander?: (suggestion: SuggestionAppro) => void;
}) {
  if (!suggestions.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Aucun réassort nécessaire : les stocks couvrent les ventes prévues.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {suggestions.map((s) => {
        const p = PRIORITE[s.priorite];
        return (
          <article
            key={s.produit.id}
            className={cn(
              "flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]",
              p.bordure,
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate font-medium text-foreground">{s.produit.nom}</h3>
                <p className="text-xs text-muted-foreground">
                  Stock actuel : {s.produit.stock} · seuil {s.produit.stockMinimum}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                  p.classe,
                )}
              >
                {p.label}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/40 px-3 py-2 text-center">
              {[
                { label: "30 j", valeur: s.ventes30 },
                { label: "60 j", valeur: s.ventes60 },
                { label: "90 j", valeur: s.ventes90 },
              ].map((v) => (
                <div key={v.label}>
                  <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                    Ventes {v.label}
                  </p>
                  <p className="font-display text-sm font-semibold text-foreground">{v.valeur}</p>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 text-sm">
              <p className="flex items-center gap-2 text-foreground">
                <PackageSearch className="h-4 w-4 text-primary" />
                Quantité recommandée :{" "}
                <strong className="tabular-nums">{s.quantiteRecommandee}</strong>
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Truck className="h-4 w-4" />
                {s.fournisseur?.nom ?? s.produit.fournisseur} · délai {s.delai} j
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="h-4 w-4" />
                Commander idéalement le {formatDateCourt(s.dateIdeale)}
                {s.joursAvantRupture !== null && ` · rupture dans ${s.joursAvantRupture} j`}
              </p>
            </div>

            <p className="rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {s.motif}
            </p>

            <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
              <p className="text-sm font-semibold text-foreground">{formatFCFA(s.montantEstime)}</p>
              {onCommander && (
                <Button size="sm" onClick={() => onCommander(s)} disabled={!s.fournisseur}>
                  Créer la commande
                </Button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
