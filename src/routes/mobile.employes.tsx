import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { useMemo } from "react";

import { MobileCard, MobileEmpty, MobilePage, MobileSection } from "@/components/mobile/shell";
import { calculerPerformances } from "@/lib/hr/analytics";
import { useHrStore } from "@/lib/hr/store";
import { useSalesStore } from "@/lib/sales/store";
import { formatFCFA } from "@/lib/products/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mobile/employes")({
  head: () => ({
    meta: [
      { title: "Équipe & performances — Bekaye Sora Mobile" },
      {
        name: "description",
        content: "Photo, fonction et performance commerciale de chaque employé du mois en cours.",
      },
      { property: "og:title", content: "Équipe & performances — Bekaye Sora Mobile" },
      {
        property: "og:description",
        content: "Suivez les résultats de votre équipe de vente en temps réel.",
      },
    ],
  }),
  component: EmployesMobile,
});

function EmployesMobile() {
  const { employes, presences } = useHrStore();
  const { ventes } = useSalesStore();

  const performances = useMemo(
    () => calculerPerformances(employes, ventes, presences),
    [employes, ventes, presences],
  );

  const meilleur = performances[0];

  return (
    <MobilePage titre="Employés" sousTitre={`${employes.length} membre(s) de l'équipe`}>
      {meilleur && (
        <MobileCard className="border-primary/25 bg-primary-soft/40">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
              <Trophy className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.12em] text-primary">
                Meilleur vendeur du mois
              </p>
              <p className="truncate font-display text-base font-semibold text-foreground">
                {meilleur.employe.nom}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {formatFCFA(meilleur.chiffreAffaires)} · {meilleur.nombreVentes} vente(s)
              </p>
            </div>
          </div>
        </MobileCard>
      )}

      <MobileSection titre="Toute l'équipe">
        {performances.length === 0 ? (
          <MobileEmpty message="Aucun employé enregistré." />
        ) : (
          <div className="space-y-2">
            {performances.map((p) => (
              <MobileCard key={p.employe.id} className="p-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-muted font-display text-sm font-semibold text-foreground">
                    {p.employe.photo ? (
                      <img
                        src={p.employe.photo}
                        alt={`Photo de ${p.employe.nom}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      p.employe.nom
                        .split(" ")
                        .map((m) => m[0])
                        .join("")
                        .slice(0, 2)
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {p.employe.nom}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{p.employe.fonction}</p>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          p.progression >= 100 ? "bg-success" : "bg-primary",
                        )}
                        style={{ width: `${Math.min(100, Math.max(3, p.progression))}%` }}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-sm font-semibold text-foreground">
                      {formatFCFA(p.chiffreAffaires)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      objectif {p.progression} %
                    </p>
                  </div>
                </div>
              </MobileCard>
            ))}
          </div>
        )}
      </MobileSection>
    </MobilePage>
  );
}
