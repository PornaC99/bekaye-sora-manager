import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { toast } from "sonner";

import { SectionCard } from "@/components/dashboard/section-card";
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
import { formatFCFA } from "@/lib/products/types";
import type { ProgressionObjectif } from "@/lib/finance/analytics";
import { enregistrerObjectifs, notifierFinance } from "@/lib/finance/store";
import type { ObjectifsFinanciers } from "@/lib/finance/types";
import { cn } from "@/lib/utils";

export function GoalsPanel({
  progression,
  objectifs,
}: {
  progression: ProgressionObjectif[];
  objectifs: ObjectifsFinanciers;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [valeurs, setValeurs] = useState<ObjectifsFinanciers>(objectifs);

  useEffect(() => {
    if (ouvert) setValeurs(objectifs);
  }, [ouvert, objectifs]);

  return (
    <SectionCard
      title="Objectifs financiers"
      description="Suivi du mois en cours"
      action={
        <Button variant="outline" size="sm" className="h-8" onClick={() => setOuvert(true)}>
          <Target className="mr-1.5 h-3.5 w-3.5" />
          Définir
        </Button>
      }
    >
      <ul className="flex flex-col gap-5">
        {progression.map((objectif) => (
          <li key={objectif.cle}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{objectif.label}</p>
              <p className="text-sm text-muted-foreground">
                <span
                  className={cn(
                    "font-semibold",
                    objectif.atteint ? "text-success" : "text-foreground",
                  )}
                >
                  {formatFCFA(objectif.realise)}
                </span>{" "}
                / {formatFCFA(objectif.cible)}
              </p>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  objectif.inverse
                    ? objectif.atteint
                      ? "bg-success"
                      : "bg-destructive"
                    : objectif.atteint
                      ? "bg-success"
                      : "bg-primary",
                )}
                style={{ width: `${Math.max(2, objectif.progression)}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {objectif.progression} % · {objectif.description}
              {objectif.inverse && !objectif.atteint && " · plafond dépassé"}
            </p>
          </li>
        ))}
      </ul>

      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Définir les objectifs du mois</DialogTitle>
            <DialogDescription>
              Ces montants servent de repère pour suivre la performance de l'entreprise.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="objectif-ca">Objectif de chiffre d'affaires (FCFA)</Label>
              <Input
                id="objectif-ca"
                type="number"
                min={0}
                step={100000}
                value={valeurs.chiffreAffaires || ""}
                onChange={(e) =>
                  setValeurs((v) => ({ ...v, chiffreAffaires: Number(e.target.value) }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="objectif-benefice">Objectif de bénéfice (FCFA)</Label>
              <Input
                id="objectif-benefice"
                type="number"
                min={0}
                step={50000}
                value={valeurs.benefice || ""}
                onChange={(e) => setValeurs((v) => ({ ...v, benefice: Number(e.target.value) }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="objectif-depenses">Plafond de dépenses (FCFA)</Label>
              <Input
                id="objectif-depenses"
                type="number"
                min={0}
                step={50000}
                value={valeurs.plafondDepenses || ""}
                onChange={(e) =>
                  setValeurs((v) => ({ ...v, plafondDepenses: Number(e.target.value) }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOuvert(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                enregistrerObjectifs(valeurs);
                notifierFinance({
                  ton: "info",
                  titre: "Objectifs mis à jour",
                  message: `Nouvel objectif de chiffre d'affaires : ${formatFCFA(valeurs.chiffreAffaires)}.`,
                });
                toast.success("Objectifs financiers enregistrés.");
                setOuvert(false);
              }}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}
