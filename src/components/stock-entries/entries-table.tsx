import { Link } from "@tanstack/react-router";
import { Eye, MoreHorizontal, Pencil, Printer, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateCourt, formatFCFA, formatHeure } from "@/lib/products/types";
import { montantEntree, STATUT_ENTREE_LABEL } from "@/lib/stock/types";
import type { EntreeStock, StatutEntree } from "@/lib/stock/types";
import { cn } from "@/lib/utils";

export type EntryActions = {
  onEdit: (entree: EntreeStock) => void;
  onPrint: (entree: EntreeStock) => void;
  onDelete: (entree: EntreeStock) => void;
};

const TONS: Record<StatutEntree, string> = {
  validee: "border-success/30 bg-success/10 text-success",
  brouillon: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  annulee: "border-primary/30 bg-primary-soft text-primary",
};

export function EntryStatusBadge({ statut }: { statut: StatutEntree }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        TONS[statut],
      )}
    >
      {STATUT_ENTREE_LABEL[statut]}
    </span>
  );
}

export function EntriesTable({
  entrees,
  actions,
}: {
  entrees: EntreeStock[];
  actions: EntryActions;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto scrollbar-slim">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-4 py-3 font-semibold">N° de réception</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Heure</th>
              <th className="px-4 py-3 font-semibold">Fournisseur</th>
              <th className="px-4 py-3 text-right font-semibold">Produits</th>
              <th className="px-4 py-3 text-right font-semibold">Montant total</th>
              <th className="px-4 py-3 font-semibold">Utilisateur</th>
              <th className="px-4 py-3 font-semibold">Statut</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entrees.map((entree) => (
              <tr
                key={entree.id}
                className="border-b border-border/70 transition-colors last:border-0 hover:bg-muted/40"
              >
                <td className="whitespace-nowrap px-4 py-3">
                  <Link
                    to="/entrees-stock/$entreeId"
                    params={{ entreeId: entree.id }}
                    className="font-semibold text-foreground transition-colors hover:text-primary"
                  >
                    {entree.numero}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {formatDateCourt(entree.date)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {formatHeure(entree.date)}
                </td>
                <td className="px-4 py-3 text-foreground">{entree.fournisseur}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {entree.lignes.length}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-foreground">
                  {formatFCFA(montantEntree(entree))}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {entree.utilisateur}
                </td>
                <td className="px-4 py-3">
                  <EntryStatusBadge statut={entree.statut} />
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={`Actions de la réception ${entree.numero}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem asChild>
                        <Link to="/entrees-stock/$entreeId" params={{ entreeId: entree.id }}>
                          <Eye className="h-4 w-4" />
                          Voir
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => actions.onEdit(entree)}>
                        <Pencil className="h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => actions.onPrint(entree)}>
                        <Printer className="h-4 w-4" />
                        Imprimer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => actions.onDelete(entree)}
                        className="text-primary focus:text-primary"
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
