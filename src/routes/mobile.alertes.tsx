import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

import { MobileCard, MobileEmpty, MobilePage } from "@/components/mobile/shell";
import { ICONES_NOTIF } from "@/components/mobile/pieces";
import { useAlertesCritiques } from "@/lib/mobile/feed";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mobile/alertes")({
  head: () => ({
    meta: [
      { title: "Alertes critiques — Bekaye Sora Mobile" },
      {
        name: "description",
        content: "Stock critique, écarts de caisse, produits expirés et baisse des ventes.",
      },
      { property: "og:title", content: "Alertes critiques — Bekaye Sora Mobile" },
      {
        property: "og:description",
        content: "Les situations qui exigent une décision immédiate du Directeur.",
      },
    ],
  }),
  component: AlertesMobile,
});

const NIVEAUX = {
  critique: {
    carte: "border-destructive/30 bg-destructive/5",
    pastille: "bg-destructive/10 text-destructive",
    label: "Critique",
  },
  eleve: {
    carte: "border-amber-500/30 bg-amber-500/5",
    pastille: "bg-amber-500/10 text-amber-600",
    label: "Élevé",
  },
  moyen: {
    carte: "border-primary/25 bg-primary-soft/40",
    pastille: "bg-primary-soft text-primary",
    label: "À surveiller",
  },
} as const;

function AlertesMobile() {
  const alertes = useAlertesCritiques();

  return (
    <MobilePage titre="Alertes critiques" sousTitre={`${alertes.length} situation(s) détectée(s)`}>
      {alertes.length === 0 ? (
        <MobileEmpty message="Aucune alerte. Tout est sous contrôle." />
      ) : (
        <div className="space-y-3">
          {alertes.map((alerte) => {
            const Icone = ICONES_NOTIF[alerte.icone];
            const niveau = NIVEAUX[alerte.niveau];
            return (
              <MobileCard key={alerte.id} className={cn("border", niveau.carte)}>
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                      niveau.pastille,
                    )}
                  >
                    <Icone className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{alerte.titre}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {alerte.message}
                    </p>
                    <span
                      className={cn(
                        "mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        niveau.pastille,
                      )}
                    >
                      {niveau.label}
                    </span>
                  </div>
                </div>
              </MobileCard>
            );
          })}
        </div>
      )}

      <MobileCard className="flex items-start gap-3 border-dashed">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Les alertes sont recalculées automatiquement dès qu'une action est réalisée sur
          l'ordinateur (vente, entrée de stock, clôture de caisse…).
        </p>
      </MobileCard>
    </MobilePage>
  );
}
