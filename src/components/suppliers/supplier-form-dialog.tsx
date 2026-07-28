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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Fournisseur, FournisseurFormValues } from "@/lib/suppliers/types";

const VIDE: FournisseurFormValues = {
  nom: "",
  entreprise: "",
  telephone: "",
  whatsapp: "",
  email: "",
  adresse: "",
  ville: "Bamako",
  pays: "Mali",
  contactPrincipal: "",
  conditionsPaiement: "Paiement comptant",
  delaiLivraisonJours: 7,
  notes: "",
  logo: null,
  favori: false,
  actif: true,
};

export function SupplierFormDialog({
  open,
  onOpenChange,
  fournisseur,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fournisseur?: Fournisseur | null;
  onSubmit: (values: FournisseurFormValues) => void;
}) {
  const [values, setValues] = useState<FournisseurFormValues>(VIDE);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (!open) return;
    setErreur("");
    if (fournisseur) {
      const { id: _id, dateCreation: _d, ...reste } = fournisseur;
      setValues(reste);
    } else {
      setValues(VIDE);
    }
  }, [open, fournisseur]);

  const set = <K extends keyof FournisseurFormValues>(cle: K, valeur: FournisseurFormValues[K]) =>
    setValues((v) => ({ ...v, [cle]: valeur }));

  function valider() {
    if (values.nom.trim().length < 2) {
      setErreur("Le nom du fournisseur est obligatoire.");
      return;
    }
    if (!values.telephone.trim()) {
      setErreur("Le numéro de téléphone est obligatoire.");
      return;
    }
    onSubmit({
      ...values,
      nom: values.nom.trim().slice(0, 80),
      entreprise: (values.entreprise || values.nom).trim().slice(0, 100),
      telephone: values.telephone.trim().slice(0, 30),
      whatsapp: (values.whatsapp || values.telephone).trim().slice(0, 30),
      email: values.email.trim().slice(0, 120),
      adresse: values.adresse.trim().slice(0, 160),
      ville: values.ville.trim().slice(0, 60),
      pays: values.pays.trim().slice(0, 60),
      contactPrincipal: values.contactPrincipal.trim().slice(0, 80),
      conditionsPaiement: values.conditionsPaiement.trim().slice(0, 120),
      delaiLivraisonJours: Math.max(0, Math.min(180, Number(values.delaiLivraisonJours) || 0)),
      notes: values.notes.trim().slice(0, 500),
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {fournisseur ? "Modifier le fournisseur" : "Nouveau fournisseur"}
          </DialogTitle>
          <DialogDescription>
            Renseignez les coordonnées du partenaire. Seuls le nom et le téléphone sont
            obligatoires.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="fo-nom">Nom *</Label>
            <Input
              id="fo-nom"
              value={values.nom}
              maxLength={80}
              onChange={(e) => set("nom", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="fo-entreprise">Entreprise</Label>
            <Input
              id="fo-entreprise"
              value={values.entreprise}
              maxLength={100}
              onChange={(e) => set("entreprise", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="fo-tel">Téléphone *</Label>
            <Input
              id="fo-tel"
              value={values.telephone}
              maxLength={30}
              onChange={(e) => set("telephone", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="fo-wa">WhatsApp</Label>
            <Input
              id="fo-wa"
              value={values.whatsapp}
              maxLength={30}
              onChange={(e) => set("whatsapp", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="fo-email">Email</Label>
            <Input
              id="fo-email"
              type="email"
              value={values.email}
              maxLength={120}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="fo-contact">Contact principal</Label>
            <Input
              id="fo-contact"
              value={values.contactPrincipal}
              maxLength={80}
              onChange={(e) => set("contactPrincipal", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="fo-adresse">Adresse</Label>
            <Input
              id="fo-adresse"
              value={values.adresse}
              maxLength={160}
              onChange={(e) => set("adresse", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="fo-ville">Ville</Label>
            <Input
              id="fo-ville"
              value={values.ville}
              maxLength={60}
              onChange={(e) => set("ville", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="fo-pays">Pays</Label>
            <Input
              id="fo-pays"
              value={values.pays}
              maxLength={60}
              onChange={(e) => set("pays", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="fo-cond">Conditions de paiement</Label>
            <Input
              id="fo-cond"
              value={values.conditionsPaiement}
              maxLength={120}
              onChange={(e) => set("conditionsPaiement", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="fo-delai">Délai de livraison (jours)</Label>
            <Input
              id="fo-delai"
              type="number"
              min={0}
              max={180}
              value={values.delaiLivraisonJours}
              onChange={(e) => set("delaiLivraisonJours", Number(e.target.value))}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="fo-notes">Notes</Label>
            <Textarea
              id="fo-notes"
              rows={3}
              value={values.notes}
              maxLength={500}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Fournisseur favori</p>
              <p className="text-xs text-muted-foreground">Mis en avant dans les filtres.</p>
            </div>
            <Switch checked={values.favori} onCheckedChange={(v) => set("favori", v)} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Fournisseur actif</p>
              <p className="text-xs text-muted-foreground">Disponible pour les commandes.</p>
            </div>
            <Switch checked={values.actif} onCheckedChange={(v) => set("actif", v)} />
          </div>
        </div>

        {erreur && <p className="text-sm font-medium text-destructive">{erreur}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={valider}>
            {fournisseur ? "Enregistrer" : "Ajouter le fournisseur"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
