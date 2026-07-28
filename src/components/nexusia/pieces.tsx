import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SectionCard } from "@/components/dashboard/section-card";
import { formatFCFA } from "@/lib/products/types";
import { TON_CLASSE, type TonInsight } from "@/lib/nexusia/types";
import { cn } from "@/lib/utils";

const AXES = {
  tickLine: false,
  axisLine: false,
  tick: { fontSize: 11, fill: "var(--muted-foreground)" },
} as const;

const INFOBULLE = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--card)",
  fontSize: 12,
  boxShadow: "var(--shadow-soft)",
} as const;

export { SectionCard };

/* ------------------------------------------------------------------ */
/* Entête de page                                                       */
/* ------------------------------------------------------------------ */

export function NexusHeader({
  eyebrow,
  titre,
  sous,
  action,
}: {
  eyebrow?: string;
  titre: string;
  sous: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {titre}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{sous}</p>
      </div>
      {action}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Cartes                                                               */
/* ------------------------------------------------------------------ */

export function StatTile({
  label,
  valeur,
  detail,
  ton = "info",
}: {
  label: string;
  valeur: string;
  detail?: string;
  ton?: TonInsight;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 font-display text-xl font-semibold text-foreground">{valeur}</p>
      {detail && (
        <p className={cn("mt-1 inline-flex rounded-md border px-1.5 py-0.5 text-[11px]", TON_CLASSE[ton])}>
          {detail}
        </p>
      )}
    </div>
  );
}

export function Pastille({ ton, children }: { ton: TonInsight; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
        TON_CLASSE[ton],
      )}
    >
      {children}
    </span>
  );
}

export function ListeInsights({
  items,
}: {
  items: { id: string; titre: string; message: string; ton: TonInsight; badge?: string }[];
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun élément à signaler pour le moment.</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-col gap-1 rounded-xl border border-border bg-background/60 p-3.5 transition hover:border-primary/30"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-foreground">{item.titre}</p>
            {item.badge && <Pastille ton={item.ton}>{item.badge}</Pastille>}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{item.message}</p>
        </li>
      ))}
    </ul>
  );
}

export function BarreProgression({ valeur, ton = "info" }: { valeur: number; ton?: TonInsight }) {
  const couleur =
    ton === "succes"
      ? "bg-emerald-500"
      : ton === "alerte"
        ? "bg-amber-500"
        : ton === "danger"
          ? "bg-primary"
          : "bg-sky-500";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full transition-all duration-700", couleur)}
        style={{ width: `${Math.max(0, Math.min(100, valeur))}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Graphiques                                                           */
/* ------------------------------------------------------------------ */

type Point = { label: string } & Record<string, string | number>;

export function CourbeEvolution({
  data,
  cles,
}: {
  data: Point[];
  cles: { cle: string; nom: string; couleur: string }[];
}) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            {cles.map((c) => (
              <linearGradient key={c.cle} id={`nx-${c.cle}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c.couleur} stopOpacity={0.28} />
                <stop offset="100%" stopColor={c.couleur} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" {...AXES} />
          <YAxis {...AXES} width={64} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
          <Tooltip
            contentStyle={INFOBULLE}
            formatter={(valeur: number, nom: string) => [formatFCFA(Number(valeur)), nom]}
          />
          {cles.map((c) => (
            <Area
              key={c.cle}
              type="monotone"
              dataKey={c.cle}
              name={c.nom}
              stroke={c.couleur}
              strokeWidth={2}
              fill={`url(#nx-${c.cle})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarresComparaison({
  data,
  cle,
  nom,
  couleur = "var(--chart-1)",
}: {
  data: Point[];
  cle: string;
  nom: string;
  couleur?: string;
}) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" {...AXES} interval={0} angle={-12} height={44} textAnchor="end" />
          <YAxis {...AXES} width={64} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
          <Tooltip contentStyle={INFOBULLE} formatter={(v: number) => [formatFCFA(Number(v)), nom]} />
          <Bar dataKey={cle} name={nom} fill={couleur} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LigneSimple({
  data,
  cle,
  nom,
  couleur = "var(--chart-2)",
}: {
  data: Point[];
  cle: string;
  nom: string;
  couleur?: string;
}) {
  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" {...AXES} />
          <YAxis {...AXES} width={56} />
          <Tooltip contentStyle={INFOBULLE} />
          <Line
            type="monotone"
            dataKey={cle}
            name={nom}
            stroke={couleur}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tableau compact                                                      */
/* ------------------------------------------------------------------ */

export function TableauCompact({
  entetes,
  lignes,
}: {
  entetes: string[];
  lignes: (ReactNode | string | number)[][];
}) {
  if (lignes.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune donnée disponible.</p>;
  }
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
            {entetes.map((e, i) => (
              <th key={e} className={cn("px-2 py-2 font-medium", i > 0 && "text-right")}>
                {e}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lignes.map((ligne, index) => (
            <tr key={index} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
              {ligne.map((cellule, i) => (
                <td
                  key={i}
                  className={cn(
                    "px-2 py-2.5 text-foreground",
                    i > 0 && "text-right tabular-nums",
                    i === 0 && "font-medium",
                  )}
                >
                  {cellule}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
