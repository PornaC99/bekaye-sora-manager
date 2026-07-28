import { useEffect, useState } from "react";

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
import type { Client, ClientFormValues, Sexe } from "@/lib/clients/types";

const VIDE: ClientFormValues = {
  nom: "",
  telephone: "",
  whatsapp: "",
  email: "",
  adresse: "",
  ville: "Bamako",
  sexe: "non_precise",
  dateNaissance: null,
  dateInscription: new Date().toISOString(),
  notes: "",
  photo: null,
  dette: 0,
};

const toInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSubmit: (values: ClientFormValues) => void;
}) {
  const [values, setValues] = useState<ClientFormValues>(VIDE);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (!open) return;
    setErreur("");
    setValues(
      client
        ? {
            nom: client.nom,
            telephone: client.telephone,
            whatsapp: client.whatsapp,
            email: client.email,
            adresse: client.adresse,
            ville: client.ville,
            sexe: client.sexe,
            dateNaissance: client.dateNaissance,
            dateInscription: client.dateInscription,
            notes: client.notes,
            photo: client.photo,
            dette: client.dette,
          }
        : { ...VIDE, dateInscription: new Date().toISOString() },
    );
  }, [open, client]);

  const set = <K extends keyof ClientFormValues>(cle: K, valeur: ClientFormValues[K]) =>
    setValues((v) => ({ ...v, [cle]: valeur }));

  function valider() {
    if (values.nom.trim().length < 2) {
      setErreur("Le nom du client est obligatoire.");
      return;
    }
    if (!values.telephone.trim()) {
      setErreur("Le numéro de téléphone est obligatoire.");
      return;
    }
    onSubmit({
      ...values,
      nom: values.nom.trim().slice(0, 80),
      telephone: values.telephone.trim().slice(0, 30),
      whatsapp: (values.whatsapp || values.telephone).trim().slice(0, 30),
      email: values.email.trim().slice(0, 120),
      adresse: values.adresse.trim().slice(0, 160),
      ville: values.ville.trim().slice(0, 60),
      notes: values.notes.trim().slice(0, 500),
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{client ? "Modifier le client" : "Nouveau client"}</DialogTitle>
          <DialogDescription>
            Renseignez les informations du client. Seuls le nom et le téléphone sont obligatoires.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="cl-nom">Nom complet *</Label>
            <Input
              id="cl-nom"
              value={values.nom}
              maxLength={80}
              onChange={(e) => set("nom", e.target.value)}
              placeholder="Ex. Mariam Cissé"
            />
          </div>
          <div>
            <Label htmlFor="cl-tel">Téléphone *</Label>
            <Input
              id="cl-tel"
              value={values.telephone}
              maxLength={30}
              onChange={(e) => set("telephone", e.target.value)}
              placeholder="+223 ..."
            />
          </div>
          <div>
            <Label htmlFor="cl-wa">WhatsApp</Label>
            <Input
              id="cl-wa"
              value={values.whatsapp}
              maxLength={30}
              onChange={(e) => set("whatsapp", e.target.value)}
              placeholder="Identique au téléphone si vide"
            />
          </div>
          <div>
            <Label htmlFor="cl-email">Email</Label>
            <Input
              id="cl-email"
              type="email"
              value={values.email}
              maxLength={120}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="cl-ville">Ville</Label>
            <Input
              id="cl-ville"
              value={values.ville}
              maxLength={60}
              onChange={(e) => set("ville", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="cl-adresse">Adresse</Label>
            <Input
              id="cl-adresse"
              value={values.adresse}
              maxLength={160}
              onChange={(e) => set("adresse", e.target.value)}
            />
          </div>
          <div>
            <Label>Sexe</Label>
            <Select value={values.sexe} onValueChange={(v) => set("sexe", v as Sexe)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="F">Femme</SelectItem>
                <SelectItem value="H">Homme</SelectItem>
                <SelectItem value="non_precise">Non précisé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="cl-naissance">Date de naissance</Label>
            <Input
              id="cl-naissance"
              type="date"
              value={toInput(values.dateNaissance)}
              onChange={(e) =>
                set(
                  "dateNaissance",
                  e.target.value ? new Date(`${e.target.value}T12:00:00`).toISOString() : null,
                )
              }
            />
          </div>
          <div>
            <Label htmlFor="cl-dette">Dette en cours (FCFA)</Label>
            <Input
              id="cl-dette"
              type="number"
              min={0}
              value={values.dette}
              onChange={(e) => set("dette", Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
          <div>
            <Label htmlFor="cl-photo">Photo (lien)</Label>
            <Input
              id="cl-photo"
              value={values.photo ?? ""}
              onChange={(e) => set("photo", e.target.value.trim() || null)}
              placeholder="https://..."
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="cl-notes">Notes</Label>
            <Textarea
              id="cl-notes"
              rows={3}
              maxLength={500}
              value={values.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Préférences, habitudes, informations utiles…"
            />
          </div>
        </div>

        {erreur && <p className="text-sm font-medium text-destructive">{erreur}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={valider}>{client ? "Enregistrer" : "Ajouter le client"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
