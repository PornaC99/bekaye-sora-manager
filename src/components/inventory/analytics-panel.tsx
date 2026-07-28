import { SectionCard } from "@/components/dashboard/section-card";
import { formatFCFA } from "@/lib/products/types";

export function TopList({
  title,
  description,
  items,
  suffixe,
}: {
  title: string;
  description: string;
  items: { id: string; nom: string; valeur: number }[];
  suffixe: string;
}) {
  return (
    <SectionCard title={title} description={description}>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Pas encore de données.</p>
      ) : (
        <ol className="flex flex-col gap-2.5">
          {items.map((item, index) => (
            <li key={item.id} className="flex items-center gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">{item.nom}</span>
              <span className="shrink-0 text-sm font-semibold text-foreground">
                {item.valeur} {suffixe}
              </span>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  );
}

export function ValueCards({
  valeurStock,
  pertes,
  surplus,
}: {
  valeurStock: number;
  pertes: number;
  surplus: number;
}) {
  const items = [
    { label: "Valeur totale du stock", value: formatFCFA(valeurStock), tone: "text-foreground" },
    { label: "Valeur des pertes", value: formatFCFA(Math.abs(pertes)), tone: "text-primary" },
    { label: "Valeur des surplus", value: formatFCFA(surplus), tone: "text-success" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-border bg-card px-4 py-4 shadow-[var(--shadow-card)]"
        >
          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            {item.label}
          </p>
          <p className={`mt-1 font-display text-xl font-semibold ${item.tone}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}
