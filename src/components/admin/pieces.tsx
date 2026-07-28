import type { ReactNode } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { IndicateurSante } from "@/lib/admin/health";

export function AdminCard({
  titre,
  description,
  actions,
  children,
  className,
}: {
  titre: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6",
        className,
      )}
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{titre}</h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </header>
      {children}
    </section>
  );
}

export function Champ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function Bascule({
  label,
  description,
  active,
  onChange,
}: {
  label: string;
  description?: string;
  active: boolean;
  onChange: (valeur: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!active)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3 text-left transition hover:bg-muted/60"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
        )}
      </span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition",
          active ? "bg-primary" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-all",
            active ? "left-[22px]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}

export function Pastille({
  ton,
  children,
}: {
  ton: "succes" | "attention" | "danger" | "neutre";
  children: ReactNode;
}) {
  const tons = {
    succes: "bg-emerald-500/10 text-emerald-600",
    attention: "bg-amber-500/10 text-amber-600",
    danger: "bg-primary/10 text-primary",
    neutre: "bg-muted text-muted-foreground",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tons[ton],
      )}
    >
      {children}
    </span>
  );
}

export function SanteCards({ indicateurs }: { indicateurs: IndicateurSante[] }) {
  const couleur = {
    bon: "text-emerald-600",
    moyen: "text-amber-600",
    critique: "text-primary",
  } as const;
  const barre = {
    bon: "bg-emerald-500",
    moyen: "bg-amber-500",
    critique: "bg-primary",
  } as const;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {indicateurs.map((i) => (
        <article
          key={i.cle}
          className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {i.label}
          </p>
          <p className={cn("mt-2 text-xl font-semibold", couleur[i.niveau])}>{i.valeur}</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", barre[i.niveau])}
              style={{ width: `${Math.min(100, Math.max(3, i.progression))}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{i.detail}</p>
        </article>
      ))}
    </div>
  );
}

export function AssistantConfiguration({
  etapes,
  pourcentage,
  done,
  total,
  onBasculer,
}: {
  etapes: { cle: string; titre: string; description: string; lien: string; faite: boolean }[];
  pourcentage: number;
  done: number;
  total: number;
  onBasculer: (cle: string) => void;
}) {
  return (
    <AdminCard
      titre="Assistant de configuration"
      description={`Configuration complétée à ${pourcentage} % — ${done} étape(s) sur ${total}.`}
    >
      <Progress value={pourcentage} className="h-2" />
      <ul className="mt-4 grid gap-2 md:grid-cols-2">
        {etapes.map((etape, index) => (
          <li
            key={etape.cle}
            className="flex items-start gap-3 rounded-xl border border-border bg-background p-3"
          >
            <button
              type="button"
              onClick={() => onBasculer(etape.cle)}
              aria-label={etape.faite ? "Marquer comme à faire" : "Marquer comme terminé"}
              className="mt-0.5 shrink-0"
            >
              {etape.faite ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm font-medium",
                  etape.faite ? "text-muted-foreground line-through" : "text-foreground",
                )}
              >
                {index + 1}. {etape.titre}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{etape.description}</p>
              <Link
                to={etape.lien}
                className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
              >
                Ouvrir
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </AdminCard>
  );
}
