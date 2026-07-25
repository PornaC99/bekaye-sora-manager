import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "@/components/layout/page";

const TITLE = "Fournisseurs";
const DESCRIPTION = "Centralisez les partenaires d'approvisionnement et leurs coordonnées.";

export const Route = createFileRoute("/fournisseurs")({
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
  return <PagePlaceholder eyebrow="Catalogue" title={TITLE} description={DESCRIPTION} />;
}
