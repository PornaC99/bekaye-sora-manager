import { CalendarClock, TrendingUp, Wallet } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import { formatFCFA } from "@/lib/products/types";
import type { Previsions } from "@/lib/finance/analytics";
import { formatDateCourte } from "@/lib/finance/types";
import { cn } from "@/lib/utils";

export function ForecastPanel({
  previsions,
  objectifCa,
}: {
  previsions: Previsions;
  objectifCa: number;
}) {
  const cartes = [
    {
      label: "Chiffre d'affaires prévu",
      valeur: formatFCFA(previsions.caPrevu),
      detail: `Réalisé : ${formatFCFA(previsions.caRealise)} en ${previsions.joursEcoules} jours`,
      icon: TrendingUp,
      tone: "bg-primary-soft text-primary",
    },
    {
      label: "Bénéfice prévisionnel",
      valeur: formatFCFA(previsions.beneficePrevu),
      detail: `Dépenses estimées : ${formatFCFA(previsions.depensesPrevues)}`,
      icon: Wallet,
      tone:
        previsions.beneficePrevu >= 0
          ? "bg-success/10 text-success"
          : "bg-destructive/10 text-destructive",
    },
    {
      label: "Rupture de trésorerie",
      valeur: previsions.dateRuptureTresorerie
        ? formatDateCourte(previsions.dateRuptureTresorerie)
        : "Aucun risque",
      detail: previsions.joursAvantRupture
        ? `Dans environ ${previsions.joursAvantRupture} jours au rythme actuel`
        : "Le flux de trésorerie est positif",
      icon: CalendarClock,
      tone: previsions.dateRuptureTresorerie
        ? "bg-destructive/10 text-destructive"
        : "bg-success/10 text-success",
    },
  ];

  const progressionObjectif =
    objectifCa > 0 ? Math.min(100, Math.round((previsions.caPrevu / objectifCa) * 100)) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-3">
        {cartes.map((carte) => (
          <div
            key={carte.label}
            className="rounded-2xl border border-border bg-card px-5 py-4 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {carte.label}
              </p>
              <span className={cn("grid h-8 w-8 place-items-center rounded-lg", carte.tone)}>
                <carte.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-1.5 font-display text-xl font-semibold text-foreground">
              {carte.valeur}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{carte.detail}</p>
          </div>
        ))}
      </div>

      <SectionCard
        title="Projection par rapport à l'objectif"
        description={`Objectif mensuel : ${formatFCFA(objectifCa)}`}
      >
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              progressionObjectif >= 100 ? "bg-success" : "bg-primary",
            )}
            style={{ width: `${Math.max(2, progressionObjectif)}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          À ce rythme, vous atteindrez{" "}
          <span className="font-semibold text-foreground">{progressionObjectif} %</span> de votre
          objectif mensuel, soit {formatFCFA(previsions.caPrevu)} sur {previsions.joursDuMois}{" "}
          jours.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Moyenne journalière actuelle : {formatFCFA(previsions.moyenneJournaliereCA)} de ventes,
          flux net de {formatFCFA(previsions.fluxJournalierNet)} par jour.
        </p>
      </SectionCard>
    </div>
  );
}
