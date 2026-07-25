import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "@/components/layout/page";

const TITLE = "Caisse";
const DESCRIPTION = "Encaissements, ouvertures et clôtures de caisse au quotidien.";

export const Route = createFileRoute("/caisse")({
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
