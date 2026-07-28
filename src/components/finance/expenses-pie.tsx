import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { SectionCard } from "@/components/dashboard/section-card";
import { formatFCFA } from "@/lib/products/types";
import type { PartDepense } from "@/lib/finance/analytics";

export function ExpensesPie({ repartition }: { repartition: PartDepense[] }) {
  const total = repartition.reduce((t, r) => t + r.montant, 0);

  return (
    <SectionCard
      title="Répartition des dépenses"
      description={`Mois en cours · ${formatFCFA(total)}`}
    >
      {repartition.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Aucune dépense enregistrée ce mois-ci.
        </p>
      ) : (
        <>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={repartition}
                  dataKey="montant"
                  nameKey="label"
                  innerRadius={56}
                  outerRadius={84}
                  paddingAngle={3}
                  stroke="var(--card)"
                  strokeWidth={2}
                >
                  {repartition.map((part) => (
                    <Cell key={part.categorie} fill={part.couleur} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [formatFCFA(Number(value)), String(name)]}
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
            {repartition.map((part) => (
              <li key={part.categorie} className="flex min-w-0 items-center gap-2 text-sm">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: part.couleur }}
                />
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{part.label}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{part.part} %</span>
                <span className="shrink-0 font-medium text-foreground">
                  {formatFCFA(part.montant)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </SectionCard>
  );
}
