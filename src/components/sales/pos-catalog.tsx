import { useMemo, useState } from "react";
import { Plus, ScanLine, Search } from "lucide-react";
import { toast } from "sonner";

import { ProductThumb } from "@/components/products/product-thumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatFCFA, statutProduit } from "@/lib/products/types";
import type { Produit } from "@/lib/products/types";
import { cn } from "@/lib/utils";

export function PosCatalog({
  produits,
  onAdd,
}: {
  produits: Produit[];
  onAdd: (produit: Produit) => void;
}) {
  const [recherche, setRecherche] = useState("");

  const resultats = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return produits
      .filter((p) => p.actif)
      .filter((p) =>
        q ? `${p.nom} ${p.codeBarres} ${p.categorie} ${p.marque}`.toLowerCase().includes(q) : true,
      );
  }, [produits, recherche]);

  const scanner = () => {
    const disponible = resultats.find((p) => p.stock > 0) ?? produits[0];
    toast.info("Scanner de code-barres", {
      description: disponible
        ? `Fonction prévue : la caméra ajoutera directement le produit scanné (ex. ${disponible.codeBarres}).`
        : "Fonction prévue pour une future connexion avec un scanner ou la caméra.",
    });
  };

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher : nom, code-barres, catégorie, marque…"
            className="h-11 pl-9"
            autoFocus
          />
        </div>
        <Button variant="outline" className="h-11 gap-2" onClick={scanner}>
          <ScanLine className="h-4 w-4" />
          Scanner un code-barres
        </Button>
      </div>

      {resultats.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          Aucun produit ne correspond à « {recherche} ».
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {resultats.map((produit) => {
            const rupture = produit.stock <= 0;
            const statut = statutProduit(produit);
            return (
              <article
                key={produit.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)] transition hover:border-primary/40"
              >
                <div className="flex gap-3">
                  <ProductThumb src={produit.image} alt={produit.nom} className="h-16 w-16" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{produit.nom}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {produit.marque} · {produit.categorie}
                    </p>
                    <p className="mt-1 font-display text-base font-semibold text-primary">
                      {formatFCFA(produit.prixVente)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                      rupture
                        ? "border-primary/30 bg-primary-soft text-primary"
                        : statut === "faible"
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
                          : "border-success/30 bg-success/10 text-success",
                    )}
                  >
                    {rupture ? "Rupture" : `${produit.stock} en stock`}
                  </span>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={rupture}
                    onClick={() => onAdd(produit)}
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
