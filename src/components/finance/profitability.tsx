import { ArrowDown, ArrowUp } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import { formatFCFA } from "@/lib/products/types";
import type { RentabiliteProduit } from "@/lib/finance/analytics";
import { cn } from "@/lib/utils";

function ListeProduits({
  titre,
  description,
  produits,
  ton,
}: {
  titre: string;
  description: string;
  produits: RentabiliteProduit[];
  ton: "success" | "danger";
}) {
  return (
    <SectionCard title={titre} description={description}>
      {produits.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Pas encore assez de ventes pour analyser la rentabilité.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {produits.map((produit, index) => (
            <li
              key={produit.produitId}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border px-3 py-2.5"
            >
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-semibold",
                  ton === "success"
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive",
                )}
              >
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{produit.nom}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {produit.quantite} vendus · CA {formatFCFA(produit.chiffreAffaires)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    produit.benefice >= 0 ? "text-success" : "text-destructive",
                  )}
                >
                  {formatFCFA(produit.benefice)}
                </p>
                <p className="text-xs text-muted-foreground">Marge {produit.marge} %</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

export function TopProfitableProducts({ produits }: { produits: RentabiliteProduit[] }) {
  return (
    <ListeProduits
      titre="Produits les plus rentables"
      description="Classement par bénéfice généré"
      produits={produits.slice(0, 6)}
      ton="success"
    />
  );
}

export function LeastProfitableProducts({ produits }: { produits: RentabiliteProduit[] }) {
  return (
    <ListeProduits
      titre="Produits les moins rentables"
      description="À surveiller ou repositionner"
      produits={[...produits].reverse().slice(0, 6)}
      ton="danger"
    />
  );
}

export function ProfitableCategories({
  categories,
}: {
  categories: { categorie: string; chiffreAffaires: number; benefice: number; marge: number }[];
}) {
  const maximum = Math.max(1, ...categories.map((c) => c.benefice));

  return (
    <SectionCard
      title="Catégories les plus rentables"
      description="Bénéfice généré par famille de produits"
    >
      {categories.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Aucune donnée de rentabilité disponible.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {categories.map((categorie) => (
            <li key={categorie.categorie}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{categorie.categorie}</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatFCFA(categorie.benefice)}
                </p>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.max(2, (categorie.benefice / maximum) * 100)}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                CA {formatFCFA(categorie.chiffreAffaires)} · marge {categorie.marge} %
              </p>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

export function MarginCards({ brute, nette }: { brute: number; nette: number }) {
  const cartes = [
    {
      label: "Marge brute",
      value: brute,
      hint: "Chiffre d'affaires moins le coût d'achat des produits vendus",
    },
    {
      label: "Marge nette",
      value: nette,
      hint: "Ce qu'il reste réellement après toutes les dépenses",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cartes.map((carte) => (
        <div
          key={carte.label}
          className="rounded-2xl border border-border bg-card px-5 py-4 shadow-[var(--shadow-card)]"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {carte.label}
            </p>
            <span
              className={cn(
                "grid h-8 w-8 place-items-center rounded-lg",
                carte.value >= 0
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              {carte.value >= 0 ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
            </span>
          </div>
          <p className="mt-1 font-display text-2xl font-semibold text-foreground">
            {carte.value} %
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{carte.hint}</p>
        </div>
      ))}
    </div>
  );
}
