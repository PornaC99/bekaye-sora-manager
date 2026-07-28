import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, History, Package, Plus, Search, Truck, Wallet } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EntriesTable } from "@/components/stock-entries/entries-table";
import { EntryFormDialog } from "@/components/stock-entries/entry-form-dialog";
import { SummaryCards } from "@/components/stock-entries/summary-cards";
import { FOURNISSEURS } from "@/lib/products/demo-data";
import { useProductsStore } from "@/lib/products/store";
import { formatDateCourt, formatFCFA, formatHeure } from "@/lib/products/types";
import { imprimerEntree } from "@/lib/stock/print";
import { ajouterEntree, modifierEntree, supprimerEntree, useEntreesStore } from "@/lib/stock/store";
import { memeJour, montantEntree, quantiteEntree } from "@/lib/stock/types";
import type { EntreeFormValues, EntreeStock } from "@/lib/stock/types";

const TITLE = "Entrées de Stock";
const DESCRIPTION = "Enregistrez facilement toutes les livraisons de produits.";

export const Route = createFileRoute("/_authenticated/entrees-stock/")({
  head: () => ({
    meta: [
      { title: "Entrées de stock — Bekaye Sora Business Manager" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Entrées de stock — Bekaye Sora Business Manager" },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: EntreesStockPage,
});

function EntreesStockPage() {
  const { entrees } = useEntreesStore();
  const { produits } = useProductsStore();
  const [recherche, setRecherche] = useState("");
  const [fournisseur, setFournisseur] = useState("tous");
  const [formOuvert, setFormOuvert] = useState(false);
  const [entreeEditee, setEntreeEditee] = useState<EntreeStock | null>(null);
  const [aSupprimer, setASupprimer] = useState<EntreeStock | null>(null);

  const nomProduit = (id: string) => produits.find((p) => p.id === id)?.nom ?? id;

  const resultats = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return entrees
      .filter((e) => (fournisseur === "tous" ? true : e.fournisseur === fournisseur))
      .filter((e) => {
        if (!q) return true;
        const champs = [
          e.numero,
          e.fournisseur,
          e.referenceFacture,
          e.bonLivraison,
          e.utilisateur,
          ...e.lignes.map((l) => `${nomProduit(l.produitId)} ${l.codeBarres} ${l.numeroLot}`),
        ];
        return champs.join(" ").toLowerCase().includes(q);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entrees, produits, recherche, fournisseur]);

  const validees = entrees.filter((e) => e.statut === "validee");
  const aujourdhui = validees.filter((e) => memeJour(e.date));
  const derniere = [...entrees].sort((a, b) => b.date.localeCompare(a.date))[0];

  const handleSubmit = (values: EntreeFormValues) => {
    if (entreeEditee) {
      modifierEntree(entreeEditee.id, values);
      toast.success("Entrée de stock mise à jour.", {
        description: "Le stock des produits a été recalculé automatiquement.",
      });
    } else {
      const creee = ajouterEntree(values);
      toast.success("Entrée de stock enregistrée.", {
        description:
          values.statut === "validee"
            ? `Stock mis à jour · ${creee.numero} · ${formatFCFA(montantEntree(creee))}`
            : `Brouillon ${creee.numero} enregistré, le stock n'est pas encore modifié.`,
      });
    }
    setEntreeEditee(null);
  };

  const handlePrint = (entree: EntreeStock) => {
    const ok = imprimerEntree(entree, produits);
    if (!ok) {
      toast.error("Impression bloquée", {
        description: "Autorisez les fenêtres pop-up pour imprimer le bon d'entrée.",
      });
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        eyebrow="Stock"
        title={TITLE}
        description={DESCRIPTION}
        actions={
          <Button
            className="gap-2"
            onClick={() => {
              setEntreeEditee(null);
              setFormOuvert(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nouvelle entrée de stock
          </Button>
        }
      />

      <SummaryCards
        cartes={[
          {
            label: "Livraisons aujourd'hui",
            value: String(aujourdhui.length),
            icon: Package,
            tone: "primary",
          },
          {
            label: "Quantité totale reçue",
            value: String(validees.reduce((acc, e) => acc + quantiteEntree(e), 0)),
            hint: "Toutes réceptions validées",
            icon: Package,
          },
          {
            label: "Valeur totale des achats",
            value: formatFCFA(validees.reduce((acc, e) => acc + montantEntree(e), 0)),
            icon: Wallet,
          },
          {
            label: "Fournisseurs",
            value: String(new Set(entrees.map((e) => e.fournisseur)).size),
            hint: "Partenaires livrant la boutique",
            icon: Truck,
          },
          {
            label: "Dernière livraison",
            value: derniere ? formatDateCourt(derniere.date) : "—",
            hint: derniere ? `${derniere.fournisseur} · ${formatHeure(derniere.date)}` : undefined,
            icon: CalendarClock,
          },
        ]}
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un produit, un code-barres, un fournisseur ou une facture…"
            className="h-11 rounded-xl pl-9"
            aria-label="Rechercher une entrée de stock"
          />
        </div>
        <Select value={fournisseur} onValueChange={setFournisseur}>
          <SelectTrigger className="h-11 rounded-xl sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les fournisseurs</SelectItem>
            {FOURNISSEURS.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {resultats.length} réception{resultats.length > 1 ? "s" : ""} trouvée
          {resultats.length > 1 ? "s" : ""}
        </p>
        <Link
          to="/entrees-stock/historique"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-opacity hover:opacity-70"
        >
          <History className="h-3.5 w-3.5" />
          Historique des entrées
        </Link>
      </div>

      {resultats.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Aucune entrée de stock ne correspond à votre recherche.
          </p>
          <Button
            className="mt-4 gap-2"
            onClick={() => {
              setEntreeEditee(null);
              setFormOuvert(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nouvelle entrée de stock
          </Button>
        </div>
      ) : (
        <EntriesTable
          entrees={resultats}
          actions={{
            onEdit: (entree) => {
              setEntreeEditee(entree);
              setFormOuvert(true);
            },
            onPrint: handlePrint,
            onDelete: (entree) => setASupprimer(entree),
          }}
        />
      )}

      <EntryFormDialog
        open={formOuvert}
        onOpenChange={(open) => {
          setFormOuvert(open);
          if (!open) setEntreeEditee(null);
        }}
        entree={entreeEditee}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={aSupprimer !== null} onOpenChange={(open) => !open && setASupprimer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette entrée de stock ?</AlertDialogTitle>
            <AlertDialogDescription>
              La réception {aSupprimer?.numero} sera supprimée et les quantités reçues seront
              retirées du stock des produits concernés. Cette action est définitive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!aSupprimer) return;
                supprimerEntree(aSupprimer.id);
                toast.success("Entrée de stock supprimée.", {
                  description: `${aSupprimer.numero} · stock mis à jour.`,
                });
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
