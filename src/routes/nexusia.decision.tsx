import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Lightbulb, Sparkles, Star } from "lucide-react";

import { ListeInsights, NexusHeader, SectionCard } from "@/components/nexusia/pieces";
import { useNexusia } from "@/lib/nexusia/insight";

export const Route = createFileRoute("/nexusia/decision")({
  head: () => ({
    meta: [
      { title: "Centre de Décision — NEXUSIA Insight | Bekaye Sora" },
      {
        name: "description",
        content:
          "Les 5 informations, urgences, recommandations et opportunités du jour pour décider vite et bien.",
      },
      { property: "og:title", content: "Centre de Décision — NEXUSIA Insight" },
      {
        property: "og:description",
        content: "Le brief quotidien du Directeur de Bekaye Sora Business Manager.",
      },
    ],
  }),
  component: DecisionPage,
});

function DecisionPage() {
  const donnees = useNexusia();
  const { decision } = donnees;

  return (
    <div className="flex flex-col gap-5">
      <NexusHeader
        eyebrow="Brief du jour"
        titre="Centre de Décision"
        sous="L'essentiel de votre entreprise, chaque jour, en une seule page."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard
          title="Les 5 informations les plus importantes"
          description="Ce qu'il faut retenir maintenant."
          action={<Sparkles className="h-4 w-4 text-primary" />}
        >
          <ol className="flex flex-col gap-2.5">
            {decision.informations.map((info, i) => (
              <li
                key={info}
                className="flex gap-3 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm text-foreground"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{info}</span>
              </li>
            ))}
          </ol>
        </SectionCard>

        <SectionCard
          title="Les 5 urgences"
          description="À traiter en priorité aujourd'hui."
          action={<AlertTriangle className="h-4 w-4 text-primary" />}
        >
          <ListeInsights
            items={decision.urgences.map((a) => ({
              id: a.id,
              titre: a.titre,
              message: a.message,
              ton: a.gravite === "haute" ? "danger" : "alerte",
              badge: a.gravite === "haute" ? "Urgent" : "À surveiller",
            }))}
          />
        </SectionCard>

        <SectionCard
          title="Les 5 recommandations"
          description="Les décisions conseillées par NEXUSIA."
          action={<Lightbulb className="h-4 w-4 text-primary" />}
        >
          <ListeInsights
            items={decision.recommandations.map((r) => ({
              id: r.id,
              titre: r.titre,
              message: r.message,
              ton: r.ton,
              badge: `Impact ${r.impact}`,
            }))}
          />
        </SectionCard>

        <SectionCard
          title="Les 5 opportunités"
          description="Les leviers de croissance identifiés."
          action={<Star className="h-4 w-4 text-primary" />}
        >
          <ul className="flex flex-col gap-2.5">
            {decision.opportunites.map((o) => (
              <li
                key={o}
                className="rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm leading-relaxed text-foreground"
              >
                {o}
              </li>
            ))}
            {decision.opportunites.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune opportunité détectée.</p>
            )}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
