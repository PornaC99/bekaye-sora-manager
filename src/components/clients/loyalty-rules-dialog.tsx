import { useState } from "react";
import { Gift, Percent, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ReglesFidelite } from "@/lib/clients/types";

/** Configuration du programme de fidélité (points, remise, cadeau). */
export function LoyaltyRulesDialog({
  open,
  onOpenChange,
  regles,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  regles: ReglesFidelite;
  onSubmit: (regles: ReglesFidelite) => void;
}) {
  const [values, setValues] = useState<ReglesFidelite>(regles);

  const set = <K extends keyof ReglesFidelite>(cle: K, valeur: ReglesFidelite[K]) =>
    setValues((v) => ({ ...v, [cle]: valeur }));

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) setValues(regles);
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Programme de fidélité</DialogTitle>
          <DialogDescription>
            Choisissez comment récompenser vos clients. Vous pouvez activer une ou plusieurs
            récompenses.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <section className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-foreground">Attribution de points</p>
              </div>
              <Switch
                checked={values.pointsActifs}
                onCheckedChange={(v) => set("pointsActifs", v)}
              />
            </div>
            {values.pointsActifs && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="fid-tranche">Pour chaque tranche de (FCFA)</Label>
                  <Input
                    id="fid-tranche"
                    type="number"
                    min={100}
                    value={values.trancheFCFA}
                    onChange={(e) => set("trancheFCFA", Math.max(100, Number(e.target.value) || 0))}
                  />
                </div>
                <div>
                  <Label htmlFor="fid-points">Points accordés</Label>
                  <Input
                    id="fid-points"
                    type="number"
                    min={1}
                    value={values.pointsParTranche}
                    onChange={(e) =>
                      set("pointsParTranche", Math.max(1, Number(e.target.value) || 1))
                    }
                  />
                </div>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-foreground">Remise fidélité</p>
              </div>
              <Switch
                checked={values.remiseActive}
                onCheckedChange={(v) => set("remiseActive", v)}
              />
            </div>
            {values.remiseActive && (
              <div className="mt-3">
                <Label htmlFor="fid-remise">Remise accordée aux clients VIP (%)</Label>
                <Input
                  id="fid-remise"
                  type="number"
                  min={0}
                  max={50}
                  value={values.remisePourcent}
                  onChange={(e) =>
                    set("remisePourcent", Math.min(50, Math.max(0, Number(e.target.value) || 0)))
                  }
                />
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-foreground">Cadeau après plusieurs achats</p>
              </div>
              <Switch
                checked={values.cadeauActif}
                onCheckedChange={(v) => set("cadeauActif", v)}
              />
            </div>
            {values.cadeauActif && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="fid-nb">Nombre d'achats</Label>
                  <Input
                    id="fid-nb"
                    type="number"
                    min={1}
                    value={values.achatsAvantCadeau}
                    onChange={(e) =>
                      set("achatsAvantCadeau", Math.max(1, Number(e.target.value) || 1))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="fid-cadeau">Cadeau offert</Label>
                  <Input
                    id="fid-cadeau"
                    maxLength={80}
                    value={values.cadeau}
                    onChange={(e) => set("cadeau", e.target.value)}
                  />
                </div>
              </div>
            )}
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              onSubmit(values);
              onOpenChange(false);
            }}
          >
            Enregistrer les règles
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
