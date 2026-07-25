import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "@/components/layout/page";

const TITLE = "Salaires";
const DESCRIPTION = "Préparation, validation et suivi des rémunérations.";

export const Route = createFileRoute("/salaires")({
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
  return <PagePlaceholder eyebrow="Ressources humaines" title={TITLE} description={DESCRIPTION} />;
}
