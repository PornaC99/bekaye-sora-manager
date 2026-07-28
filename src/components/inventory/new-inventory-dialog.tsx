import { useState } from "react";

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
import { MAGASINS, RESPONSABLES, type InventaireFormValues } from "@/lib/inventory/types";

const aujourdhui = () => new Date().toISOString().slice(0, 10);

export function NewInventoryDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: InventaireFormValues) => void;
}) {
  const [nom, setNom] = useState("");
  const [date, setDate] = useState(aujourdhui());
  const [responsable, setResponsable] = useState<string>(RESPONSABLES[0]);
  const [magasin, setMagasin] = useState<string>(MAGASINS[0]);
  const [observation, setObservation] = useState("");

  const reinitialiser = () => {
    setNom("");
    setDate(aujourdhui());
    setResponsable(RESPONSABLES[0]);
    setMagasin(MAGASINS[0]);
    setObservation("");
  };

  const valider = () => {
    onSubmit({
      nom: nom.trim() || `Inventaire du ${new Date(date).toLocaleDateString("fr-FR")}`,
      date: new Date(`${date}T09:00:00`).toISOString(),
      responsable,
      magasin,
      observation: observation.trim(),
    });
    reinitialiser();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Démarrer un nouvel inventaire</DialogTitle>
          <DialogDescription>
            Renseignez ces quelques informations, puis comptez vos produits un par un.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="inv-nom">Nom de l'inventaire</Label>
            <Input
              id="inv-nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Inventaire mensuel — Juillet"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="inv-date">Date</Label>
              <Input
                id="inv-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Responsable</Label>
              <Select value={responsable} onValueChange={setResponsable}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESPONSABLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Magasin concerné</Label>
            <Select value={magasin} onValueChange={setMagasin}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MAGASINS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="inv-obs">Observation</Label>
            <Textarea
              id="inv-obs"
              rows={3}
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Précisez le contexte du comptage (facultatif)."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={valider}>Démarrer l'inventaire</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
