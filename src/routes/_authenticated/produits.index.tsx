import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { Download, History, Plus, Upload } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { DeleteProductDialog } from "@/components/products/delete-product-dialog";
import { ProductFormDialog } from "@/components/products/product-form-dialog";
import { ProductsGrid } from "@/components/products/products-grid";
import { ProductsPagination } from "@/components/products/products-pagination";
import { ProductsEmpty, ProductsError, ProductsLoading } from "@/components/products/products-states";
import { ProductsTable } from "@/components/products/products-table";
import {
  FILTRES_INITIAUX,
  ProductsToolbar,
  type Filtres,
} from "@/components/products/products-toolbar";
import type { ProductActions } from "@/components/products/product-actions";
import {
  ajouterProduit,
  dupliquerProduit,
  modifierProduit,
  supprimerProduit,
  useProductsStore,
} from "@/lib/products/store";
import {
  expirationProche,
  formatFCFA,
  statutProduit,
  type Produit,
  type ProduitFormValues,
} from "@/lib/products/types";

const TITLE = "Produits";
const DESCRIPTION = "Gérez facilement tous vos produits.";
const PAR_PAGE = 8;

export const Route = createFileRoute("/_authenticated/produits/")({
  head: () => ({
    meta: [
      { title: "Produits — Bekaye Sora Business Manager" },
      {
        name: "description",
        content:
          "Catalogue des produits cosmétiques 501 : stock, prix, alertes de rupture et fiches détaillées.",
      },
      { property: "og:title", content: "Produits — Bekaye Sora Business Manager" },
      {
        property: "og:description",
        content: "Gérez facilement tous vos produits cosmétiques 501 : stock, prix et alertes.",
      },
    ],
  }),
  component: ProduitsPage,
});

