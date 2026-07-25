import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";
import { salesRangeLabels, salesSeries, formatFCFA } from "@/lib/dashboard-data";
import { SectionCard } from "./section-card";

type Range = keyof typeof salesSeries;

export function SalesChart() {
  const [range, setRange] = useState<Range>("7j");
  const data = salesSeries[range];
  const total = data.reduce((sum, p) => sum + p.ventes, 0);

  return (
    <SectionCard
      title="Évolution des ventes"
      description={`Total sur la période : ${formatFCFA(total)}`}
      action={
        <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
          {(Object.keys(salesRangeLabels) as Range[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                range === key
                  ? "bg-card text-foreground shadow-[var(--shadow-card)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {salesRangeLabels[key]}
            </button>
          ))}
        </div>
      }
    >
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ventesFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={54}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
            />
            <Tooltip
              formatter={(value) => [formatFCFA(Number(value)), "Ventes"]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--card)",
                fontSize: 12,
                boxShadow: "var(--shadow-soft)",
              }}
            />
            <Area
              type="monotone"
              dataKey="ventes"
              stroke="var(--primary)"
              strokeWidth={2.5}
              fill="url(#ventesFill)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
