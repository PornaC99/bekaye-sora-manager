import { useEffect, useState } from "react";
import { ImagePlus, ScanLine } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ProductThumb } from "@/components/products/product-thumb";
import { CATEGORIES, FOURNISSEURS, MARQUES } from "@/lib/products/demo-data";
import { UNITES, formatFCFA, type Produit, type ProduitFormValues } from "@/lib/products/types";

const EMPTY: ProduitFormValues = {
  nom: "",
  description: "",
  marque: MARQUES[0],
  categorie: CATEGORIES[0],
  codeBarres: "",
  unite: UNITES[0],
  prixAchat: 0,
  prixVente: 0,
  stock: 0,
  stockMinimum: 5,
  dateExpiration: null,
  fournisseur: FOURNISSEURS[0],
  actif: true,
  image: null,
};

function toValues(produit: Produit): ProduitFormValues {
  const { id: _id, dateAjout: _a, dateModification: _m, ...rest } = produit;
  return rest;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  produit,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produit?: Produit | null;
  onSubmit: (values: ProduitFormValues) => void;
}) {
  const mode = produit ? "edition" : "creation";
  const [values, setValues] = useState<ProduitFormValues>(EMPTY);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setValues(produit ? toValues(produit) : EMPTY);
    setErreurs({});
  }, [open, produit]);

  const set = <K extends keyof ProduitFormValues>(key: K, value: ProduitFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const marge = values.prixAchat > 0 ? values.prixVente - values.prixAchat : 0;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!values.nom.trim()) next.nom = "Le nom du produit est obligatoire.";
    if (values.prixVente <= 0) next.prixVente = "Indiquez un prix de vente.";
    if (values.prixAchat < 0 || values.stock < 0 || values.stockMinimum < 0)
      next.prix = "Les valeurs ne peuvent pas être négatives.";
    setErreurs(next);
    if (Object.keys(next).length > 0) {
      toast.error("Veuillez compléter les champs obligatoires.");
      return;
    }
    onSubmit({ ...values, nom: values.nom.trim() });
    onOpenChange(false);
  };

  const handlePhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("image", String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-border px-5 py-4 text-left sm:px-6">
          <DialogTitle className="font-display text-lg">
            {mode === "creation" ? "Ajouter un produit" : "Modifier le produit"}
          </DialogTitle>
          <DialogDescription>
            {mode === "creation"
              ? "Renseignez les informations principales, vous pourrez les compléter plus tard."
              : "Les informations sont pré-remplies, modifiez ce dont vous avez besoin."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 px-5 py-5 sm:px-6">
            {/* Photo */}
            <div className="flex flex-wrap items-center gap-4">
              <ProductThumb
                src={values.image}
                alt={values.nom || "Nouveau produit"}
                className="h-20 w-20"
                iconClassName="h-6 w-6"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Label
                  htmlFor="photo-produit"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold transition-colors hover:bg-muted"
                >
                  <ImagePlus className="h-4 w-4" />
                  Choisir une photo
                </Label>
                <input
                  id="photo-produit"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handlePhoto}
                />
                {values.image && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => set("image", null)}
                  >
                    Retirer
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom du produit" required error={erreurs.nom} className="sm:col-span-2">
                <Input
                  value={values.nom}
                  onChange={(e) => set("nom", e.target.value)}
                  placeholder="Ex. Lotion Éclaircissante 501"
                />
              </Field>

              <Field label="Description" className="sm:col-span-2">
                <Textarea
                  value={values.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Contenance, bénéfices, conseils d'utilisation..."
                  rows={3}
                />
              </Field>

              <Field label="Marque">
                <Choix
                  value={values.marque}
                  onChange={(v) => set("marque", v)}
                  options={[...MARQUES]}
                />
              </Field>

              <Field label="Catégorie">
                <Choix
                  value={values.categorie}
                  onChange={(v) => set("categorie", v)}
                  options={[...CATEGORIES]}
                />
              </Field>

              <Field label="Code-barres">
                <div className="flex gap-2">
                  <Input
                    value={values.codeBarres}
                    onChange={(e) => set("codeBarres", e.target.value)}
                    placeholder="6001501000017"
                    inputMode="numeric"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Scanner un code-barres"
                    onClick={() =>
                      toast.info("Scanner un code-barres", {
                        description:
                          "La connexion au lecteur ou à la caméra sera activée prochainement.",
                      })
                    }
                  >
                    <ScanLine className="h-4 w-4" />
                  </Button>
                </div>
              </Field>

              <Field label="Unité">
                <Choix
                  value={values.unite}
                  onChange={(v) => set("unite", v)}
                  options={[...UNITES]}
                />
              </Field>

              <Field label="Prix d'achat (FCFA)">
                <Input
                  type="number"
                  min={0}
                  value={values.prixAchat}
                  onChange={(e) => set("prixAchat", Number(e.target.value))}
                />
              </Field>

              <Field label="Prix de vente (FCFA)" required error={erreurs.prixVente}>
                <Input
                  type="number"
                  min={0}
                  value={values.prixVente}
                  onChange={(e) => set("prixVente", Number(e.target.value))}
                />
              </Field>

              <Field label="Stock initial">
                <Input
                  type="number"
                  min={0}
                  value={values.stock}
                  onChange={(e) => set("stock", Number(e.target.value))}
                />
              </Field>

              <Field label="Stock minimum (alerte)">
                <Input
                  type="number"
                  min={0}
                  value={values.stockMinimum}
                  onChange={(e) => set("stockMinimum", Number(e.target.value))}
                />
              </Field>

              <Field label="Date d'expiration (facultative)">
                <Input
                  type="date"
                  value={values.dateExpiration ? values.dateExpiration.slice(0, 10) : ""}
                  onChange={(e) =>
                    set(
                      "dateExpiration",
                      e.target.value ? new Date(e.target.value).toISOString() : null,
                    )
                  }
                />
              </Field>

              <Field label="Fournisseur">
                <Choix
                  value={values.fournisseur}
                  onChange={(v) => set("fournisseur", v)}
                  options={[...FOURNISSEURS]}
                />
              </Field>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
              <div className="flex items-center gap-3">
                <Switch
                  id="produit-actif"
                  checked={values.actif}
                  onCheckedChange={(v) => set("actif", v)}
                />
                <Label htmlFor="produit-actif" className="text-sm">
                  Produit actif (visible en caisse)
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Marge unitaire :{" "}
                <span className="font-semibold text-foreground">{formatFCFA(marge)}</span>
              </p>
            </div>
            {erreurs.prix && <p className="text-xs text-primary">{erreurs.prix}</p>}
          </div>

          <DialogFooter className="gap-2 border-t border-border px-5 py-4 sm:px-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Enregistrer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  error,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs font-semibold text-foreground">
        {label}
        {required && <span className="text-primary"> *</span>}
      </Label>
      {children}
      {error && <p className="mt-1 text-xs text-primary">{error}</p>}
    </div>
  );
}

function Choix({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
