import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { MobileCard, MobileEmpty, MobilePage } from "@/components/mobile/shell";
import { Input } from "@/components/ui/input";
import { useProductsStore } from "@/lib/products/store";
import { STATUT_LABEL, formatFCFA, statutProduit } from "@/lib/products/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mobile/produits")({
  head: () => ({
    meta: [
      { title: "Produits & stock — Bekaye Sora Mobile" },
      {
        name: "description",
        content: "Consultez le stock, recherchez un produit et vérifiez ses détails.",
      },
      { property: "og:title", content: "Produits & stock — Bekaye Sora Mobile" },
      {
        property: "og:description",
        content: "Le catalogue 501 et l'état du stock dans la poche du Directeur.",
      },
    ],
  }),
  component: ProduitsMobile,
});

const CLASSES = {
  disponible: "bg-success/10 text-success",
  faible: "bg-amber-500/10 text-amber-600",
  rupture: "bg-destructive/10 text-destructive",
  desactive: "bg-muted text-muted-foreground",
} as const;

function ProduitsMobile() {
  const { produits } = useProductsStore();
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<"tous" | "faible" | "rupture">("tous");
  const [ouvert, setOuvert] = useState<string | null>(null);

  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return produits.filter((p) => {
      const statut = statutProduit(p);
      if (filtre !== "tous" && statut !== filtre) return false;
      if (!q) return true;
      return [p.nom, p.marque, p.categorie, p.codeBarres].some((v) => v.toLowerCase().includes(q));
    });
  }, [produits, recherche, filtre]);

  return (
    <MobilePage titre="Produits" sousTitre={`${liste.length} référence(s)`}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un produit…"
          className="h-11 rounded-xl pl-9"
        />
      </div>

      <div className="flex gap-1.5">
        {(
          [
            { value: "tous", label: "Tous" },
            { value: "faible", label: "Stock faible" },
            { value: "rupture", label: "Ruptures" },
          ] as const
        ).map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFiltre(f.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              filtre === f.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {liste.length === 0 ? (
        <MobileEmpty message="Aucun produit ne correspond à votre recherche." />
      ) : (
        <div className="space-y-2">
          {liste.map((produit) => {
            const statut = statutProduit(produit);
            const detaille = ouvert === produit.id;
            return (
              <button
                key={produit.id}
                type="button"
                onClick={() => setOuvert(detaille ? null : produit.id)}
                className="w-full text-left"
              >
                <MobileCard className="p-3">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {produit.nom}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {produit.categorie} · {formatFCFA(produit.prixVente)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        CLASSES[statut],
                      )}
                    >
                      {produit.stock} · {STATUT_LABEL[statut]}
                    </span>
                  </div>
                  {detaille && (
                    <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-border/70 pt-3 text-xs">
                      {[
                        ["Marque", produit.marque],
                        ["Code-barres", produit.codeBarres],
                        ["Prix d'achat", formatFCFA(produit.prixAchat)],
                        ["Prix de vente", formatFCFA(produit.prixVente)],
                        ["Stock minimum", String(produit.stockMinimum)],
                        ["Fournisseur", produit.fournisseur],
                      ].map(([label, valeur]) => (
                        <div key={label} className="min-w-0">
                          <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            {label}
                          </dt>
                          <dd className="truncate font-medium text-foreground">{valeur}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </MobileCard>
              </button>
            );
          })}
        </div>
      )}
    </MobilePage>
  );
}
