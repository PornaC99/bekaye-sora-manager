import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  creerSortie,
  listerLots,
  listerMagasins,
  listerProduitsDisponibles,
  MOTIFS_SORTIE,
} from "@/lib/db/sorties";
import { formatFCFA } from "@/lib/products/types";

export function ExitFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const { data: produits = [] } = useQuery({
    queryKey: ["produits-sortie"],
    queryFn: listerProduitsDisponibles,
    enabled: open,
  });
  const { data: magasins = [] } = useQuery({
    queryKey: ["magasins"],
    queryFn: listerMagasins,
    enabled: open,
  });

  const [produitId, setProduitId] = useState("");
  const [quantite, setQuantite] = useState("1");
  const [motif, setMotif] = useState<string>(MOTIFS_SORTIE[0].value);
  const [magasinId, setMagasinId] = useState("aucun");
  const [lot, setLot] = useState("aucun");
  const [reference, setReference] = useState("");
  const [commentaire, setCommentaire] = useState("");

  useEffect(() => {
    if (!open) return;
    setProduitId("");
    setQuantite("1");
    setMotif(MOTIFS_SORTIE[0].value);
    setMagasinId("aucun");
    setLot("aucun");
    setReference("");
    setCommentaire("");
  }, [open]);

  const { data: lots = [] } = useQuery({
    queryKey: ["lots", produitId],
    queryFn: () => listerLots(produitId),
    enabled: open && !!produitId,
  });

  const produit = useMemo(() => produits.find((p) => p.id === produitId), [produits, produitId]);
  const quantiteNum = Number(quantite);
  const stockRestant = produit ? produit.stock - (Number.isFinite(quantiteNum) ? quantiteNum : 0) : null;
  const insuffisant = produit ? quantiteNum > produit.stock : false;
  const valeur = produit ? produit.cump * (Number.isFinite(quantiteNum) ? quantiteNum : 0) : 0;

  const mutation = useMutation({
    mutationFn: creerSortie,
    onSuccess: async () => {
      toast.success("Sortie de stock enregistrée.");
      onOpenChange(false);
      await queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const valide = !!produitId && quantiteNum > 0 && !insuffisant && !!motif;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvelle sortie de stock</DialogTitle>
          <DialogDescription>
            Le stock est décrémenté immédiatement et l'opération est tracée dans le journal d'audit.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Produit</Label>
            <Select value={produitId} onValueChange={setProduitId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un produit" />
              </SelectTrigger>
              <SelectContent>
                {produits.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nom} — {p.stock} {p.unite}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="quantite">Quantité</Label>
              <Input
                id="quantite"
                type="number"
                min={1}
                inputMode="numeric"
                value={quantite}
                onChange={(e) => setQuantite(e.target.value)}
              />
              {produit && (
                <p
                  className={
                    insuffisant
                      ? "text-xs font-medium text-destructive"
                      : "text-xs text-muted-foreground"
                  }
                >
                  {insuffisant
                    ? `Stock insuffisant : ${produit.stock} ${produit.unite} disponible(s).`
                    : `Stock après sortie : ${stockRestant} ${produit.unite}`}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Motif</Label>
              <Select value={motif} onValueChange={setMotif}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOTIFS_SORTIE.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Magasin</Label>
              <Select value={magasinId} onValueChange={setMagasinId}>
                <SelectTrigger>
                  <SelectValue placeholder="Magasin principal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aucun">Magasin principal</SelectItem>
                  {magasins.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Lot (optionnel)</Label>
              <Select value={lot} onValueChange={setLot} disabled={lots.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder="Automatique (péremption la plus proche)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aucun">Automatique (FEFO)</SelectItem>
                  {lots.map((l) => (
                    <SelectItem key={l.id} value={l.lot}>
                      {l.lot} — {l.quantiteRestante} restant(s)
                      {l.dateExpiration ? ` · exp. ${l.dateExpiration}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="reference">Référence (bon, vente, transfert…)</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              maxLength={60}
              placeholder="Ex. BON-2026-014"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="commentaire">Commentaire</Label>
            <Textarea
              id="commentaire"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Précisez le contexte de cette sortie…"
            />
          </div>

          {produit && (
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Valeur estimée de la sortie</span>
                <strong className="text-foreground">{formatFCFA(valeur)}</strong>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            disabled={!valide || mutation.isPending}
            onClick={() =>
              mutation.mutate({
                produitId,
                quantite: quantiteNum,
                motif,
                magasinId: magasinId === "aucun" ? null : magasinId,
                lot: lot === "aucun" ? null : lot,
                reference,
                commentaire,
              })
            }
          >
            {mutation.isPending ? "Enregistrement…" : "Valider la sortie"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
