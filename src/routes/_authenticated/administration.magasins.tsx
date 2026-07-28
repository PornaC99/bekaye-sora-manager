import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminCard, Champ, Pastille } from "@/components/admin/pieces";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  ajouterMagasin,
  choisirMagasin,
  modifierMagasin,
  supprimerMagasin,
  useAdminStore,
} from "@/lib/admin/store";
import { formatFCFA } from "@/lib/products/types";
import type { MagasinFormValues } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/administration/magasins")({
  component: MagasinsPage,
});

const vide: MagasinFormValues = {
  nom: "",
  adresse: "",
  responsable: "",
  telephone: "",
  actif: true,
  employes: 0,
  valeurStock: 0,
  caisseJour: 0,
};

function MagasinsPage() {
  const { magasins, magasinActifId } = useAdminStore();
  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState<MagasinFormValues>(vide);

  const visibles =
    magasinActifId === "tous" ? magasins : magasins.filter((m) => m.id === magasinActifId);

  const totaux = visibles.reduce(
    (acc, m) => ({
      employes: acc.employes + m.employes,
      stock: acc.stock + m.valeurStock,
      caisse: acc.caisse + m.caisseJour,
    }),
    { employes: 0, stock: 0, caisse: 0 },
  );

  return (
    <div className="flex flex-col gap-5">
      <AdminCard
        titre="Multi-magasins"
        description="Consultez chaque point de vente séparément ou l'ensemble du réseau."
        actions={
          <Button
            onClick={() => {
              setForm(vide);
              setOuvert(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Créer un magasin
          </Button>
        }
      >
        <div className="mb-4 flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => choisirMagasin("tous")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition",
              magasinActifId === "tous"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70",
            )}
          >
            Tous les magasins
          </button>
          {magasins.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => choisirMagasin(m.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                magasinActifId === m.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70",
              )}
            >
              {m.nom}
            </button>
          ))}
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Employés", valeur: `${totaux.employes}` },
            { label: "Valeur du stock", valeur: formatFCFA(totaux.stock) },
            { label: "Caisse du jour", valeur: formatFCFA(totaux.caisse) },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-border bg-background p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{k.valeur}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibles.map((m) => (
            <article key={m.id} className="rounded-2xl border border-border bg-background p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft">
                    <Store className="h-4 w-4 text-primary" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{m.nom}</p>
                    <p className="text-xs text-muted-foreground">{m.adresse}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Supprimer"
                  onClick={() => {
                    supprimerMagasin(m.id);
                    toast.success("Magasin supprimé");
                  }}
                >
                  <Trash2 className="h-4 w-4 text-primary" />
                </Button>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Responsable</dt>
                  <dd className="font-medium text-foreground">{m.responsable || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Employés</dt>
                  <dd className="font-medium text-foreground">{m.employes}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Stock</dt>
                  <dd className="font-medium text-foreground">{formatFCFA(m.valeurStock)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Caisse du jour</dt>
                  <dd className="font-medium text-foreground">{formatFCFA(m.caisseJour)}</dd>
                </div>
              </dl>
              <div className="mt-3 flex items-center justify-between">
                <Pastille ton={m.actif ? "succes" : "neutre"}>
                  {m.actif ? "Ouvert" : "Fermé"}
                </Pastille>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => modifierMagasin(m.id, { actif: !m.actif })}
                >
                  {m.actif ? "Fermer" : "Rouvrir"}
                </Button>
              </div>
            </article>
          ))}
        </div>
      </AdminCard>

      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Créer un magasin</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Nom du magasin">
              <Input value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} />
            </Champ>
            <Champ label="Responsable">
              <Input
                value={form.responsable}
                onChange={(e) => setForm((f) => ({ ...f, responsable: e.target.value }))}
              />
            </Champ>
            <Champ label="Téléphone">
              <Input
                value={form.telephone}
                onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
              />
            </Champ>
            <Champ label="Nombre d'employés">
              <Input
                type="number"
                min={0}
                value={form.employes}
                onChange={(e) => setForm((f) => ({ ...f, employes: Number(e.target.value) }))}
              />
            </Champ>
            <div className="sm:col-span-2">
              <Champ label="Adresse">
                <Input
                  value={form.adresse}
                  onChange={(e) => setForm((f) => ({ ...f, adresse: e.target.value }))}
                />
              </Champ>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOuvert(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (!form.nom.trim()) {
                  toast.error("Indiquez le nom du magasin.");
                  return;
                }
                ajouterMagasin(form);
                setOuvert(false);
                toast.success("Magasin créé");
              }}
            >
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
