import { Check } from "lucide-react";

import { Input } from "@/components/ui/input";
import { ProductThumb } from "@/components/products/product-thumb";
import { EcartBadge } from "@/components/inventory/status-badge";
import { formatFCFA } from "@/lib/products/types";
import {
  ecartLigne,
  statutLigne,
  valeurEcartLigne,
  type LigneInventaire,
} from "@/lib/inventory/types";
import { cn } from "@/lib/utils";

export type SaisieProps = {
  lignes: LigneInventaire[];
  lectureSeule?: boolean;
  onSaisir: (ligneId: string, valeur: number | null) => void;
};

const parseSaisie = (valeur: string) => {
  if (valeur.trim() === "") return null;
  const n = Number(valeur);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
};

function EcartCell({ ligne }: { ligne: LigneInventaire }) {
  if (ligne.stockPhysique === null) return <span className="text-muted-foreground">—</span>;
  const ecart = ecartLigne(ligne);
  return (
    <span
      className={cn(
        "font-semibold",
        ecart === 0 ? "text-success" : ecart > 0 ? "text-amber-600" : "text-primary",
      )}
    >
      {ecart > 0 ? "+" : ""}
      {ecart}
    </span>
  );
}

/** Vue tableau (desktop / tablette). */
export function CountTable({ lignes, lectureSeule, onSaisir }: SaisieProps) {
  if (lignes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
        Aucun produit ne correspond à votre recherche.
      </div>
    );
  }

  return (
    <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] md:block">
      <div className="overflow-x-auto scrollbar-slim">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Produit</th>
              <th className="px-4 py-3 font-semibold">Code-barres</th>
              <th className="px-4 py-3 text-right font-semibold">Stock théorique</th>
              <th className="px-4 py-3 text-right font-semibold">Stock physique</th>
              <th className="px-4 py-3 text-right font-semibold">Écart</th>
              <th className="px-4 py-3 text-right font-semibold">Valeur de l'écart</th>
              <th className="px-4 py-3 font-semibold">Statut</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((ligne) => (
              <tr
                key={ligne.id}
                className="border-b border-border/70 last:border-0 hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <ProductThumb src={ligne.image} alt={ligne.nom} className="h-9 w-9" />
                    <span className="font-medium text-foreground">{ligne.nom}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{ligne.codeBarres}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {ligne.stockTheorique}
                </td>
                <td className="px-4 py-3 text-right">
                  {lectureSeule ? (
                    <span className="font-semibold text-foreground">
                      {ligne.stockPhysique ?? "—"}
                    </span>
                  ) : (
                    <Input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      className="ml-auto h-9 w-24 text-right"
                      value={ligne.stockPhysique ?? ""}
                      placeholder="—"
                      onChange={(e) => onSaisir(ligne.id, parseSaisie(e.target.value))}
                    />
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <EcartCell ligne={ligne} />
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {ligne.stockPhysique === null ? "—" : formatFCFA(valeurEcartLigne(ligne))}
                </td>
                <td className="px-4 py-3">
                  {ligne.stockPhysique === null ? (
                    <span className="text-xs text-muted-foreground">Non compté</span>
                  ) : (
                    <EcartBadge statut={statutLigne(ligne)} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Vue cartes optimisée mobile : photo, nom, saisie et validation. */
export function CountCards({ lignes, lectureSeule, onSaisir }: SaisieProps) {
  return (
    <div className="grid gap-3 md:hidden">
      {lignes.map((ligne) => (
        <article
          key={ligne.id}
          className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
        >
          <div className="flex items-start gap-3">
            <ProductThumb src={ligne.image} alt={ligne.nom} className="h-14 w-14" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{ligne.nom}</p>
              <p className="text-xs text-muted-foreground">{ligne.codeBarres}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Stock théorique :{" "}
                <span className="font-semibold text-foreground">{ligne.stockTheorique}</span>
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              className="h-11 flex-1 text-base"
              placeholder="Stock physique"
              disabled={lectureSeule}
              value={ligne.stockPhysique ?? ""}
              onChange={(e) => onSaisir(ligne.id, parseSaisie(e.target.value))}
            />
            <button
              type="button"
              disabled={lectureSeule || ligne.stockPhysique === null}
              onClick={() => onSaisir(ligne.id, ligne.stockPhysique)}
              className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-40"
            >
              <Check className="h-4 w-4" />
              Valider
            </button>
          </div>

          {ligne.stockPhysique !== null && (
            <div className="mt-3 flex items-center justify-between">
              <EcartBadge statut={statutLigne(ligne)} />
              <span className="text-xs text-muted-foreground">
                Écart <EcartCell ligne={ligne} /> · {formatFCFA(valeurEcartLigne(ligne))}
              </span>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