function ProduitsPage() {
  const { produits } = useProductsStore();
  const [filtres, setFiltres] = useState<Filtres>(FILTRES_INITIAUX);
  const [vue, setVue] = useState<"tableau" | "cartes">("tableau");
  const [page, setPage] = useState(1);
  const [etatChargement, setEtatChargement] = useState<"pret" | "chargement" | "erreur">("pret");

  const [formOuvert, setFormOuvert] = useState(false);
  const [produitEdite, setProduitEdite] = useState<Produit | null>(null);
  const [aSupprimer, setASupprimer] = useState<Produit | null>(null);

  const resultats = useMemo(() => {
    const q = filtres.recherche.trim().toLowerCase();
    return produits.filter((produit) => {
      const correspond =
        !q ||
        [produit.nom, produit.codeBarres, produit.categorie, produit.marque]
          .join(" ")
          .toLowerCase()
          .includes(q);
      if (!correspond) return false;
      if (filtres.categorie !== "toutes" && produit.categorie !== filtres.categorie) return false;
      if (filtres.marque !== "toutes" && produit.marque !== filtres.marque) return false;

      const statut = statutProduit(produit);
      switch (filtres.etat) {
        case "faible":
          return statut === "faible";
        case "rupture":
          return statut === "rupture";
        case "expiration":
          return expirationProche(produit);
        case "actifs":
          return produit.actif;
        case "desactives":
          return !produit.actif;
        default:
          return true;
      }
    });
  }, [produits, filtres]);

  const totalPages = Math.max(1, Math.ceil(resultats.length / PAR_PAGE));
  const pageCourante = Math.min(page, totalPages);
  const affiches = resultats.slice((pageCourante - 1) * PAR_PAGE, pageCourante * PAR_PAGE);

  const valeurStock = produits.reduce((acc, p) => acc + p.prixVente * p.stock, 0);

  const majFiltres = (next: Filtres) => {
    setFiltres(next);
    setPage(1);
  };

  const actions: ProductActions = {
    onEdit: (produit) => {
      setProduitEdite(produit);
      setFormOuvert(true);
    },
    onDuplicate: (produit) => {
      const copie = dupliquerProduit(produit.id);
      if (copie) toast.success("Produit dupliqué.", { description: copie.nom });
    },
    onDelete: (produit) => setASupprimer(produit),
  };

  const handleSubmit = (values: ProduitFormValues) => {
    if (produitEdite) {
      modifierProduit(produitEdite.id, values);
      toast.success("Produit modifié.", { description: values.nom });
    } else {
      ajouterProduit(values);
      toast.success("Produit ajouté avec succès.", { description: values.nom });
    }
    setProduitEdite(null);
  };

  const handleExport = () => {
    const entetes = [
      "Nom",
      "Marque",
      "Catégorie",
      "Code-barres",
      "Prix achat",
      "Prix vente",
      "Stock",
      "Stock minimum",
      "Statut",
    ];
    const lignes = resultats.map((p) =>
      [
        p.nom,
        p.marque,
        p.categorie,
        p.codeBarres,
        p.prixAchat,
        p.prixVente,
        p.stock,
        p.stockMinimum,
        statutProduit(p),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(";"),
    );
    const csv = [entetes.join(";"), ...lignes].join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = "produits-501.csv";
    lien.click();
    URL.revokeObjectURL(url);
    toast.success("Export terminé.", { description: `${resultats.length} produits exportés.` });
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        eyebrow="Catalogue"
        title={TITLE}
        description={DESCRIPTION}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() =>
                toast.info("Importer des produits", {
                  description: "L'import de fichier Excel/CSV sera disponible prochainement.",
                })
              }
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Importer</span>
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exporter</span>
            </Button>
            <Button
              className="gap-2"
              onClick={() => {
                setProduitEdite(null);
                setFormOuvert(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Ajouter un produit
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Produits au catalogue" value={String(produits.length)} />
        <Stat
          label="Stock faible"
          value={String(produits.filter((p) => statutProduit(p) === "faible").length)}
          tone="warning"
        />
        <Stat
          label="En rupture"
          value={String(produits.filter((p) => statutProduit(p) === "rupture").length)}
          tone="danger"
        />
        <Stat label="Valeur du stock" value={formatFCFA(valeurStock)} />
      </div>

      <ProductsToolbar
        filtres={filtres}
        onChange={majFiltres}
        vue={vue}
        onVueChange={setVue}
        onScan={() =>
          toast.info("Scanner un code-barres", {
            description: "Le lecteur de code-barres et la caméra seront connectés prochainement.",
          })
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {resultats.length} produit{resultats.length > 1 ? "s" : ""} trouvé
          {resultats.length > 1 ? "s" : ""}
        </p>
        <Link
          to="/produits/mouvements"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-opacity hover:opacity-70"
        >
          <History className="h-3.5 w-3.5" />
          Historique des mouvements
        </Link>
      </div>

      {etatChargement === "chargement" ? (
        <ProductsLoading />
      ) : etatChargement === "erreur" ? (
        <ProductsError onRetry={() => setEtatChargement("pret")} />
      ) : affiches.length === 0 ? (
        <ProductsEmpty
          filtre={resultats.length === 0 && produits.length > 0}
          onAdd={() => {
            setProduitEdite(null);
            setFormOuvert(true);
          }}
        />
      ) : vue === "tableau" ? (
        <ProductsTable produits={affiches} actions={actions} />
      ) : (
        <ProductsGrid produits={affiches} actions={actions} />
      )}

      {affiches.length > 0 && etatChargement === "pret" && (
        <ProductsPagination
          page={pageCourante}
          totalPages={totalPages}
          total={resultats.length}
          onPageChange={setPage}
        />
      )}

      <ProductFormDialog
        open={formOuvert}
        onOpenChange={(open) => {
          setFormOuvert(open);
          if (!open) setProduitEdite(null);
        }}
        produit={produitEdite}
        onSubmit={handleSubmit}
      />

      <DeleteProductDialog
        open={aSupprimer !== null}
        onOpenChange={(open) => !open && setASupprimer(null)}
        produitNom={aSupprimer?.nom}
        onConfirm={() => {
          if (!aSupprimer) return;
          supprimerProduit(aSupprimer.id);
          toast.success("Produit supprimé.", { description: aSupprimer.nom });
          setASupprimer(null);
        }}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "warning" | "danger";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-card)]">
      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p
        className={
          tone === "danger"
            ? "mt-1 font-display text-xl font-semibold text-primary"
            : tone === "warning"
              ? "mt-1 font-display text-xl font-semibold text-amber-600"
              : "mt-1 font-display text-xl font-semibold text-foreground"
        }
      >
        {value}
      </p>
    </div>
  );
}
