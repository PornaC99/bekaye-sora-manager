import { useState } from "react";
import { MoreHorizontal, Paperclip, Pencil, Trash2, Check, Ban } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatFCFA } from "@/lib/products/types";
import { changerStatutDepense, supprimerDepense } from "@/lib/finance/store";
import {
  CATEGORIE_DEPENSE_LABEL,
  MODE_PAIEMENT_DEPENSE_LABEL,
  SOURCE_DEPENSE_LABEL,
  STATUT_DEPENSE_CLASSE,
  STATUT_DEPENSE_LABEL,
  formatDateCourte,
  type Depense,
} from "@/lib/finance/types";
import { cn } from "@/lib/utils";

export function ExpensesTable({
  depenses,
  onEdit,
}: {
  depenses: Depense[];
  onEdit: (depense: Depense) => void;
}) {
  const [suppression, setSuppression] = useState<string | null>(null);

  if (depenses.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Aucune dépense ne correspond à votre recherche.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            <th className="px-3 py-2 font-medium">Date</th>
            <th className="px-3 py-2 font-medium">Catégorie</th>
            <th className="px-3 py-2 text-right font-medium">Montant</th>
            <th className="px-3 py-2 font-medium">Mode de paiement</th>
            <th className="px-3 py-2 font-medium">Responsable</th>
            <th className="px-3 py-2 font-medium">Statut</th>
            <th className="px-3 py-2 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {depenses.map((depense) => (
            <tr
              key={depense.id}
              className="border-b border-border/70 transition-colors last:border-0 hover:bg-muted/40"
            >
              <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                {formatDateCourte(depense.date)}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex min-w-0 flex-col">
                  <span className="font-medium text-foreground">
                    {CATEGORIE_DEPENSE_LABEL[depense.categorie]}
                  </span>
                  <span className="max-w-[280px] truncate text-xs text-muted-foreground">
                    {depense.description}
                  </span>
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold text-foreground">
                {formatFCFA(depense.montant)}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                {MODE_PAIEMENT_DEPENSE_LABEL[depense.modePaiement]}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-foreground">{depense.responsable}</span>
                  {depense.source !== "manuelle" && (
                    <span className="text-xs text-muted-foreground">
                      Auto · {SOURCE_DEPENSE_LABEL[depense.source]}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-3 py-2.5">
                <span className="flex items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className={cn("border-0", STATUT_DEPENSE_CLASSE[depense.statut])}
                  >
                    {STATUT_DEPENSE_LABEL[depense.statut]}
                  </Badge>
                  {depense.justificatif && (
                    <Paperclip
                      className="h-3.5 w-3.5 text-muted-foreground"
                      aria-label="Justificatif joint"
                    />
                  )}
                </span>
              </td>
              <td className="px-3 py-2.5 text-right">
                {depense.source === "manuelle" ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => onEdit(depense)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      {depense.statut !== "payee" && (
                        <DropdownMenuItem
                          onSelect={() => {
                            changerStatutDepense(depense.id, "payee");
                            toast.success("Dépense marquée comme payée.");
                          }}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Marquer payée
                        </DropdownMenuItem>
                      )}
                      {depense.statut !== "annulee" && (
                        <DropdownMenuItem
                          onSelect={() => {
                            changerStatutDepense(depense.id, "annulee");
                            toast.success("Dépense annulée.");
                          }}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Annuler
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={() => {
                          if (suppression === depense.id) return;
                          setSuppression(depense.id);
                          supprimerDepense(depense.id);
                          toast.success("Dépense supprimée.");
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <span className="text-xs text-muted-foreground">Synchronisée</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
