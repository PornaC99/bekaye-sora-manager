import { ArrowDownRight } from "lucide-react";

import { LABEL_MOTIF, type SortieStock } from "@/lib/db/sorties";
import { formatDateCourt, formatFCFA, formatHeure } from "@/lib/products/types";

const TON_MOTIF: Record<string, string> = {
  vente: "border-success/30 bg-success/10 text-success",
  transfert: "border-primary/30 bg-primary-soft text-primary",
  perte: "border-destructive/30 bg-destructive/10 text-destructive",
  casse: "border-destructive/30 bg-destructive/10 text-destructive",
  peremption: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  echantillon: "border-border bg-muted text-muted-foreground",
  retour_fournisseur: "border-border bg-muted text-muted-foreground",
  ajustement: "border-border bg-muted text-muted-foreground",
};

function MotifBadge({ motif }: { motif: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        TON_MOTIF[motif] ?? "border-border bg-muted text-muted-foreground"
      }`}
    >
      {LABEL_MOTIF[motif] ?? motif}
    </span>
  );
}

export function ExitsTable({ sorties }: { sorties: SortieStock[] }) {
  if (sorties.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft">
          <ArrowDownRight className="h-5 w-5 text-primary" />
        </span>
        <p className="font-medium text-foreground">Aucune sortie enregistrée</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Les sorties de stock (ventes, pertes, transferts, échantillons) apparaîtront ici avec leur
          traçabilité complète.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto scrollbar-slim">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-4 py-3 font-semibold">N° de sortie</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Produit</th>
              <th className="px-4 py-3 text-right font-semibold">Quantité</th>
              <th className="px-4 py-3 font-semibold">Motif</th>
              <th className="px-4 py-3 font-semibold">Lot / Référence</th>
              <th className="px-4 py-3 text-right font-semibold">Valeur</th>
              <th className="px-4 py-3 text-right font-semibold">Stock après</th>
            </tr>
          </thead>
          <tbody>
            {sorties.map((s) => (
              <tr key={s.id} className="border-b border-border/70 last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-medium text-foreground" data-label="N° de sortie">
                  {s.numero}
                </td>
                <td className="px-4 py-3 text-muted-foreground" data-label="Date">
                  {formatDateCourt(s.date)} · {formatHeure(s.date)}
                </td>
                <td className="px-4 py-3 text-foreground" data-label="Produit">
                  {s.produit}
                  <span className="block text-xs text-muted-foreground">{s.magasin}</span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-foreground" data-label="Quantité">
                  −{s.quantite} {s.unite}
                </td>
                <td className="px-4 py-3" data-label="Motif">
                  <MotifBadge motif={s.motif} />
                </td>
                <td className="px-4 py-3 text-muted-foreground" data-label="Lot / Référence">
                  {s.lot || "—"}
                  {s.reference ? <span className="block text-xs">{s.reference}</span> : null}
                </td>
                <td className="px-4 py-3 text-right text-foreground" data-label="Valeur">
                  {formatFCFA(s.valeurTotale)}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground" data-label="Stock après">
                  {s.stockApres ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
