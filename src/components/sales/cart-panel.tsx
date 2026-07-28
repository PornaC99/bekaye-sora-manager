import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatFCFA } from "@/lib/products/types";
import type { LigneVente } from "@/lib/sales/types";

export type PanierEtat = {
  lignes: LigneVente[];
  remise: number;
  tvaActive: boolean;
  client: string;
  telephoneClient: string;
  vendeur: string;
};

export function CartPanel({
  etat,
  totaux,
  vendeurs,
  onQuantite,
  onRetirer,
  onVider,
  onChange,
  onValider,
}: {
  etat: PanierEtat;
  totaux: { sousTotal: number; tva: number; total: number };
  vendeurs: readonly string[];
  onQuantite: (ligneId: string, quantite: number) => void;
  onRetirer: (ligneId: string) => void;
  onVider: () => void;
  onChange: (patch: Partial<PanierEtat>) => void;
  onValider: () => void;
}) {
  const vide = etat.lignes.length === 0;

  return (
    <aside className="flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] xl:sticky xl:top-24">
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary">
            <ShoppingCart className="h-4 w-4" />
          </span>
          <div>
            <p className="font-display text-sm font-semibold text-foreground">Panier</p>
            <p className="text-xs text-muted-foreground">
              {etat.lignes.reduce((t, l) => t + l.quantite, 0)} article(s)
            </p>
          </div>
        </div>
        {!vide && (
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onVider}>
            Vider
          </Button>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-slim px-4 py-3">
        {vide ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Ajoutez des produits pour démarrer la vente.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {etat.lignes.map((ligne) => (
              <li key={ligne.id} className="rounded-xl border border-border bg-background p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{ligne.nom}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFCFA(ligne.prixUnitaire)} / unité
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={() => onRetirer(ligne.id)}
                    aria-label={`Retirer ${ligne.nom}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onQuantite(ligne.id, ligne.quantite - 1)}
                      aria-label="Diminuer la quantité"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <Input
                      value={ligne.quantite}
                      onChange={(e) => onQuantite(ligne.id, Number(e.target.value) || 0)}
                      inputMode="numeric"
                      className="h-7 w-14 text-center"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onQuantite(ligne.id, ligne.quantite + 1)}
                      aria-label="Augmenter la quantité"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="font-display text-sm font-semibold text-foreground">
                    {formatFCFA(ligne.prixUnitaire * ligne.quantite)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <Label className="text-xs text-muted-foreground">Client</Label>
            <Input
              value={etat.client}
              onChange={(e) => onChange({ client: e.target.value })}
              placeholder="Client comptoir"
              className="h-9"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Vendeur</Label>
            <select
              value={etat.vendeur}
              onChange={(e) => onChange({ vendeur: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {vendeurs.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div>
            <Label className="text-xs text-muted-foreground">Remise (FCFA)</Label>
            <Input
              value={etat.remise || ""}
              onChange={(e) => onChange({ remise: Number(e.target.value) || 0 })}
              inputMode="numeric"
              placeholder="0"
              className="h-9"
            />
          </div>
          <div className="flex items-end justify-between gap-2 rounded-md border border-border px-3 py-1.5">
            <Label htmlFor="tva" className="text-xs text-muted-foreground">
              TVA 18 %
            </Label>
            <Switch
              id="tva"
              checked={etat.tvaActive}
              onCheckedChange={(v) => onChange({ tvaActive: v })}
            />
          </div>
        </div>

        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <dt>Sous-total</dt>
            <dd>{formatFCFA(totaux.sousTotal)}</dd>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <dt>Remise</dt>
            <dd>- {formatFCFA(etat.remise)}</dd>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <dt>TVA</dt>
            <dd>{formatFCFA(totaux.tva)}</dd>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2">
            <dt className="text-sm font-semibold text-foreground">Total</dt>
            <dd className="font-display text-xl font-semibold text-primary">
              {formatFCFA(totaux.total)}
            </dd>
          </div>
        </dl>

        <Button className="mt-3 h-11 w-full text-base" disabled={vide} onClick={onValider}>
          Valider la vente
        </Button>
      </div>
    </aside>
  );
}
