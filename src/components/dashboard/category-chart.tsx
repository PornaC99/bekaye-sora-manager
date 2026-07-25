import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { categoryBreakdown } from "@/lib/dashboard-data";
import { SectionCard } from "./section-card";

export function CategoryChart() {
  return (
    <SectionCard title="Ventes par catégorie" description="Répartition du mois en cours">
      <div className="h-[190px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryBreakdown}
              dataKey="value"
              nameKey="name"
              innerRadius={54}
              outerRadius={82}
              paddingAngle={3}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {categoryBreakdown.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value} %`, String(name)]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--card)",
                fontSize: 12,
                boxShadow: "var(--shadow-soft)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-4 flex flex-col gap-2.5">
        {categoryBreakdown.map((slice) => (
          <li key={slice.name} className="flex min-w-0 items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{slice.name}</span>
            <span className="shrink-0 font-medium text-foreground">{slice.value} %</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
