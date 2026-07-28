import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import type { PointFinancier } from "@/lib/finance/analytics";
import { formatFCFA } from "@/lib/products/types";

export function MiniTrendChart({
  data,
  cle,
  couleur = "var(--primary)",
}: {
  data: PointFinancier[];
  cle: "ca" | "benefice" | "depenses";
  couleur?: string;
}) {
  const id = `deg-${cle}`;
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={couleur} stopOpacity={0.35} />
              <stop offset="100%" stopColor={couleur} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          />
          <Tooltip
            cursor={{ stroke: "var(--border)" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--card)",
              fontSize: 12,
            }}
            formatter={(valeur: number) => formatFCFA(valeur)}
            labelStyle={{ color: "var(--muted-foreground)" }}
          />
          <Area
            type="monotone"
            dataKey={cle}
            stroke={couleur}
            strokeWidth={2}
            fill={`url(#${id})`}
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
