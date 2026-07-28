import { useState } from "react";
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
import { PLAGES_FINANCE, type PlageFinance, type PointFinancier } from "@/lib/finance/analytics";
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

export function PlageSelector({
  plage,
  onChange,
}: {
  plage: PlageFinance;
  onChange: (plage: PlageFinance) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
      {PLAGES_FINANCE.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            plage === option.value
              ? "bg-card text-foreground shadow-[var(--shadow-card)]"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

const abrege = (v: number) =>
  Math.abs(v) >= 1000000 ? `${Math.round(v / 100000) / 10}M` : `${Math.round(v / 1000)}k`;

export function RevenueChart({
  data,
  plage,
  onPlageChange,
}: {
  data: PointFinancier[];
  plage: PlageFinance;
  onPlageChange: (plage: PlageFinance) => void;
}) {
  const total = data.reduce((sum, p) => sum + p.ca, 0);
  return (
    <SectionCard
      title="Évolution du chiffre d'affaires"
      description={`Total sur la période : ${formatFCFA(total)}`}
      action={<PlageSelector plage={plage} onChange={onPlageChange} />}
    >
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="finCaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
            <XAxis dataKey="label" interval="preserveStartEnd" {...AXES} />
            <YAxis width={54} tickFormatter={abrege} {...AXES} />
            <Tooltip
              formatter={(value) => [formatFCFA(Number(value)), "Chiffre d'affaires"]}
              contentStyle={INFOBULLE}
            />
            <Area
              type="monotone"
              dataKey="ca"
              stroke="var(--primary)"
              strokeWidth={2.5}
              fill="url(#finCaFill)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}

export function ExpensesChart({ data }: { data: PointFinancier[] }) {
  const total = data.reduce((sum, p) => sum + p.depenses, 0);
  return (
    <SectionCard
      title="Évolution des dépenses"
      description={`Total sur la période : ${formatFCFA(total)}`}
    >
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
            <XAxis dataKey="label" interval="preserveStartEnd" {...AXES} />
            <YAxis width={54} tickFormatter={abrege} {...AXES} />
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              formatter={(value) => [formatFCFA(Number(value)), "Dépenses"]}
              contentStyle={INFOBULLE}
            />
            <Bar dataKey="depenses" fill="var(--chart-4)" radius={[6, 6, 0, 0]} maxBarSize={34} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}

export function ProfitChart({ data }: { data: PointFinancier[] }) {
  const total = data.reduce((sum, p) => sum + p.benefice, 0);
  return (
    <SectionCard
      title="Évolution du bénéfice"
      description={`Bénéfice cumulé : ${formatFCFA(total)}`}
    >
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
            <XAxis dataKey="label" interval="preserveStartEnd" {...AXES} />
            <YAxis width={54} tickFormatter={abrege} {...AXES} />
            <Tooltip
              formatter={(value) => [formatFCFA(Number(value)), "Bénéfice"]}
              contentStyle={INFOBULLE}
            />
            <Line
              type="monotone"
              dataKey="benefice"
              stroke="var(--success)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
