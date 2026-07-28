import { Link } from "@tanstack/react-router";
import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDateCourt } from "@/lib/products/types";
import { cn } from "@/lib/utils";
import {
  lignesEnEcart,
  lignesVerifiees,
  STATUT_INVENTAIRE_LABEL,
  type Inventaire,
  type StatutInventaire,
} from "@/lib/inventory/types";

const TONS: Record<StatutInventaire, string> = {
  en_cours: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  termine: "border-border bg-muted text-muted-foreground",
  ajuste: "border-success/30 bg-success/10 text-success",
};

export function InventoryStatusBadge({ statut }: { statut: StatutInventaire }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        TONS[statut],
      )}
    >
      {STATUT_INVENTAIRE_LABEL[statut]}
    </span>
  );
}

export function InventoryHistoryTable({ inventaires }: { inventaires: Inventaire[] }) {
  if (inventaires.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
        Aucun inventaire pour le moment.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto scrollbar-slim">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Inventaire</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Responsable</th>
              <th className="px-4 py-3 text-right font-semibold">Produits contrôlés</th>
              <th className="px-4 py-3 text-right font-semibold">Écarts</th>
              <th className="px-4 py-3 font-semibold">Statut</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventaires.map((inv) => (
              <tr
                key={inv.id}
                className="border-b border-border/70 last:border-0 hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  <Link
                    to="/inventaire/$inventaireId"
                    params={{ inventaireId: inv.id }}
                    className="font-semibold text-foreground transition-colors hover:text-primary"
                  >
                    {inv.nom}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {inv.numero} · {inv.magasin}
                  </p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDateCourt(inv.date)}</td>
                <td className="px-4 py-3 text-foreground">{inv.responsable}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {lignesVerifiees(inv).length}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-foreground">
                  {lignesEnEcart(inv).length}
                </td>
                <td className="px-4 py-3">
                  <InventoryStatusBadge statut={inv.statut} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/inventaire/$inventaireId" params={{ inventaireId: inv.id }}>
                      <Eye className="mr-2 h-4 w-4" />
                      Voir
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
