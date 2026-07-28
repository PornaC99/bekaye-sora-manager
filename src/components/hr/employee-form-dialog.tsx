import { useEffect, useState } from "react";
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
import { ajouterEmploye, modifierEmploye } from "@/lib/hr/store";
import {
  DEPARTEMENTS,
  ROLES,
  STATUT_EMPLOYE_LABEL,
  type Departement,
  type Employe,
  type EmployeFormValues,
  type RoleEmploye,
  type StatutEmploye,
} from "@/lib/hr/types";

const VIDE: EmployeFormValues = {
  nom: "",
  photo: null,
  dateNaissance: "",
  sexe: "Femme",
  telephone: "",
  whatsapp: "",
  adresse: "",
  email: "",
  fonction: "",
  departement: "Ventes",
  role: "vendeur",
  dateEmbauche: new Date().toISOString().slice(0, 10),
  salaireBase: 150000,
  objectifMensuel: 1000000,
  statut: "actif",
  notes: "",
};

export function EmployeeFormDialog({
  open,
  onOpenChange,
  employe,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employe: Employe | null;
}) {
  const [values, setValues] = useState<EmployeFormValues>(VIDE);

  useEffect(() => {
    if (!open) return;
    setValues(
      employe
        ? {
            nom: employe.nom,
            photo: employe.photo,
            dateNaissance: employe.dateNaissance ?? "",
            sexe: employe.sexe,
            telephone: employe.telephone,
            whatsapp: employe.whatsapp,
            adresse: employe.adresse,
            email: employe.email,
            fonction: employe.fonction,
            departement: employe.departement,
            role: employe.role,
            dateEmbauche: employe.dateEmbauche,
            salaireBase: employe.salaireBase,
            objectifMensuel: employe.objectifMensuel,
            statut: employe.statut,
            notes: employe.notes,
          }
        : VIDE,
    );
  }, [open, employe]);

  const set = <K extends keyof EmployeFormValues>(cle: K, valeur: EmployeFormValues[K]) =>
    setValues((v) => ({ ...v, [cle]: valeur }));

  function soumettre() {
    if (!values.nom.trim() || !values.fonction.trim()) {
      toast.error("Le nom et la fonction sont obligatoires.");
      return;
    }
    if (employe) {
      modifierEmploye(employe.id, values);
      toast.success("Fiche employé mise à jour.");
    } else {
      const cree = ajouterEmploye(values);
      toast.success(`${cree.nom} a été ajouté (${cree.matricule}).`);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employe ? "Modifier l'employé" : "Nouvel employé"}</DialogTitle>
          <DialogDescription>
            Renseignez les informations personnelles, professionnelles et contractuelles.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Champ label="Nom et prénom *">
            <Input value={values.nom} onChange={(e) => set("nom", e.target.value)} />
          </Champ>
          <Champ label="Fonction *">
            <Input value={values.fonction} onChange={(e) => set("fonction", e.target.value)} />
          </Champ>
          <Champ label="Téléphone">
            <Input value={values.telephone} onChange={(e) => set("telephone", e.target.value)} />
          </Champ>
          <Champ label="WhatsApp">
            <Input value={values.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
          </Champ>
          <Champ label="Email">
            <Input
              type="email"
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Champ>
          <Champ label="Adresse">
            <Input value={values.adresse} onChange={(e) => set("adresse", e.target.value)} />
          </Champ>
          <Champ label="Date de naissance">
            <Input
              type="date"
              value={values.dateNaissance ?? ""}
              onChange={(e) => set("dateNaissance", e.target.value)}
            />
          </Champ>
          <Champ label="Sexe">
            <Select
              value={values.sexe}
              onValueChange={(v) => set("sexe", v as EmployeFormValues["sexe"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Femme">Femme</SelectItem>
                <SelectItem value="Homme">Homme</SelectItem>
              </SelectContent>
            </Select>
          </Champ>
          <Champ label="Département">
            <Select
              value={values.departement}
              onValueChange={(v) => set("departement", v as Departement)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPARTEMENTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Champ>
          <Champ label="Rôle et permissions">
            <Select value={values.role} onValueChange={(v) => set("role", v as RoleEmploye)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Champ>
          <Champ label="Date d'embauche">
            <Input
              type="date"
              value={values.dateEmbauche}
              onChange={(e) => set("dateEmbauche", e.target.value)}
            />
          </Champ>
          <Champ label="Statut">
            <Select value={values.statut} onValueChange={(v) => set("statut", v as StatutEmploye)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUT_EMPLOYE_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Champ>
          <Champ label="Salaire de base (FCFA)">
            <Input
              type="number"
              value={values.salaireBase}
              onChange={(e) => set("salaireBase", Number(e.target.value))}
            />
          </Champ>
          <Champ label="Objectif mensuel (FCFA)">
            <Input
              type="number"
              value={values.objectifMensuel}
              onChange={(e) => set("objectifMensuel", Number(e.target.value))}
            />
          </Champ>
          <div className="sm:col-span-2">
            <Champ label="Notes internes">
              <Textarea
                rows={3}
                value={values.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </Champ>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={soumettre}>{employe ? "Enregistrer" : "Ajouter l'employé"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Champ({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
