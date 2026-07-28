import { SectionCard } from "@/components/dashboard/section-card";
import { formatFCFA } from "@/lib/products/types";
import {
  lignesEnEcart,
  lignesVerifiees,
  tauxConformite,
  valeurPertes,
  valeurSurplus,
  type Inventaire,
} from "@/lib/inventory/types";

export function ResultsSummary({ inventaire }: { inventaire: Inventaire }) {
  const verifies = lignesVerifiees(inventaire).length;
  const ecarts = lignesEnEcart(inventaire).length;
  const conformite = tauxConformite(inventaire);

  const items = [
    { label: "Produits vérifiés", value: `${verifies} / ${inventaire.lignes.length}` },
    { label: "Produits avec écart", value: String(ecarts) },
    { label: "Valeur des pertes", value: formatFCFA(Math.abs(valeurPertes(inventaire))) },
    { label: "Valeur des surplus", value: formatFCFA(valeurSurplus(inventaire)) },
  ];

  return (
    <SectionCard title="Résultats de l'inventaire" description="Synthèse du comptage en cours.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-1 font-display text-lg font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Pourcentage de conformité</span>
          <span className="font-display text-lg font-semibold text-foreground">{conformite} %</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-success transition-all"
            style={{ width: `${conformite}%` }}
          />
        </div>
      </div>
    </SectionCard>
  );
}
