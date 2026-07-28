import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { signalerErreur } from "@/lib/db/errors";
import {
  creerCategorie,
  listerCategories,
  majCategorie,
  supprimerCategorie,
  type Categorie,
} from "@/lib/db/catalogue";
import { useProductsStore } from "@/lib/products/store";
import { formatDateCourt } from "@/lib/products/types";

const TITLE = "Catégories";
const DESCRIPTION = "Organisez vos produits par familles et gammes pour une navigation simple.";

export const Route = createFileRoute("/_authenticated/categories")({
  head: () => ({
    meta: [
      { title: `${TITLE} — Bekaye Sora Business Manager` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `${TITLE} — Bekaye Sora Business Manager` },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Page,
});

type FormValues = { nom: string; description: string; couleur: string; actif: boolean };

const VIDE: FormValues = { nom: "", description: "", couleur: "#E11D2E", actif: true };

function Page() {
  const queryClient = useQueryClient();
  const { produits } = useProductsStore();
  const [recherche, setRecherche] = useState("");
  const [edition, setEdition] = useState<Categorie | null>(null);
  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState<FormValues>(VIDE);
  const [aSupprimer, setASupprimer] = useState<Categorie | null>(null);

  const {
    data: categories = [],
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: listerCategories,
  });

  const rafraichir = () => queryClient.invalidateQueries({ queryKey: ["categories"] });

  const enregistrement = useMutation({
    mutationFn: async (values: FormValues) => {
      if (edition) {
        await majCategorie(edition.id, values);
      } else {
        await creerCategorie(values);
      }
    },
    onSuccess: async () => {
      toast.success(edition ? "Catégorie modifiée" : "Catégorie ajoutée");
      setOuvert(false);
      await rafraichir();
    },
    onError: (erreur) => signalerErreur("Enregistrement impossible", erreur),
  });

  const suppression = useMutation({
    mutationFn: supprimerCategorie,
    onSuccess: async () => {
      toast.success("Catégorie supprimée");
      setASupprimer(null);
      await rafraichir();
    },
    onError: (erreur) => signalerErreur("Suppression impossible", erreur),
  });

  const compteurs = useMemo(() => {
    const map = new Map<string, number>();
    for (const produit of produits) {
      const cle = produit.categorie.toLowerCase();
      map.set(cle, (map.get(cle) ?? 0) + 1);
    }
    return map;
  }, [produits]);

  const filtrees = categories.filter((c) =>
    `${c.nom} ${c.description}`.toLowerCase().includes(recherche.trim().toLowerCase()),
  );

  function ouvrir(categorie?: Categorie) {
    setEdition(categorie ?? null);
    setForm(
      categorie
        ? {
            nom: categorie.nom,
            description: categorie.description,
            couleur: categorie.couleur,
            actif: categorie.actif,
          }
        : VIDE,
    );
    setOuvert(true);
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5">
      <PageHeader
        eyebrow="Catalogue"
        title={TITLE}
        description={DESCRIPTION}
        actions={
          <Button onClick={() => ouvrir()}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle catégorie
          </Button>
        }
      />

      <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Rechercher une catégorie…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>

        {isPending ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement des catégories…
          </div>
        ) : isError ? (
          <p className="py-12 text-center text-sm text-destructive">{(error as Error).message}</p>
        ) : filtrees.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Aucune catégorie pour le moment. Créez la première pour classer vos produits.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Produits</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créée le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrees.map((categorie) => (
                  <TableRow key={categorie.id}>
                    <TableCell>
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: categorie.couleur }}
                        />
                        {categorie.nom}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-md truncate text-muted-foreground">
                      {categorie.description || "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {compteurs.get(categorie.nom.toLowerCase()) ?? 0}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          categorie.actif
                            ? "rounded-full bg-success/10 px-2 py-1 text-xs font-medium text-success"
                            : "rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                        }
                      >
                        {categorie.actif ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateCourt(categorie.dateCreation)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => ouvrir(categorie)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Modifier</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setASupprimer(categorie)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Supprimer</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{edition ? "Modifier la catégorie" : "Nouvelle catégorie"}</DialogTitle>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              enregistrement.mutate({ ...form, nom: form.nom.trim() });
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                required
                minLength={2}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Label htmlFor="couleur">Couleur</Label>
                <input
                  id="couleur"
                  type="color"
                  className="h-9 w-14 cursor-pointer rounded-md border border-border bg-background"
                  value={form.couleur}
                  onChange={(e) => setForm({ ...form, couleur: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="actif">Active</Label>
                <Switch
                  id="actif"
                  checked={form.actif}
                  onCheckedChange={(actif) => setForm({ ...form, actif })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOuvert(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={enregistrement.isPending}>
                {enregistrement.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!aSupprimer} onOpenChange={(o) => !o && setASupprimer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {aSupprimer?.nom} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les produits rattachés ne seront pas supprimés, mais perdront cette catégorie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => aSupprimer && suppression.mutate(aSupprimer.id)}
              disabled={suppression.isPending}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
