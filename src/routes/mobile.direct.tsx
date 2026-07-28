import { createFileRoute } from "@tanstack/react-router";
import { Radio } from "lucide-react";

import { MobileCard, MobileEmpty, MobilePage } from "@/components/mobile/shell";
import { ICONES_NOTIF } from "@/components/mobile/pieces";
import { depuis, formatJourHeure, useFluxDirect, useHorloge } from "@/lib/mobile/feed";
import { useMobileSession } from "@/lib/mobile/session";

export const Route = createFileRoute("/mobile/direct")({
  head: () => ({
    meta: [
      { title: "Surveillance en direct — Bekaye Sora Mobile" },
      {
        name: "description",
        content:
          "Ventes, mouvements de stock, caisse, dépenses et commandes qui arrivent en direct.",
      },
      { property: "og:title", content: "Surveillance en direct — Bekaye Sora Mobile" },
      {
        property: "og:description",
        content: "Le Directeur voit chaque opération de la boutique au moment où elle arrive.",
      },
    ],
  }),
  component: DirectMobile,
});

function DirectMobile() {
  const evenements = useFluxDirect(30);
  const maintenant = useHorloge(1000);
  const { preferences } = useMobileSession();

  return (
    <MobilePage titre="Surveillance en direct" sousTitre="Actualisation automatique">
      <MobileCard className="flex items-center gap-3 border-primary/25 bg-primary-soft/40">
        <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <Radio className="h-4 w-4" />
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {preferences.surveillanceLive ? "Mode direct activé" : "Mode direct en pause"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Dernière synchronisation :{" "}
            {maintenant
              ? new Intl.DateTimeFormat("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }).format(maintenant)
              : "—"}
          </p>
        </div>
      </MobileCard>

      {evenements.length === 0 ? (
        <MobileEmpty message="Aucune activité pour le moment." />
      ) : (
        <ol className="relative space-y-3 border-l border-border/70 pl-4">
          {evenements.map((e) => {
            const Icone = ICONES_NOTIF[e.icone];
            return (
              <li key={e.id} className="relative">
                <span className="absolute -left-[25px] top-3 grid h-4 w-4 place-items-center rounded-full border-2 border-background bg-primary" />
                <MobileCard className="p-3">
                  <div className="flex items-start gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                      <Icone className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{e.titre}</p>
                      <p className="truncate text-xs text-muted-foreground">{e.detail}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground/80">
                        {formatJourHeure(e.date)} · {depuis(e.date, maintenant)}
                      </p>
                    </div>
                  </div>
                </MobileCard>
              </li>
            );
          })}
        </ol>
      )}
    </MobilePage>
  );
}
