import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import { ProductThumb } from "@/components/products/product-thumb";
import { StatusBadge } from "@/components/products/status-badge";
import { ProductRowActions, type ProductActions } from "@/components/products/product-actions";
import { formatFCFA, statutProduit, type Produit } from "@/lib/products/types";

export function ProductsTable({
  produits,
  actions,
}: {
  produits: Produit[];
  actions: ProductActions;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto scrollbar-slim">
        <table className="w-full min-w-[1040px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Photo</th>
              <th className="px-4 py-3 font-semibold">Produit</th>
              <th className="px-4 py-3 font-semibold">Marque</th>
              <th className="px-4 py-3 font-semibold">Catégorie</th>
              <th className="px-4 py-3 font-semibold">Code-barres</th>
              <th className="px-4 py-3 text-right font-semibold">Prix d'achat</th>
              <th className="px-4 py-3 text-right font-semibold">Prix de vente</th>
              <th className="px-4 py-3 text-right font-semibold">Stock</th>
              <th className="px-4 py-3 text-right font-semibold">Stock min.</th>
              <th className="px-4 py-3 font-semibold">Statut</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {produits.map((produit) => {
              const statut = statutProduit(produit);
              return (
                <tr
                  key={produit.id}
                  className="border-b border-border/70 transition-colors last:border-0 hover:bg-muted/40"
                >
                  <td className="px-4 py-3">
                    <ProductThumb src={produit.image} alt={produit.nom} className="h-11 w-11" />
                  </td>
                  <td className="max-w-[240px] px-4 py-3">
                    <Link
                      to="/produits/$produitId"
                      params={{ produitId: produit.id }}
                      className="block truncate font-medium text-foreground transition-colors hover:text-primary"
                    >
                      {produit.nom}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {produit.id} · {produit.unite}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {produit.marque}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {produit.categorie}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                    {produit.codeBarres || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground">
                    {formatFCFA(produit.prixAchat)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-foreground">
                    {formatFCFA(produit.prixVente)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-semibold",
                      statut === "rupture"
                        ? "text-primary"
                        : statut === "faible"
                          ? "text-amber-600"
                          : "text-foreground",
                    )}
                  >
                    {produit.stock}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {produit.stockMinimum}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge statut={statut} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ProductRowActions produit={produit} actions={actions} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
