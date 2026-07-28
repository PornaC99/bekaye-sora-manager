import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, Printer } from "lucide-react";
import { toast } from "sonner";

import { NexusHeader, Pastille, SectionCard } from "@/components/nexusia/pieces";
import { useNexusia } from "@/lib/nexusia/insight";
import { contenuRapport, imprimerRapportNexus } from "@/lib/nexusia/print";
import { TYPES_RAPPORT, type TypeRapport } from "@/lib/nexusia/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/nexusia/rapports")({
  head: () => ({
    meta: [
      { title: "Rapports directionnels — NEXUSIA Insight | Bekaye Sora" },
      {
        name: "description",
        content:
          "Générez automatiquement des rapports quotidiens, hebdomadaires, mensuels et annuels prêts à imprimer.",
      },
      { property: "og:title", content: "Rapports directionnels — NEXUSIA Insight" },
      {
        property: "og:description",
        content: "Des rapports de direction générés automatiquement à partir de vos données.",
      },
    ],
  }),
  component: RapportsPage,
});

function RapportsPage() {
  const donnees = useNexusia();
  const [type, setType] = useState<TypeRapport>("quotidien");
  const rapport = contenuRapport(type, donnees);

  return (
    <div className="flex flex-col gap-5">
      <NexusHeader
        eyebrow="Génération automatique"
        titre="Rapports directionnels"
        sous="Un rapport clair et professionnel en un clic, prêt à imprimer ou à partager."
        action={
          <button
            type="button"
            onClick={() => {
              imprimerRapportNexus(type, donnees);
              toast.success("Rapport généré", {
                description: "La fenêtre d'impression a été ouverte.",
              });
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <Printer className="h-4 w-4" /> Générer le rapport
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {TYPES_RAPPORT.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={cn(
              "flex flex-col gap-1 rounded-xl border p-4 text-left transition hover:-translate-y-0.5",
              t.value === type
                ? "border-primary/40 bg-primary-soft"
                : "border-border bg-card hover:shadow-[var(--shadow-card)]",
            )}
          >
            <span className="flex items-center gap-2">
              <FileText
                className={cn("h-4 w-4", t.value === type ? "text-primary" : "text-muted-foreground")}
              />
              <span className="font-display text-sm font-semibold text-foreground">{t.label}</span>
            </span>
            <span className="text-xs text-muted-foreground">{t.description}</span>
          </button>
        ))}
      </div>

      <SectionCard
        title={rapport.titre}
        description={rapport.sousTitre}
        action={<Pastille ton="info">Aperçu</Pastille>}
        bodyClassName="flex flex-col gap-6"
      >
        {rapport.sections.map((section) => (
          <section key={section.titre} className="flex flex-col gap-3">
            <h3 className="font-display text-sm font-semibold text-foreground">{section.titre}</h3>
            {section.lignes.length > 0 && (
              <dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {section.lignes.map((l) => (
                  <div key={l.label} className="rounded-xl border border-border bg-background/60 p-3">
                    <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {l.label}
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold text-foreground">{l.valeur}</dd>
                  </div>
                ))}
              </dl>
            )}
            {section.paragraphes && section.paragraphes.length > 0 && (
              <ul className="flex flex-col gap-2">
                {section.paragraphes.map((p, i) => (
                  <li
                    key={`${section.titre}-${i}`}
                    className="rounded-xl bg-muted/50 px-3.5 py-2.5 text-sm leading-relaxed text-foreground"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </SectionCard>
    </div>
  );
}
