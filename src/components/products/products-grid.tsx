import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import { ProductThumb } from "@/components/products/product-thumb";
import { StatusBadge } from "@/components/products/status-badge";
import { ProductRowActions, type ProductActions } from "@/components/products/product-actions";
import { formatFCFA, statutProduit, type Produit } from "@/lib/products/types";

export function ProductsGrid({
  produits,
  actions,
}: {
  produits: Produit[];
  actions: ProductActions;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {produits.map((produit) => {
        const statut = statutProduit(produit);
        return (
          <article
            key={produit.id}
            className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-soft)]"
          >
            <ProductThumb
              src={produit.image}
              alt={produit.nom}
              className="h-40 w-full rounded-none border-0 border-b border-border"
              iconClassName="h-7 w-7"
            />
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-display text-sm font-semibold text-foreground">
                    {produit.nom}
                  </h3>
                  <p className="truncate text-xs text-muted-foreground">
                    {produit.marque} · {produit.categorie}
                  </p>
                </div>
                <ProductRowActions produit={produit} actions={actions} />
              </div>

              <div className="flex items-end justify-between gap-2">
                <p className="font-display text-lg font-semibold text-primary">
                  {formatFCFA(produit.prixVente)}
                </p>
                <p
                  className={cn(
                    "text-xs font-semibold",
                    statut === "rupture"
                      ? "text-primary"
                      : statut === "faible"
                        ? "text-amber-600"
                        : "text-muted-foreground",
                  )}
                >
                  Stock : {produit.stock}
                </p>
              </div>

              <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                <StatusBadge statut={statut} />
                <Link
                  to="/produits/$produitId"
                  params={{ produitId: produit.id }}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted"
                >
                  Voir
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
