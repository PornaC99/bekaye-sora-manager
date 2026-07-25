import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "@/components/layout/page";

const TITLE = "Inventaire";
const DESCRIPTION = "Contrôlez les quantités réelles disponibles en boutique et en réserve.";

export const Route = createFileRoute("/inventaire")({
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
  return <PagePlaceholder eyebrow="Stock" title={TITLE} description={DESCRIPTION} />;
}
