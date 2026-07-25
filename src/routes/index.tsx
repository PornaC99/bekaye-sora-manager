import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "@/components/layout/page";
import { BRAND } from "@/lib/navigation";

const TITLE = "Tableau de bord";
const DESCRIPTION =
  "Vue d'ensemble de l'activité Bekaye Sora : stock, ventes, caisse et équipe réunis au même endroit.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Bekaye Sora Business Manager" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Tableau de bord — Bekaye Sora Business Manager" },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          Bienvenue
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-foreground sm:text-3xl">
          {BRAND.name} <span className="text-muted-foreground">·</span> {BRAND.app}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{BRAND.slogan}</p>
      </section>

      <PagePlaceholder eyebrow="Pilotage" title={TITLE} description={DESCRIPTION} />
    </div>
  );
}
