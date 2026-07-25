import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "@/components/layout/page";

const TITLE = "Produits";
const DESCRIPTION = "Gérez le catalogue des produits cosmétiques 501 : références, prix et disponibilité.";

export const Route = createFileRoute("/produits")({
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
