import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "@/components/layout/page";

const TITLE = "Ventes";
const DESCRIPTION = "Historique et suivi détaillé des ventes réalisées.";

export const Route = createFileRoute("/ventes")({
  head: () => ({
    meta: [
      { title: `${TITLE} — Bekaye Sora Business Manager` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `${TITLE} — Bekaye Sora Business Manager` },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Page,
});

function Page() {
  return <PagePlaceholder eyebrow="Commerce" title={TITLE} description={DESCRIPTION} />;
}
