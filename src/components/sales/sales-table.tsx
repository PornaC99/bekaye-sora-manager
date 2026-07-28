import { Ban, Download, Eye, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateCourt, formatFCFA, formatHeure } from "@/lib/products/types";
import {
  libellePaiements,
  STATUT_VENTE_LABEL,
  totalVente,
  type StatutVente,
  type Vente,
} from "@/lib/sales/types";
import { cn } from "@/lib/utils";

const TONS: Record<StatutVente, string> = {
  payee: "border-success/30 bg-success/10 text-success",
  retour: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  annulee: "border-primary/30 bg-primary-soft text-primary",
};

export function SaleStatusBadge({ statut }: { statut: StatutVente }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        TONS[statut],
      )}
    >
      {STATUT_VENTE_LABEL[statut]}
    </span>
  );
}

export function SalesTable({
  ventes,
  onVoir,
  onImprimer,
  onTelecharger,
  onAnnuler,
}: {
  ventes: Vente[];
  onVoir: (vente: Vente) => void;
  onImprimer: (vente: Vente) => void;
  onTelecharger: (vente: Vente) => void;
  onAnnuler: (vente: Vente) => void;
}) {
  if (ventes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
        Aucune vente ne correspond à votre recherche.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto scrollbar-slim">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Numéro</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Heure</th>
              <th className="px-4 py-3 font-semibold">Client</th>
              <th className="px-4 py-3 font-semibold">Vendeur</th>
              <th className="px-4 py-3 text-right font-semibold">Montant</th>
              <th className="px-4 py-3 font-semibold">Paiement</th>
              <th className="px-4 py-3 font-semibold">Statut</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ventes.map((vente) => (
              <tr key={vente.id} className="border-b border-border/70 last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-medium text-foreground">{vente.numero}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDateCourt(vente.date)}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatHeure(vente.date)}</td>
                <td className="px-4 py-3 text-foreground">{vente.client || "Client comptoir"}</td>
                <td className="px-4 py-3 text-muted-foreground">{vente.vendeur}</td>
                <td className="px-4 py-3 text-right font-semibold text-foreground">
                  {formatFCFA(totalVente(vente))}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {libellePaiements(vente.paiements)}
                </td>
                <td className="px-4 py-3">
                  <SaleStatusBadge statut={vente.statut} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onVoir(vente)}>
                          <Eye className="mr-2 h-4 w-4" /> Voir la facture
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onImprimer(vente)}>
                          <Printer className="mr-2 h-4 w-4" /> Imprimer
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onTelecharger(vente)}>
                          <Download className="mr-2 h-4 w-4" /> Télécharger
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-primary"
                          disabled={vente.statut === "annulee"}
                          onClick={() => onAnnuler(vente)}
                        >
                          <Ban className="mr-2 h-4 w-4" /> Annuler la vente
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
