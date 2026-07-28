import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  BadgeCheck,
  Boxes,
  Info,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import { formatFCFA } from "@/lib/products/types";
import type {
  AlerteRapport,
  KpisRapport,
  PointRapport,
  Regroupement,
  ResumeExecutif,
  ScorePerformance,
} from "@/lib/reports/analytics";
import { PERIODES, variation, type ClePeriode, type Periode } from "@/lib/reports/types";
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

const COULEURS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

/* ------------------------------------------------------------------ */
/* Filtres de période                                                   */
/* ------------------------------------------------------------------ */

export function PeriodFilters({
  cle,
  personnalisee,
  onChange,
  onPersonnalisee,
}: {
  cle: ClePeriode;
  personnalisee: { debut: string; fin: string };
  onChange: (cle: ClePeriode) => void;
  onPersonnalisee: (valeurs: { debut: string; fin: string }) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-2 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-1">
        {PERIODES.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange(p.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              cle === p.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      {cle === "personnalisee" && (
        <div className="flex items-center gap-2 px-1 pb-1 sm:pb-0">
          <input
            type="date"
            value={personnalisee.debut}
            onChange={(e) => onPersonnalisee({ ...personnalisee, debut: e.target.value })}
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground"
          />
          <span className="text-xs text-muted-foreground">→</span>
          <input
            type="date"
            value={personnalisee.fin}
            onChange={(e) => onPersonnalisee({ ...personnalisee, fin: e.target.value })}
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground"
          />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cartes KPI                                                           */
/* ------------------------------------------------------------------ */

function Evolution({ valeur }: { valeur: number }) {
  const positif = valeur >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-semibold",
        positif ? "text-success" : "text-destructive",
      )}
    >
      {positif ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {positif ? "+" : ""}
      {valeur} %
    </span>
  );
}

export function BiKpiCards({ kpis, precedents }: { kpis: KpisRapport; precedents: KpisRapport }) {
  const cartes: { label: string; valeur: string; evolution?: number }[] = [
    {
      label: "Chiffre d'affaires",
      valeur: formatFCFA(kpis.chiffreAffaires),
      evolution: variation(kpis.chiffreAffaires, precedents.chiffreAffaires),
    },
    {
      label: "Bénéfice",
      valeur: formatFCFA(kpis.benefice),
      evolution: variation(kpis.benefice, precedents.benefice),
    },
    {
      label: "Dépenses",
      valeur: formatFCFA(kpis.depenses),
      evolution: variation(kpis.depenses, precedents.depenses),
    },
    {
      label: "Ventes",
      valeur: String(kpis.nombreVentes),
      evolution: variation(kpis.nombreVentes, precedents.nombreVentes),
    },
    { label: "Produits vendus", valeur: String(kpis.produitsVendus) },
    { label: "Clients actifs", valeur: String(kpis.clientsActifs) },
    { label: "Fournisseurs actifs", valeur: String(kpis.fournisseursActifs) },
    { label: "Employés actifs", valeur: String(kpis.employesActifs) },
    { label: "Valeur du stock", valeur: formatFCFA(kpis.valeurStock) },
    { label: "Produits en rupture", valeur: String(kpis.ruptures) },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cartes.map((carte) => (
        <div
          key={carte.label}
          className="rounded-2xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-card)]"
        >
          <p className="text-[11px] uppercase leading-tight tracking-[0.12em] text-muted-foreground">
            {carte.label}
          </p>
          <p className="mt-1.5 truncate font-display text-lg font-semibold text-foreground">
            {carte.valeur}
          </p>
          {carte.evolution !== undefined && <Evolution valeur={carte.evolution} />}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Graphiques d'évolution                                               */
/* ------------------------------------------------------------------ */

export function EvolutionCharts({ serie }: { serie: PointRapport[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <SectionCard title="Évolution du chiffre d'affaires" description="Ventes encaissées">
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={serie} margin={{ left: -20, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="grad-ca" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" {...AXES} />
              <YAxis
                {...AXES}
                width={70}
                tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
              />
              <Tooltip
                contentStyle={INFOBULLE}
                formatter={(v: number) => [formatFCFA(v), "Chiffre d'affaires"]}
              />
              <Area dataKey="ca" stroke="var(--primary)" strokeWidth={2} fill="url(#grad-ca)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard title="Évolution des ventes" description="Nombre de transactions">
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={serie} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" {...AXES} />
              <YAxis {...AXES} width={40} allowDecimals={false} />
              <Tooltip contentStyle={INFOBULLE} formatter={(v: number) => [v, "Ventes"]} />
              <Bar dataKey="ventes" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard title="Bénéfices et dépenses" description="Comparaison sur la période">
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={serie} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" {...AXES} />
              <YAxis
                {...AXES}
                width={70}
                tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
              />
              <Tooltip contentStyle={INFOBULLE} formatter={(v: number) => formatFCFA(v)} />
              <Line
                dataKey="benefice"
                name="Bénéfice"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                dataKey="depenses"
                name="Dépenses"
                stroke="var(--chart-4)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard title="Évolution des stocks" description="Valeur estimée du stock">
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={serie} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" {...AXES} />
              <YAxis
                {...AXES}
                width={70}
                tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
              />
              <Tooltip
                contentStyle={INFOBULLE}
                formatter={(v: number) => [formatFCFA(v), "Stock"]}
              />
              <Area
                dataKey="stock"
                stroke="var(--chart-3)"
                strokeWidth={2}
                fill="var(--chart-3)"
                fillOpacity={0.12}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  );
}

export function RepartitionPie({
  titre,
  description,
  donnees,
}: {
  titre: string;
  description?: string;
  donnees: Regroupement[];
}) {
  return (
    <SectionCard title={titre} description={description}>
      {donnees.length === 0 ? (
        <EtatVide />
      ) : (
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donnees}
                dataKey="chiffreAffaires"
                nameKey="nom"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
              >
                {donnees.map((entree, i) => (
                  <Cell key={entree.nom} fill={COULEURS[i % COULEURS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={INFOBULLE} formatter={(v: number) => formatFCFA(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Tableaux légers                                                      */
/* ------------------------------------------------------------------ */

export function EtatVide({ message = "Aucune donnée sur cette période." }: { message?: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{message}</p>;
}

export function MiniTable({
  entetes,
  lignes,
}: {
  entetes: string[];
  lignes: (string | number | ReactNode)[][];
}) {
  if (lignes.length === 0) return <EtatVide />;
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[420px] text-sm">
        <thead>
          <tr className="border-b border-border">
            {entetes.map((e, i) => (
              <th
                key={e}
                className={cn(
                  "whitespace-nowrap pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground",
                  i === 0 ? "text-left" : "text-right",
                )}
              >
                {e}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lignes.map((ligne, index) => (
            <tr key={index} className="border-b border-border/60 last:border-0">
              {ligne.map((cellule, i) => (
                <td
                  key={i}
                  className={cn(
                    "py-2.5 text-foreground",
                    i === 0 ? "text-left font-medium" : "text-right tabular-nums",
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

/* ------------------------------------------------------------------ */
/* Résumé exécutif & alertes                                            */
/* ------------------------------------------------------------------ */

const TON_CLASSE: Record<AlerteRapport["ton"], string> = {
  succes: "bg-success/10 text-success",
  info: "bg-primary-soft text-primary",
  alerte: "bg-amber-500/10 text-amber-600",
  danger: "bg-destructive/10 text-destructive",
};

export function ExecutiveSummary({
  resume,
  note,
  periodeLabel,
}: {
  resume: ResumeExecutif;
  note: number;
  periodeLabel: string;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              Résumé de la direction
            </h2>
            <p className="text-xs text-muted-foreground">{periodeLabel}</p>
          </div>
        </div>
        <span className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
          {note}/100
        </span>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {resume.phrases.map((phrase) => (
          <li key={phrase} className="flex gap-2 text-sm leading-relaxed text-foreground">
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{phrase}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Recommandations
        </p>
        <ul className="mt-2 flex flex-col gap-1.5">
          {resume.recommandations.map((r) => (
            <li key={r} className="flex gap-2 text-sm text-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function AlertsPanel({ alertes }: { alertes: AlerteRapport[] }) {
  return (
    <SectionCard title="Alertes intelligentes" description="Détectées automatiquement">
      {alertes.length === 0 ? (
        <EtatVide message="Aucune alerte : tout est sous contrôle." />
      ) : (
        <ul className="flex flex-col gap-3">
          {alertes.map((a) => (
            <li key={a.id} className="flex gap-3 rounded-xl border border-border p-3">
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                  TON_CLASSE[a.ton],
                )}
              >
                {a.ton === "succes" ? (
                  <TrendingUp className="h-4 w-4" />
                ) : a.ton === "danger" ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <Boxes className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{a.titre}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{a.message}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Jauges de performance                                                */
/* ------------------------------------------------------------------ */

export function Gauge({ score }: { score: ScorePerformance }) {
  const couleur =
    score.note >= 80
      ? "var(--success)"
      : score.note >= 60
        ? "var(--chart-4)"
        : "var(--destructive)";
  const angle = (score.note / 100) * 360;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div
        className="grid h-20 w-20 shrink-0 place-items-center rounded-full"
        style={{ background: `conic-gradient(${couleur} ${angle}deg, var(--muted) ${angle}deg)` }}
      >
        <span className="grid h-15 w-15 place-items-center rounded-full bg-card px-3 py-3 font-display text-base font-semibold text-foreground">
          {score.note}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{score.label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{score.detail}</p>
      </div>
    </div>
  );
}
