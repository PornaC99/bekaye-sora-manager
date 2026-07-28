import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/page";
import { AlertsPanel } from "@/components/inventory/alerts-panel";
import { SuggestionsPanel } from "@/components/inventory/suggestions-panel";
import { TopList, ValueCards } from "@/components/inventory/analytics-panel";
import { useProductsStore } from "@/lib/products/store";
import { useInventairesStore } from "@/lib/inventory/store";
import {
  classementsInventaire,
  construireAlertes,
  construireSuggestions,
} from "@/lib/inventory/insights";
import { valeurPertes, valeurSurplus } from "@/lib/inventory/types";

const TITLE = "Analyse & alertes intelligentes";
const DESCRIPTION =
  "Le système surveille votre stock en continu et vous propose les bonnes décisions.";

export const Route = createFileRoute("/_authenticated/inventaire/analyse")({
  head: () => ({
    meta: [
      { title: `${TITLE} — Bekaye Sora Business Manager` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `${TITLE} — Bekaye Sora Business Manager` },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: AnalyseInventairePage,
});

function AnalyseInventairePage() {
  const { produits, mouvements, ventes } = useProductsStore();
  const { inventaires } = useInventairesStore();

  const alertes = useMemo(
    () => construireAlertes(produits, mouvements, ventes, inventaires),
    [produits, mouvements, ventes, inventaires],
  );

  const suggestions = useMemo(
    () => construireSuggestions(produits, ventes, inventaires),
    [produits, ventes, inventaires],
  );

  const classements = useMemo(
    () => classementsInventaire(inventaires, produits),
    [inventaires, produits],
  );

  const valeurStock = produits.reduce((t, p) => t + p.stock * p.prixAchat, 0);
  const pertes = inventaires.reduce((t, i) => t + valeurPertes(i), 0);
  const surplus = inventaires.reduce((t, i) => t + valeurSurplus(i), 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Inventaire" title={TITLE} description={DESCRIPTION} />

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-base font-semibold text-foreground">
          Suggestions intelligentes
        </h2>
        <SuggestionsPanel suggestions={suggestions} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-base font-semibold text-foreground">
          Alertes intelligentes
        </h2>
        <AlertsPanel alertes={alertes} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-base font-semibold text-foreground">
          Tableau de bord d'analyse
        </h2>
        <ValueCards valeurStock={valeurStock} pertes={pertes} surplus={surplus} />
        <div className="grid gap-4 lg:grid-cols-2">
          <TopList
            title="Top 10 des produits les plus contrôlés"
            description="Nombre de comptages réalisés par produit"
            items={classements.controles}
            suffixe="contrôles"
          />
          <TopList
            title="Top 10 des produits avec le plus d'écarts"
            description="Unités d'écart cumulées sur tous les inventaires"
            items={classements.enEcart}
            suffixe="unités"
          />
        </div>
      </section>
    </div>
  );
}
