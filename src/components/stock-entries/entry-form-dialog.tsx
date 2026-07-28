import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Plus, ScanLine, Trash2 } from "lucide-react";
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
import { FOURNISSEURS } from "@/lib/products/demo-data";
import { useProductsStore } from "@/lib/products/store";
import { formatFCFA } from "@/lib/products/types";
import { lotDejaUtilise } from "@/lib/stock/store";
import { UTILISATEURS } from "@/lib/stock/demo-entries";
import { sousTotalLigne } from "@/lib/stock/types";
import type { EntreeFormValues, EntreeStock, LigneEntree, StatutEntree } from "@/lib/stock/types";

const nouvelleLigne = (): LigneEntree => ({
  id: `L-${Date.now()}-${Math.round(Math.random() * 1000)}`,
  produitId: "",
  codeBarres: "",
  quantite: 1,
  prixAchat: 0,
  prixVente: 0,
  dateExpiration: null,
  numeroLot: "",
});

const dateInput = (iso: string) => iso.slice(0, 10);
const heureInput = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export function EntryFormDialog({
  open,
  onOpenChange,
  entree,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entree?: EntreeStock | null;
  onSubmit: (values: EntreeFormValues) => void;
}) {
  const { produits } = useProductsStore();
  const [date, setDate] = useState(dateInput(new Date().toISOString()));
  const [heure, setHeure] = useState(heureInput(new Date().toISOString()));
  const [fournisseur, setFournisseur] = useState<string>(FOURNISSEURS[0]);
  const [referenceFacture, setReferenceFacture] = useState("");
  const [bonLivraison, setBonLivraison] = useState("");
  const [observation, setObservation] = useState("");
  const [utilisateur, setUtilisateur] = useState<string>(UTILISATEURS[0]);
  const [statut, setStatut] = useState<StatutEntree>("validee");
  const [lignes, setLignes] = useState<LigneEntree[]>([nouvelleLigne()]);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErreur(null);
    if (entree) {
      setDate(dateInput(entree.date));
      setHeure(heureInput(entree.date));
      setFournisseur(entree.fournisseur);
      setReferenceFacture(entree.referenceFacture);
      setBonLivraison(entree.bonLivraison);
      setObservation(entree.observation);
      setUtilisateur(entree.utilisateur);
      setStatut(entree.statut);
      setLignes(entree.lignes.map((l) => ({ ...l })));
    } else {
      const maintenant = new Date().toISOString();
      setDate(dateInput(maintenant));
      setHeure(heureInput(maintenant));
      setFournisseur(FOURNISSEURS[0]);
      setReferenceFacture("");
      setBonLivraison("");
      setObservation("");
      setUtilisateur(UTILISATEURS[0]);
      setStatut("validee");
      setLignes([nouvelleLigne()]);
    }
  }, [open, entree]);

  const majLigne = (id: string, patch: Partial<LigneEntree>) =>
    setLignes((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const choisirProduit = (id: string, produitId: string) => {
    const produit = produits.find((p) => p.id === produitId);
    majLigne(id, {
      produitId,
      codeBarres: produit?.codeBarres ?? "",
      prixAchat: produit?.prixAchat ?? 0,
      prixVente: produit?.prixVente ?? 0,
    });
  };

  const total = useMemo(() => lignes.reduce((acc, l) => acc + sousTotalLigne(l), 0), [lignes]);

  const alertesLot = useMemo(
    () =>
      lignes
        .map((l) => {
          if (!l.produitId || !l.numeroLot.trim()) return null;
          const doublon = lotDejaUtilise(l.produitId, l.numeroLot, entree?.id);
          if (!doublon) return null;
          const nom = produits.find((p) => p.id === l.produitId)?.nom ?? l.produitId;
          return `${nom} : le lot ${l.numeroLot} figure déjà dans la réception ${doublon.numero}.`;
        })
        .filter(Boolean) as string[],
    [lignes, produits, entree],
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const valides = lignes.filter((l) => l.produitId && l.quantite > 0);
    if (valides.length === 0) {
      setErreur("Ajoutez au moins un produit avec une quantité supérieure à zéro.");
      return;
    }
    const iso = new Date(`${date}T${heure || "00:00"}:00`).toISOString();
    onSubmit({
      date: iso,
      fournisseur,
      referenceFacture,
      bonLivraison,
      observation,
      utilisateur,
      statut,
      lignes: valides,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto scrollbar-slim">
        <DialogHeader>
          <DialogTitle className="font-display">
            {entree ? `Modifier la réception ${entree.numero}` : "Nouvelle entrée de stock"}
          </DialogTitle>
          <DialogDescription>
            Renseignez la livraison puis ajoutez les produits reçus. Le stock est mis à jour
            automatiquement après validation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Champ label="Date">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </Champ>
            <Champ label="Heure">
              <Input
                type="time"
                value={heure}
                onChange={(e) => setHeure(e.target.value)}
                required
              />
            </Champ>
            <Champ label="Fournisseur">
              <Select value={fournisseur} onValueChange={setFournisseur}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOURNISSEURS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Champ>
            <Champ label="Référence de facture">
              <Input
                value={referenceFacture}
                onChange={(e) => setReferenceFacture(e.target.value)}
                placeholder="FAC-00000"
              />
            </Champ>
            <Champ label="Numéro du bon de livraison">
              <Input
                value={bonLivraison}
                onChange={(e) => setBonLivraison(e.target.value)}
                placeholder="BL-0000"
              />
            </Champ>
            <Champ label="Enregistré par">
              <Select value={utilisateur} onValueChange={setUtilisateur}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UTILISATEURS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Champ>
            <Champ label="Observation" className="sm:col-span-2 lg:col-span-3">
              <Textarea
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="État des colis, remarques sur la livraison…"
                rows={2}
              />
            </Champ>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-sm font-semibold text-foreground">Produits reçus</h3>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() =>
                    toast.info("Scanner un code-barres", {
                      description:
                        "Le lecteur de code-barres sera connecté prochainement pour ajouter un produit instantanément.",
                    })
                  }
                >
                  <ScanLine className="h-4 w-4" />
                  Scanner
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setLignes((ls) => [...ls, nouvelleLigne()])}
                >
                  <Plus className="h-4 w-4" />
                  Ajouter une ligne
                </Button>
              </div>
            </div>

            {lignes.map((ligne, index) => (
              <div
                key={ligne.id}
                className="grid gap-3 rounded-xl border border-border bg-muted/30 p-3 sm:grid-cols-2 lg:grid-cols-4"
              >
                <Champ label={`Produit ${index + 1}`} className="lg:col-span-2">
                  <Select
                    value={ligne.produitId}
                    onValueChange={(v) => choisirProduit(ligne.id, v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {produits.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Champ>
                <Champ label="Code-barres">
                  <Input
                    value={ligne.codeBarres}
                    onChange={(e) => majLigne(ligne.id, { codeBarres: e.target.value })}
                    placeholder="6001501000000"
                  />
                </Champ>
                <Champ label="Numéro de lot">
                  <Input
                    value={ligne.numeroLot}
                    onChange={(e) => majLigne(ligne.id, { numeroLot: e.target.value })}
                    placeholder="LOT-501-000"
                  />
                </Champ>
                <Champ label="Quantité reçue">
                  <Input
                    type="number"
                    min={0}
                    value={ligne.quantite}
                    onChange={(e) => majLigne(ligne.id, { quantite: Number(e.target.value) })}
                  />
                </Champ>
                <Champ label="Prix d'achat">
                  <Input
                    type="number"
                    min={0}
                    value={ligne.prixAchat}
                    onChange={(e) => majLigne(ligne.id, { prixAchat: Number(e.target.value) })}
                  />
                </Champ>
                <Champ label="Prix de vente conseillé">
                  <Input
                    type="number"
                    min={0}
                    value={ligne.prixVente}
                    onChange={(e) => majLigne(ligne.id, { prixVente: Number(e.target.value) })}
                  />
                </Champ>
                <Champ label="Date d'expiration (facultative)">
                  <Input
                    type="date"
                    value={ligne.dateExpiration ? ligne.dateExpiration.slice(0, 10) : ""}
                    onChange={(e) =>
                      majLigne(ligne.id, {
                        dateExpiration: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : null,
                      })
                    }
                  />
                </Champ>
                <div className="flex items-end justify-between gap-3 sm:col-span-2 lg:col-span-4">
                  <p className="text-sm text-muted-foreground">
                    Sous-total :{" "}
                    <span className="font-semibold text-foreground">
                      {formatFCFA(sousTotalLigne(ligne))}
                    </span>
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-primary hover:text-primary"
                    onClick={() =>
                      setLignes((ls) =>
                        ls.length === 1 ? [nouvelleLigne()] : ls.filter((l) => l.id !== ligne.id),
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer la ligne
                  </Button>
                </div>
              </div>
            ))}
          </section>

          {alertesLot.length > 0 && (
            <div className="flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Vérification des numéros de lot</p>
                <ul className="mt-1 list-disc pl-4">
                  {alertesLot.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {erreur && <p className="text-sm font-medium text-primary">{erreur}</p>}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Statut</span>
              <Select value={statut} onValueChange={(v) => setStatut(v as StatutEntree)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="validee">Validée</SelectItem>
                  <SelectItem value="brouillon">Brouillon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Montant total :{" "}
              <span className="font-display text-lg font-semibold text-foreground">
                {formatFCFA(total)}
              </span>
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">
              {entree ? "Enregistrer les modifications" : "Enregistrer l'entrée"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Champ({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
