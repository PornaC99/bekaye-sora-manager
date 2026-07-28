import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  ClipboardList,
  Download,
  Search,
  Star,
  Trophy,
  Truck,
  UserPlus,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page";
import { SupplierAlertsPanel } from "@/components/suppliers/alerts-panel";
import { SuppliersKpiCards } from "@/components/suppliers/kpi-cards";
import { SupplierFormDialog } from "@/components/suppliers/supplier-form-dialog";
import { SuppliersTable } from "@/components/suppliers/suppliers-table";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProductsStore } from "@/lib/products/store";
import { formatFCFA } from "@/lib/products/types";
import {
  alertesApprovisionnement,
  kpisFournisseurs,
  produitsDuFournisseur,
  totalAchatsFournisseur,
} from "@/lib/suppliers/analytics";
import { exporterFournisseursCSV } from "@/lib/suppliers/print";
import {
  ajouterFournisseur,
  basculerFavori,
  modifierFournisseur,
  supprimerFournisseur,
  useSuppliersStore,
} from "@/lib/suppliers/store";
import type { Fournisseur, FournisseurFormValues } from "@/lib/suppliers/types";
import { cn } from "@/lib/utils";

const TITLE = "Fournisseurs";
const DESCRIPTION = "Gérez vos fournisseurs et vos commandes d'approvisionnement.";

export const Route = createFileRoute("/_authenticated/fournisseurs/")({
  head: () => ({
    meta: [
      { title: `${TITLE} — Bekaye Sora Business Manager` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `${TITLE} — Bekaye Sora Business Manager` },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FournisseursPage,
});

type Filtre = "tous" | "actifs" | "inactifs" | "favoris";

const FILTRES: { cle: Filtre; label: string }[] = [
  { cle: "tous", label: "Tous" },
  { cle: "actifs", label: "Actifs" },
  { cle: "inactifs", label: "Inactifs" },
  { cle: "favoris", label: "Fournisseurs favoris" },
];

function FournisseursPage() {
  const { fournisseurs, commandes } = useSuppliersStore();
  const { produits } = useProductsStore();

  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [formOuvert, setFormOuvert] = useState(false);
  const [edition, setEdition] = useState<Fournisseur | null>(null);
  const [aSupprimer, setASupprimer] = useState<Fournisseur | null>(null);

  const kpis = useMemo(() => kpisFournisseurs(fournisseurs, commandes), [fournisseurs, commandes]);
  const alertes = useMemo(
    () => alertesApprovisionnement(produits, fournisseurs, commandes),
    [produits, fournisseurs, commandes],
  );

  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return fournisseurs
      .filter((f) => {
        if (filtre === "actifs" && !f.actif) return false;
        if (filtre === "inactifs" && f.actif) return false;
        if (filtre === "favoris" && !f.favori) return false;
        if (!q) return true;
        return [f.nom, f.entreprise, f.telephone, f.ville, f.email, f.contactPrincipal]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort(
        (a, b) => totalAchatsFournisseur(b.id, commandes) - totalAchatsFournisseur(a.id, commandes),
      );
  }, [fournisseurs, commandes, recherche, filtre]);

  function enregistrer(values: FournisseurFormValues) {
    if (edition) {
      modifierFournisseur(edition.id, values);
      toast.success("Fournisseur mis à jour", { description: values.nom });
    } else {
      ajouterFournisseur(values);
      toast.success("Fournisseur ajouté", { description: `${values.nom} · ${values.ville}` });
    }
    setEdition(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Approvisionnement"
        title={TITLE}
        description={DESCRIPTION}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                exporterFournisseursCSV(liste, (id) => totalAchatsFournisseur(id, commandes));
                toast.success("Export Excel généré");
              }}
            >
              <Download className="mr-1.5 h-4 w-4" /> Exporter
            </Button>
            <Button
              onClick={() => {
                setEdition(null);
                setFormOuvert(true);
              }}
            >
              <UserPlus className="mr-1.5 h-4 w-4" /> Nouveau fournisseur
            </Button>
          </div>
        }
      />

      <SuppliersKpiCards
        cartes={[
          {
            label: "Total fournisseurs",
            value: String(kpis.total),
            hint: `${kpis.actifs} actif(s)`,
            icon: Truck,
            tone: "primary",
          },
          {
            label: "Fournisseurs actifs",
            value: String(kpis.actifs),
            hint: "Disponibles pour commander",
            icon: CheckCircle2,
            tone: "success",
          },
          {
            label: "Commandes en attente",
            value: String(kpis.enAttente),
            hint: `${kpis.retards} en retard`,
            icon: ClipboardList,
            tone: kpis.retards ? "danger" : "warning",
          },
          {
            label: "Commandes reçues",
            value: String(kpis.recues),
            hint: "Stock déjà mis à jour",
            icon: CheckCircle2,
            tone: "success",
          },
          {
            label: "Achats du mois",
            value: formatFCFA(kpis.achatsMois),
            hint: "Toutes commandes confondues",
            icon: Wallet,
            tone: "primary",
          },
          {
            label: "Fournisseur principal",
            value: kpis.principal?.nom ?? "—",
            hint: formatFCFA(kpis.montantPrincipal),
            icon: Trophy,
            tone: "warning",
          },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher un nom, téléphone, entreprise, ville, email…"
                className="pl-9"
                maxLength={80}
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {FILTRES.map((f) => (
                <button
                  key={f.cle}
                  type="button"
                  onClick={() => setFiltre(f.cle)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition",
                    filtre === f.cle
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <SuppliersTable
            fournisseurs={liste}
            nbProduits={(f) => produitsDuFournisseur(f, produits).length}
            totalAchats={(f) => totalAchatsFournisseur(f.id, commandes)}
            onModifier={(f) => {
              setEdition(f);
              setFormOuvert(true);
            }}
            onSupprimer={setASupprimer}
            onFavori={(f) => {
              basculerFavori(f.id);
              toast.success(f.favori ? "Retiré des favoris" : "Ajouté aux favoris", {
                description: f.nom,
                icon: <Star className="h-4 w-4" />,
              });
            }}
          />
        </div>

        <SupplierAlertsPanel alertes={alertes} />
      </div>

      <SupplierFormDialog
        open={formOuvert}
        onOpenChange={setFormOuvert}
        fournisseur={edition}
        onSubmit={enregistrer}
      />

      <AlertDialog open={!!aSupprimer} onOpenChange={(o) => !o && setASupprimer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce fournisseur ?</AlertDialogTitle>
            <AlertDialogDescription>
              {aSupprimer?.nom} et ses commandes associées seront définitivement retirés du
              répertoire. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!aSupprimer) return;
                supprimerFournisseur(aSupprimer.id);
                toast.success("Fournisseur supprimé", { description: aSupprimer.nom });
                setASupprimer(null);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
