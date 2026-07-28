import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, Plus, ShieldCheck } from "lucide-react";
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
import { ajouterEntreprise, basculerEntreprise, useAdminStore } from "@/lib/admin/store";
import { formatDateHeure, type Entreprise } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/administration/entreprises")({
  component: EntreprisesPage,
});

const vide: Omit<Entreprise, "id" | "creeLe"> = {
  nom: "",
  logo: "",
  secteur: "",
  pays: "Burkina Faso",
  plan: "Essentiel",
  active: true,
};

const DONNEES_ISOLEES = [
  "Logo & identité",
  "Employés",
  "Produits",
  "Fournisseurs",
  "Ventes",
  "Paramètres",
  "Rapports",
  "Sauvegardes",
];

function EntreprisesPage() {
  const { entreprises, entrepriseCouranteId } = useAdminStore();
  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState(vide);

  return (
    <div className="flex flex-col gap-5">
      <AdminCard
        titre="Multi-entreprises"
        description="Gérez plusieurs entreprises depuis un seul compte, avec des données totalement isolées."
        actions={
          <Button
            onClick={() => {
              setForm(vide);
              setOuvert(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Créer une entreprise
          </Button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {entreprises.map((e) => {
            const courante = e.id === entrepriseCouranteId;
            return (
              <article
                key={e.id}
                className={cn(
                  "rounded-2xl border p-4 transition",
                  courante ? "border-primary bg-primary-soft/40" : "border-border bg-background",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-card">
                    <Building2 className="h-5 w-5 text-primary" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{e.nom}</p>
                    <p className="truncate text-xs text-muted-foreground">{e.secteur}</p>
                  </div>
                </div>
                <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <dt>Pays</dt>
                    <dd className="font-medium text-foreground">{e.pays}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Formule</dt>
                    <dd className="font-medium text-foreground">{e.plan}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Créée le</dt>
                    <dd className="font-medium text-foreground">{formatDateHeure(e.creeLe)}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex items-center justify-between">
                  <Pastille ton={e.active ? "succes" : "neutre"}>
                    {e.active ? "Active" : "Inactive"}
                  </Pastille>
                  <Button
                    variant={courante ? "ghost" : "secondary"}
                    size="sm"
                    disabled={courante}
                    onClick={() => {
                      basculerEntreprise(e.id);
                      toast.success(`Espace « ${e.nom} » activé`);
                    }}
                  >
                    {courante ? "Espace courant" : "Basculer"}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </AdminCard>

      <AdminCard
        titre="Isolation des données"
        description="Architecture multi-locataire : chaque enregistrement porte l'identifiant de son entreprise."
      >
        <div className="flex flex-wrap gap-2">
          {DONNEES_ISOLEES.map((d) => (
            <span
              key={d}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> {d}
            </span>
          ))}
        </div>
        <p className="mt-4 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
          Lors du branchement sur la base de données, chaque table portera une colonne
          <code className="mx-1 rounded bg-card px-1">entreprise_id</code>
          et des règles de sécurité au niveau des lignes (RLS) empêcheront toute lecture croisée
          entre entreprises. Prêt pour une commercialisation SaaS sous la marque NEXUSIA.
        </p>
      </AdminCard>

      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Créer une entreprise</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Nom de l'entreprise">
              <Input value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} />
            </Champ>
            <Champ label="Secteur d'activité">
              <Input
                value={form.secteur}
                onChange={(e) => setForm((f) => ({ ...f, secteur: e.target.value }))}
              />
            </Champ>
            <Champ label="Pays">
              <Input value={form.pays} onChange={(e) => setForm((f) => ({ ...f, pays: e.target.value }))} />
            </Champ>
            <Champ label="Formule">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.plan}
                onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value as Entreprise["plan"] }))}
              >
                <option value="Essentiel">Essentiel</option>
                <option value="Business">Business</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </Champ>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOuvert(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (!form.nom.trim()) {
                  toast.error("Indiquez le nom de l'entreprise.");
                  return;
                }
                ajouterEntreprise(form);
                setOuvert(false);
                toast.success("Entreprise créée avec des données isolées");
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
