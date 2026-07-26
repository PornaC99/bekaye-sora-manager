import { LayoutGrid, Rows3, ScanLine, Search, SlidersHorizontal, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, MARQUES } from "@/lib/products/demo-data";

export type EtatFiltre =
  | "tous"
  | "faible"
  | "rupture"
  | "expiration"
  | "actifs"
  | "desactives";

export const ETATS: { value: EtatFiltre; label: string }[] = [
  { value: "tous", label: "Tous les produits" },
  { value: "faible", label: "Stock faible" },
  { value: "rupture", label: "En rupture" },
  { value: "expiration", label: "Expiration proche" },
  { value: "actifs", label: "Produits actifs" },
  { value: "desactives", label: "Produits désactivés" },
];

export type Filtres = {
  recherche: string;
  categorie: string;
  marque: string;
  etat: EtatFiltre;
};

export const FILTRES_INITIAUX: Filtres = {
  recherche: "",
  categorie: "toutes",
  marque: "toutes",
  etat: "tous",
};

export function ProductsToolbar({
  filtres,
  onChange,
  vue,
  onVueChange,
  onScan,
}: {
  filtres: Filtres;
  onChange: (filtres: Filtres) => void;
  vue: "tableau" | "cartes";
  onVueChange: (vue: "tableau" | "cartes") => void;
  onScan: () => void;
}) {
  const actif =
    filtres.recherche !== "" ||
    filtres.categorie !== "toutes" ||
    filtres.marque !== "toutes" ||
    filtres.etat !== "tous";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filtres.recherche}
            onChange={(e) => onChange({ ...filtres, recherche: e.target.value })}
            placeholder="Rechercher un nom, un code-barres, une catégorie ou une marque…"
            className="h-11 rounded-xl pl-9 pr-9"
            aria-label="Rechercher un produit"
          />
          {filtres.recherche && (
            <button
              type="button"
              onClick={() => onChange({ ...filtres, recherche: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Effacer la recherche"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-11 gap-2 rounded-xl" onClick={onScan}>
            <ScanLine className="h-4 w-4" />
            <span className="hidden sm:inline">Scanner</span>
          </Button>
          <div className="flex h-11 items-center rounded-xl border border-border p-1">
            <ViewButton
              active={vue === "tableau"}
              onClick={() => onVueChange("tableau")}
              label="Vue tableau"
            >
              <Rows3 className="h-4 w-4" />
            </ViewButton>
            <ViewButton
              active={vue === "cartes"}
              onClick={() => onVueChange("cartes")}
              label="Vue cartes"
            >
              <LayoutGrid className="h-4 w-4" />
            </ViewButton>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="hidden items-center gap-1.5 text-xs font-semibold text-muted-foreground sm:inline-flex">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtres
        </span>

        <FiltreSelect
          value={filtres.categorie}
          onChange={(v) => onChange({ ...filtres, categorie: v })}
          placeholder="Toutes les catégories"
          options={[
            { value: "toutes", label: "Toutes les catégories" },
            ...CATEGORIES.map((c) => ({ value: c, label: c })),
          ]}
        />
        <FiltreSelect
          value={filtres.marque}
          onChange={(v) => onChange({ ...filtres, marque: v })}
          placeholder="Toutes les marques"
          options={[
            { value: "toutes", label: "Toutes les marques" },
            ...MARQUES.map((m) => ({ value: m, label: m })),
          ]}
        />
        <FiltreSelect
          value={filtres.etat}
          onChange={(v) => onChange({ ...filtres, etat: v as EtatFiltre })}
          placeholder="Tous les produits"
          options={ETATS}
        />

        {actif && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 text-xs"
            onClick={() => onChange(FILTRES_INITIAUX)}
          >
            <X className="h-3.5 w-3.5" />
            Réinitialiser
          </Button>
        )}
      </div>
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-lg transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function FiltreSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-full rounded-xl text-xs sm:w-auto sm:min-w-44">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-xs">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
