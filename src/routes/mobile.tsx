import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/mobile")({
  head: () => ({
    meta: [
      { title: "Espace Directeur mobile — Bekaye Sora" },
      {
        name: "description",
        content:
          "Application mobile du Directeur : ventes, bénéfices, stock, équipe et alertes en temps réel.",
      },
      { property: "og:title", content: "Espace Directeur mobile — Bekaye Sora" },
      {
        property: "og:description",
        content: "Pilotez Bekaye Sora depuis votre téléphone en moins de 30 secondes.",
      },
    ],
  }),
  component: () => <Outlet />,
});
