import { AlertTriangle, PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function ProductsLoading() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
        >
          <Skeleton className="h-11 w-11 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/5" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function ProductsEmpty({ onAdd, filtre }: { onAdd: () => void; filtre: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary-soft">
        <PackageSearch className="h-5 w-5 text-primary" />
      </span>
      <h3 className="mt-4 font-display text-base font-semibold text-foreground">
        {filtre ? "Aucun produit ne correspond" : "Aucun produit pour le moment"}
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        {filtre
          ? "Essayez un autre mot-clé ou réinitialisez les filtres pour voir tout le catalogue."
          : "Ajoutez votre premier produit pour commencer à gérer votre stock."}
      </p>
      <Button className="mt-5" onClick={onAdd}>
        Ajouter un produit
      </Button>
    </div>
  );
}

export function ProductsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-primary/25 bg-primary-soft/50 p-10 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-card">
        <AlertTriangle className="h-5 w-5 text-primary" />
      </span>
      <h3 className="mt-4 font-display text-base font-semibold text-foreground">
        Impossible d'afficher les produits
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Une erreur est survenue lors du chargement. Vérifiez votre connexion puis réessayez.
      </p>
      <Button variant="outline" className="mt-5" onClick={onRetry}>
        Réessayer
      </Button>
    </div>
  );
}
