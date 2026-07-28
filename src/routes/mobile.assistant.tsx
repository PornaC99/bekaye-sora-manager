import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useState } from "react";

import { MobileCard, MobilePage, MobileSection } from "@/components/mobile/shell";
import { useAssistantDirecteur } from "@/lib/mobile/assistant";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mobile/assistant")({
  head: () => ({
    meta: [
      { title: "Tableau de bord intelligent — Bekaye Sora Mobile" },
      {
        name: "description",
        content:
          "Posez vos questions : meilleur produit, meilleur vendeur, gains du jour, produits à recommander.",
      },
      { property: "og:title", content: "Tableau de bord intelligent — Bekaye Sora Mobile" },
      {
        property: "og:description",
        content: "Des réponses immédiates aux questions du Directeur, sous forme de cartes.",
      },
    ],
  }),
  component: AssistantMobile,
});

const TONS = {
  primary: "border-primary/25 bg-primary-soft/40",
  success: "border-success/25 bg-success/5",
  warning: "border-amber-500/25 bg-amber-500/5",
  danger: "border-destructive/25 bg-destructive/5",
} as const;

function AssistantMobile() {
  const reponses = useAssistantDirecteur();
  const [active, setActive] = useState(reponses[0]?.id ?? "");

  const courante = reponses.find((r) => r.id === active) ?? reponses[0];

  return (
    <MobilePage titre="Assistant" sousTitre="Posez votre question, obtenez la réponse">
      <div className="space-y-2">
        {reponses.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setActive(r.id)}
            className={cn(
              "flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all active:scale-[0.98]",
              active === r.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground",
            )}
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{r.question}</span>
          </button>
        ))}
      </div>

      {courante && (
        <MobileSection titre="Réponse">
          <MobileCard
            className={cn(
              "animate-in fade-in slide-in-from-bottom-2 border duration-300",
              TONS[courante.ton],
            )}
          >
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {courante.question}
            </p>
            <p className="mt-1.5 font-display text-lg font-semibold text-foreground">
              {courante.titre}
            </p>
            <p className="font-display text-2xl font-semibold text-primary">{courante.valeur}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{courante.detail}</p>
            {courante.lignes.length > 0 && (
              <ul className="mt-3 space-y-1.5 border-t border-border/60 pt-3">
                {courante.lignes.map((l) => (
                  <li
                    key={l.label}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-xs"
                  >
                    <span className="truncate text-muted-foreground">{l.label}</span>
                    <span className="shrink-0 font-semibold text-foreground">{l.valeur}</span>
                  </li>
                ))}
              </ul>
            )}
          </MobileCard>
        </MobileSection>
      )}
    </MobilePage>
  );
}
