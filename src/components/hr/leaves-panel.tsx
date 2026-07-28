import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
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
import { deciderConge, demanderConge, supprimerConge } from "@/lib/hr/store";
import {
  STATUT_CONGE_CLASSE,
  STATUT_CONGE_LABEL,
  TYPES_CONGE,
  TYPE_CONGE_LABEL,
  joursConge,
  type Conge,
  type Employe,
  type TypeConge,
} from "@/lib/hr/types";
import { cn } from "@/lib/utils";

export function LeavesPanel({ employes, conges }: { employes: Employe[]; conges: Conge[] }) {
  const [open, setOpen] = useState(false);
  const nom = (id: string) => employes.find((e) => e.id === id)?.nom ?? "Employé";

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Congés et absences</h2>
          <p className="text-sm text-muted-foreground">
            Demandes, validations et historique des absences de l'équipe.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nouvelle demande
        </Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {conges.map((conge) => (
          <article
            key={conge.id}
            className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{nom(conge.employeId)}</p>
                <p className="text-xs text-muted-foreground">
                  {TYPE_CONGE_LABEL[conge.type]} · {joursConge(conge)} jour(s)
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  STATUT_CONGE_CLASSE[conge.statut],
                )}
              >
                {STATUT_CONGE_LABEL[conge.statut]}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Du {conge.dateDebut} au {conge.dateFin}
            </p>
            {conge.motif && <p className="mt-1 text-sm text-foreground">{conge.motif}</p>}
            {conge.commentaire && (
              <p className="mt-1 text-xs text-muted-foreground">« {conge.commentaire} »</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {conge.statut === "en_attente" && (
                <>
                  <Button
                    size="sm"
                    onClick={() => {
                      deciderConge(conge.id, "approuve");
                      toast.success("Congé approuvé.");
                    }}
                  >
                    <Check className="mr-1.5 h-4 w-4" /> Approuver
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      deciderConge(conge.id, "refuse", "Demande refusée par la direction.");
                      toast.success("Congé refusé.");
                    }}
                  >
                    <X className="mr-1.5 h-4 w-4" /> Refuser
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  supprimerConge(conge.id);
                  toast.success("Demande supprimée.");
                }}
              >
                Supprimer
              </Button>
            </div>
          </article>
        ))}
      </div>

      <LeaveDialog open={open} onOpenChange={setOpen} employes={employes} />
    </section>
  );
}

function LeaveDialog({
  open,
  onOpenChange,
  employes,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employes: Employe[];
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [employeId, setEmployeId] = useState(employes[0]?.id ?? "");
  const [type, setType] = useState<TypeConge>("annuel");
  const [dateDebut, setDateDebut] = useState(today);
  const [dateFin, setDateFin] = useState(today);
  const [motif, setMotif] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle demande de congé</DialogTitle>
          <DialogDescription>
            La demande est enregistrée en attente de validation par la direction.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Employé</Label>
            <Select value={employeId} onValueChange={setEmployeId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un employé" />
              </SelectTrigger>
              <SelectContent>
                {employes.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Type de congé</Label>
            <Select value={type} onValueChange={(v) => setType(v as TypeConge)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES_CONGE.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Date de début</Label>
              <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Date de fin</Label>
              <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Motif</Label>
            <Textarea rows={3} value={motif} onChange={(e) => setMotif(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              if (!employeId) {
                toast.error("Sélectionnez un employé.");
                return;
              }
              demanderConge({ employeId, type, dateDebut, dateFin, motif });
              toast.success("Demande de congé enregistrée.");
              onOpenChange(false);
              setMotif("");
            }}
          >
            Enregistrer la demande
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
