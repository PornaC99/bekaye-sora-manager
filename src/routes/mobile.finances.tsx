import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Banknote, PiggyBank, Receipt, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import { MobileCard, MobileEmpty, MobilePage, MobileSection } from "@/components/mobile/shell";
import { KpiTile } from "@/components/mobile/pieces";
import { MiniTrendChart } from "@/components/mobile/trend-chart";
import { PLAGES_FINANCE, serieFinanciere, type PlageFinance } from "@/lib/finance/analytics";
import { useFinances } from "@/lib/finance/use-finance";
import { formatFCFA } from "@/lib/products/types";
import { formatDateHeure } from "@/lib/finance/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mobile/finances")({
  head: () => ({
    meta: [
      { title: "Finances — Bekaye Sora Mobile" },
      {
        name: "description",
        content: "Revenus, dépenses, bénéfices et trésorerie de Bekaye Sora en temps réel.",
      },
      { property: "og:title", content: "Finances — Bekaye Sora Mobile" },
      {
        property: "og:description",
        content: "La santé financière de votre entreprise, résumée pour le Directeur.",
      },
    ],
  }),
  component: FinancesMobile,
});

function FinancesMobile() {
  const finances = useFinances();
  const [plage, setPlage] = useState<PlageFinance>("30j");

  const serie = useMemo(
    () =>
      serieFinanciere({
        ventes: finances.ventes,
        produits: finances.produits,
        depenses: finances.toutesDepenses,
        plage,
      }),
    [finances, plage],
  );

  return (
    <MobilePage titre="Finances" sousTitre="Revenus · Dépenses · Bénéfices · Trésorerie">
      <div className="grid grid-cols-2 gap-3">
        <KpiTile
          label="Revenus du mois"
          valeur={formatFCFA(finances.kpis.caMois)}
          icon={ArrowUpRight}
          ton="primary"
        />
        <KpiTile
          label="Dépenses du mois"
          valeur={formatFCFA(finances.kpis.depensesMois)}
          icon={ArrowDownRight}
          ton="warning"
        />
        <KpiTile
          label="Bénéfice du mois"
          valeur={formatFCFA(finances.kpis.beneficeMois)}
          hint={`Marge nette ${finances.kpis.margeNette} %`}
          icon={Banknote}
          ton="success"
        />
        <KpiTile
          label="Trésorerie"
          valeur={formatFCFA(finances.tresorerie.solde)}
          icon={PiggyBank}
          ton="primary"
        />
        <KpiTile
          label="Argent en caisse"
          valeur={formatFCFA(finances.kpis.montantCaisse)}
          icon={Wallet}
          ton="muted"
        />
        <KpiTile
          label="Créances clients"
          valeur={formatFCFA(finances.kpis.creances)}
          hint={`Dettes ${formatFCFA(finances.kpis.dettes)}`}
          icon={Receipt}
          ton="warning"
        />
      </div>

      <MobileSection titre="Revenus & dépenses">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {PLAGES_FINANCE.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPlage(p.value)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                plage === p.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <MobileCard className="px-1 py-2">
          <MiniTrendChart data={serie} cle="ca" />
        </MobileCard>
        <MobileCard className="px-1 py-2">
          <MiniTrendChart data={serie} cle="depenses" couleur="var(--chart-2)" />
        </MobileCard>
      </MobileSection>

      <MobileSection titre="Derniers mouvements">
        {finances.flux.length === 0 ? (
          <MobileEmpty message="Aucun mouvement financier." />
        ) : (
          <div className="space-y-2">
            {finances.flux.slice(0, 10).map((f) => (
              <MobileCard key={f.id} className="p-3">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{f.libelle}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatDateHeure(f.date)} · {f.tiers}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "shrink-0 font-display text-sm font-semibold",
                      f.montant >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {f.montant >= 0 ? "+" : "−"}
                    {formatFCFA(Math.abs(f.montant))}
                  </p>
                </div>
              </MobileCard>
            ))}
          </div>
        )}
      </MobileSection>

      <MobileSection titre="Conseils de l'assistant">
        {finances.conseils.length === 0 ? (
          <MobileEmpty message="Aucune recommandation : tout est sous contrôle." />
        ) : (
          <div className="space-y-2">
            {finances.conseils.slice(0, 4).map((c) => (
              <MobileCard key={c.id} className="p-3">
                <p className="text-sm font-semibold text-foreground">{c.titre}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{c.message}</p>
              </MobileCard>
            ))}
          </div>
        )}
      </MobileSection>
    </MobilePage>
  );
}
