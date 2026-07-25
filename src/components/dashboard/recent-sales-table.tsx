import { Eye } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import { formatFCFA, recentSales, type Sale } from "@/lib/dashboard-data";
import { SectionCard } from "./section-card";

const statusStyles: Record<Sale["statut"], string> = {
  Payée: "bg-success/10 text-success",
  "En attente": "bg-chart-4/15 text-chart-4",
  Annulée: "bg-primary-soft text-primary",
};

export function RecentSalesTable() {
  return (
    <SectionCard
      title="Dernières ventes"
      description="Les 6 transactions les plus récentes"
      bodyClassName="px-0 py-0"
      action={
        <Link
          to="/ventes"
          className="text-xs font-semibold text-primary transition-opacity hover:opacity-70"
        >
          Tout voir
        </Link>
      }
    >
      <div className="scrollbar-slim overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              <th className="px-5 py-3 font-medium">Heure</th>
              <th className="px-5 py-3 font-medium">Produit</th>
              <th className="px-5 py-3 font-medium">Client</th>
              <th className="px-5 py-3 font-medium">Quantité</th>
              <th className="px-5 py-3 font-medium">Montant</th>
              <th className="px-5 py-3 font-medium">Employé</th>
              <th className="px-5 py-3 font-medium">Statut</th>
              <th className="px-5 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {recentSales.map((sale) => (
              <tr
                key={sale.id}
                className="border-b border-border/70 transition-colors last:border-0 hover:bg-muted/50"
              >
                <td className="px-5 py-3.5 text-muted-foreground">{sale.heure}</td>
                <td className="px-5 py-3.5 font-medium text-foreground">{sale.produit}</td>
                <td className="px-5 py-3.5 text-muted-foreground">{sale.client}</td>
                <td className="px-5 py-3.5 text-muted-foreground">{sale.quantite}</td>
                <td className="px-5 py-3.5 font-semibold text-foreground">
                  {formatFCFA(sale.montant)}
                </td>
                <td className="px-5 py-3.5 text-muted-foreground">{sale.employe}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={cn(
                      "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold",
                      statusStyles[sale.statut],
                    )}
                  >
                    {sale.statut}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link
                    to="/ventes"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-primary-soft hover:text-primary"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Voir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
