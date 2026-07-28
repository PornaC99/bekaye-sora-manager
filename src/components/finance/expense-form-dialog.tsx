import { useEffect, useState, type ChangeEvent } from "react";
import { Paperclip, X } from "lucide-react";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatFCFA } from "@/lib/products/types";
import { ajouterDepense, modifierDepense, notifierFinance } from "@/lib/finance/store";
import {
  CATEGORIES_DEPENSE,
  MODES_PAIEMENT_DEPENSE,
  STATUT_DEPENSE_LABEL,
  jourISO,
  type CategorieDepense,
  type Depense,
  type DepenseFormValues,
  type Justificatif,
  type ModePaiementDepense,
  type StatutDepense,
} from "@/lib/finance/types";

const RESPONSABLES_PAR_DEFAUT = "Bekaye Sora";

function valeursInitiales(depense?: Depense | null): DepenseFormValues {
  return {
    date: depense?.date ?? new Date().toISOString(),
    montant: depense?.montant ?? 0,
    categorie: depense?.categorie ?? "autres",
    modePaiement: depense?.modePaiement ?? "especes",
    description: depense?.description ?? "",
    responsable: depense?.responsable ?? RESPONSABLES_PAR_DEFAUT,
    statut: depense?.statut ?? "payee",
    justificatif: depense?.justificatif ?? null,
  };
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  depense,
  responsables,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  depense?: Depense | null;
  responsables: string[];
}) {
  const [valeurs, setValeurs] = useState<DepenseFormValues>(valeursInitiales(depense));

  useEffect(() => {
    if (open) setValeurs(valeursInitiales(depense));
  }, [open, depense]);

  const majJustificatif = (event: ChangeEvent<HTMLInputElement>) => {
    const fichier = event.target.files?.[0];
    if (!fichier) return;
    if (fichier.size > 5 * 1024 * 1024) {
      toast.error("Le justificatif ne doit pas dépasser 5 Mo.");
      return;
    }
    const justificatif: Justificatif = {
      nom: fichier.name,
      type: fichier.type || "fichier",
      taille: fichier.size,
    };
    setValeurs((v) => ({ ...v, justificatif }));
  };

  const enregistrer = () => {
    if (valeurs.montant <= 0) {
      toast.error("Indiquez un montant supérieur à zéro.");
      return;
    }
    if (!valeurs.description.trim()) {
      toast.error("Ajoutez une description pour retrouver cette dépense facilement.");
      return;
    }
    if (depense) {
      modifierDepense(depense.id, valeurs);
      toast.success("Dépense mise à jour.");
    } else {
      ajouterDepense(valeurs);
      toast.success(`Dépense de ${formatFCFA(valeurs.montant)} enregistrée.`);
      notifierFinance({
        ton: "info",
        titre: "Nouvelle dépense enregistrée",
        message: `${formatFCFA(valeurs.montant)} — ${valeurs.description}`,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{depense ? "Modifier la dépense" : "Nouvelle dépense"}</DialogTitle>
          <DialogDescription>
            Chaque dépense enregistrée réduit automatiquement le bénéfice et la trésorerie.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="depense-date">Date</Label>
            <Input
              id="depense-date"
              type="date"
              value={jourISO(valeurs.date)}
              onChange={(e) =>
                setValeurs((v) => ({
                  ...v,
                  date: new Date(`${e.target.value}T10:00:00`).toISOString(),
                }))
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="depense-montant">Montant (FCFA)</Label>
            <Input
              id="depense-montant"
              type="number"
              min={0}
              step={500}
              value={valeurs.montant || ""}
              onChange={(e) => setValeurs((v) => ({ ...v, montant: Number(e.target.value) }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Catégorie</Label>
            <Select
              value={valeurs.categorie}
              onValueChange={(value) =>
                setValeurs((v) => ({ ...v, categorie: value as CategorieDepense }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES_DEPENSE.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Mode de paiement</Label>
            <Select
              value={valeurs.modePaiement}
              onValueChange={(value) =>
                setValeurs((v) => ({ ...v, modePaiement: value as ModePaiementDepense }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODES_PAIEMENT_DEPENSE.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Responsable</Label>
            <Select
              value={valeurs.responsable}
              onValueChange={(value) => setValeurs((v) => ({ ...v, responsable: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {responsables.map((nom) => (
                  <SelectItem key={nom} value={nom}>
                    {nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Statut</Label>
            <Select
              value={valeurs.statut}
              onValueChange={(value) =>
                setValeurs((v) => ({ ...v, statut: value as StatutDepense }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUT_DEPENSE_LABEL) as StatutDepense[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUT_DEPENSE_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="depense-description">Description</Label>
            <Textarea
              id="depense-description"
              rows={3}
              placeholder="Ex. Carburant du véhicule de livraison"
              value={valeurs.description}
              onChange={(e) => setValeurs((v) => ({ ...v, description: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="depense-fichier">Justificatif (photo ou PDF)</Label>
            {valeurs.justificatif ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{valeurs.justificatif.nom}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {Math.round(valeurs.justificatif.taille / 1024)} Ko
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => setValeurs((v) => ({ ...v, justificatif: null }))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Input
                id="depense-fichier"
                type="file"
                accept="image/*,application/pdf"
                onChange={majJustificatif}
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={enregistrer}>
            {depense ? "Enregistrer les modifications" : "Enregistrer la dépense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
