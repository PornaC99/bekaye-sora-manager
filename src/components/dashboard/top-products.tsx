import { Link } from "@tanstack/react-router";

import { topProducts } from "@/lib/dashboard-data";
import { SectionCard } from "./section-card";

export function TopProducts() {
  return (
    <SectionCard
      title="Produits les plus vendus"
      description="Classement du mois en cours"
      action={
        <Link
          to="/produits"
          className="text-xs font-semibold text-primary transition-opacity hover:opacity-70"
        >
          Catalogue
        </Link>
      }
    >
      <ul className="flex flex-col gap-3">
        {topProducts.map((product) => (
          <li
            key={product.id}
            className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:border-primary/25 hover:bg-muted/40"
          >
            <img
              src={product.image}
              alt={product.nom}
              loading="lazy"
              width={512}
              height={512}
              className="h-12 w-12 shrink-0 rounded-lg border border-border object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{product.nom}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {product.quantiteVendue} vendus · stock restant {product.stockRestant}
              </p>
            </div>
            <span className="shrink-0 rounded-md bg-primary-soft px-2 py-1 text-xs font-semibold text-primary">
              {product.quantiteVendue}
            </span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
