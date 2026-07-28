import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

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
import type { Produit } from "@/lib/products/types";
import {
  MODES_PAIEMENT_ACHAT,
  montantCommande,
  remiseCommande,
  sousTotalCommande,
  STATUTS_COMMANDE,
  STATUT_COMMANDE_LABEL,
  totalLigneCommande,
  type CommandeAchat,
  type CommandeFormValues,
  type Fournisseur,
  type LigneCommande,
} from "@/lib/suppliers/types";

const toInput = (iso: string) => iso.slice(0, 10);
const fromInput = (valeur: string) => new Date(`${valeur}T09:00:00`).toISOString();

const ligneVide = (): LigneCommande => ({
  produitId: "",
  nom: "",
  quantite: 1,
  prixAchat: 0,
  remise: 0,
});

export function OrderFormDialog({
  open,
  onOpenChange,
  commande,
  fournisseurs,
  produits,
  responsable,
  fournisseurParDefaut,
  lignesInitiales,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commande?: CommandeAchat | null;
  fournisseurs: Fournisseur[];
  produits: Produit[];
  responsable: string;
  fournisseurParDefaut?: string;
  lignesInitiales?: LigneCommande[];
  onSubmit: (values: CommandeFormValues) => void;
}) {
  const [values, setValues] = useState<CommandeFormValues>(() => defaut());
  const [erreur, setErreur] = useState("");

  function defaut(): CommandeFormValues {
    const now = new Date();
    return {
      fournisseurId: fournisseurParDefaut ?? fournisseurs[0]?.id ?? "",
      date: now.toISOString(),
      dateLivraisonPrevue: new Date(now.getTime() + 7 * 86_400_000).toISOString(),
      modePaiement: MODES_PAIEMENT_ACHAT[0],
      observation: "",
      responsable,
      statut: "brouillon",
      lignes: lignesInitiales?.length ? lignesInitiales : [ligneVide()],
    };
  }

  useEffect(() => {
    if (!open) return;
    setErreur("");
    setValues(
      commande
        ? {
            fournisseurId: commande.fournisseurId,
            date: commande.date,
            dateLivraisonPrevue: commande.dateLivraisonPrevue,
            modePaiement: commande.modePaiement,
            observation: commande.observation,
            responsable: commande.responsable,
            statut: commande.statut,
            lignes: commande.lignes.map((l) => ({ ...l })),
          }
        : defaut(),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, commande]);

  const set = <K extends keyof CommandeFormValues>(cle: K, valeur: CommandeFormValues[K]) =>
    setValues((v) => ({ ...v, [cle]: valeur }));

  const fournisseur = fournisseurs.find((f) => f.id === values.fournisseurId) ?? null;

  const produitsFiltres = useMemo(
    () =>
      fournisseur
        ? [
            ...produits.filter((p) => p.fournisseur === fournisseur.nom),
            ...produits.filter((p) => p.fournisseur !== fournisseur.nom),
          ]
        : produits,
    [produits, fournisseur],
  );

  function majLigne(index: number, patch: Partial<LigneCommande>) {
    setValues((v) => ({
      ...v,
      lignes: v.lignes.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    }));
  }

  function choisirProduit(index: number, produitId: string) {
    const produit = produits.find((p) => p.id === produitId);
    majLigne(index, {
      produitId,
      nom: produit?.nom ?? "",
      prixAchat: produit?.prixAchat ?? 0,
    });
  }

  function valider() {
    if (!values.fournisseurId) {
      setErreur("Choisissez un fournisseur.");
      return;
    }
    const lignes = values.lignes.filter((l) => l.produitId && l.quantite > 0);
    if (!lignes.length) {
      setErreur("Ajoutez au moins un produit avec une quantité.");
      return;
    }
    onSubmit({
      ...values,
      observation: values.observation.trim().slice(0, 500),
      lignes,
    });
    onOpenChange(false);
  }

  const apercu = { lignes: values.lignes };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{commande ? "Modifier la commande" : "Nouvelle commande d'achat"}</DialogTitle>
          <DialogDescription>
            {commande
              ? `Commande ${commande.numero}`
              : "Le numéro de commande est généré automatiquement à l'enregistrement."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Fournisseur *</Label>
            <Select
              value={values.fournisseurId}
              onValueChange={(v) => set("fournisseurId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir un fournisseur" />
              </SelectTrigger>
              <SelectContent>
                {fournisseurs.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="cmd-date">Date de la commande</Label>
            <Input
              id="cmd-date"
              type="date"
              value={toInput(values.date)}
              onChange={(e) => e.target.value && set("date", fromInput(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="cmd-livraison">Date de livraison prévue</Label>
            <Input
              id="cmd-livraison"
              type="date"
              value={toInput(values.dateLivraisonPrevue)}
              onChange={(e) =>
                e.target.value && set("dateLivraisonPrevue", fromInput(e.target.value))
              }
            />
          </div>
          <div>
            <Label>Mode de paiement</Label>
            <Select value={values.modePaiement} onValueChange={(v) => set("modePaiement", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODES_PAIEMENT_ACHAT.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="cmd-resp">Responsable</Label>
            <Input
              id="cmd-resp"
              value={values.responsable}
              maxLength={60}
              onChange={(e) => set("responsable", e.target.value)}
            />
          </div>
          <div>
            <Label>Statut</Label>
            <Select
              value={values.statut}
              onValueChange={(v) => set("statut", v as CommandeFormValues["statut"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUTS_COMMANDE.filter((s) => s !== "recue").map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUT_COMMANDE_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="cmd-obs">Observation</Label>
            <Textarea
              id="cmd-obs"
              rows={2}
              maxLength={500}
              value={values.observation}
              onChange={(e) => set("observation", e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Produits commandés</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setValues((v) => ({ ...v, lignes: [...v.lignes, ligneVide()] }))}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Ajouter une ligne
            </Button>
          </div>

          <div className="divide-y divide-border">
            {values.lignes.map((ligne, index) => (
              <div key={index} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]">
                <div>
                  <Label className="text-xs">Produit</Label>
                  <Select
                    value={ligne.produitId}
                    onValueChange={(v) => choisirProduit(index, v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {produitsFiltres.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Quantité</Label>
                  <Input
                    type="number"
                    min={1}
                    value={ligne.quantite}
                    onChange={(e) => majLigne(index, { quantite: Math.max(0, Number(e.target.value)) })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Prix d'achat</Label>
                  <Input
                    type="number"
                    min={0}
                    value={ligne.prixAchat}
                    onChange={(e) => majLigne(index, { prixAchat: Math.max(0, Number(e.target.value)) })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Remise (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={ligne.remise}
                    onChange={(e) =>
                      majLigne(index, {
                        remise: Math.max(0, Math.min(100, Number(e.target.value))),
                      })
                    }
                  />
                </div>
                <div className="flex items-end justify-between gap-2 sm:flex-col sm:items-end">
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    {formatFCFA(totalLigneCommande(ligne))}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Supprimer la ligne"
                    onClick={() =>
                      setValues((v) => ({
                        ...v,
                        lignes: v.lignes.length > 1 ? v.lignes.filter((_, i) => i !== index) : v.lignes,
                      }))
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1 border-t border-border bg-muted/30 px-4 py-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Sous-total</span>
              <span className="tabular-nums">{formatFCFA(sousTotalCommande(apercu))}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Remise</span>
              <span className="tabular-nums">− {formatFCFA(remiseCommande(apercu))}</span>
            </div>
            <div className="flex justify-between font-display text-base font-semibold text-foreground">
              <span>Montant total</span>
              <span className="tabular-nums">{formatFCFA(montantCommande(apercu))}</span>
            </div>
          </div>
        </div>

        {erreur && <p className="text-sm font-medium text-destructive">{erreur}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={valider}>{commande ? "Enregistrer" : "Créer la commande"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
