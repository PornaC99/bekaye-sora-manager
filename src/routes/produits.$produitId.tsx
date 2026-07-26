import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Copy, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/dashboard/section-card";
import { DeleteProductDialog } from "@/components/products/delete-product-dialog";
import { ProductFormDialog } from "@/components/products/product-form-dialog";
import { ProductThumb } from "@/components/products/product-thumb";
import { StatusBadge } from "@/components/products/status-badge";
import {
  dupliquerProduit,
  modifierProduit,
  supprimerProduit,
  useProductsStore,
} from "@/lib/products/store";
import {
  formatDate,
  formatDateCourt,
  formatFCFA,
  formatHeure,
  margeBeneficiaire,
  statutProduit,
  type ProduitFormValues,
} from "@/lib/products/types";

export const Route = createFileRoute("/produits/$produitId")({
  head: () => ({
    meta: [
      { title: "Fiche produit — Bekaye Sora Business Manager" },
      {
        name: "description",
        content:
          "Fiche détaillée d'un produit 501 : prix, marge, stock, mouvements, ventes et achats.",
      },
      { property: "og:title", content: "Fiche produit — Bekaye Sora Business Manager" },
      {
        property: "og:description",
        content: "Prix, marge, stock et historiques complets du produit sélectionné.",
      },
    ],
  }),
  component: ProduitDetail,
});

function ProduitDetail() {
  const { produitId } = Route.useParams();
  const navigate = useNavigate();
  const { produits, mouvements, ventes, achats } = useProductsStore();
  const produit = produits.find((p) => p.id === produitId) ?? null;

  const [formOuvert, setFormOuvert] = useState(false);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);

  if (!produit) {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <h1 className="font-display text-lg font-semibold">Produit introuvable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ce produit a peut-être été supprimé du catalogue.
        </p>
        <Button className="mt-5" onClick={() => navigate({ to: "/produits" })}>
          Retour aux produits
        </Button>
      </div>
    );
  }

  const marge = margeBeneficiaire(produit);
  const mouvementsProduit = mouvements.filter((m) => m.produitId === produit.id);
  const ventesProduit = ventes.filter((v) => v.produitId === produit.id);
  const achatsProduit = achats.filter((a) => a.produitId === produit.id);

  const handleSubmit = (values: ProduitFormValues) => {
    modifierProduit(produit.id, values);
    toast.success("Produit modifié.", { description: values.nom });
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Link
        to="/produits"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour aux produits
      </Link>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <ProductThumb
            src={produit.image}
            alt={produit.nom}
            className="aspect-square w-full rounded-2xl"
            iconClassName="h-8 w-8"
          />
          <div className="flex flex-col gap-2">
            <Button className="gap-2" onClick={() => setFormOuvert(true)}>
              <Pencil className="h-4 w-4" />
              Modifier
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  const copie = dupliquerProduit(produit.id);
                  if (copie) {
                    toast.success("Produit dupliqué.", { description: copie.nom });
                    navigate({ to: "/produits/$produitId", params: { produitId: copie.id } });
                  }
                }}
              >
                <Copy className="h-4 w-4" />
                Dupliquer
              </Button>
              <Button
                variant="outline"
                className="gap-2 text-primary hover:text-primary"
                onClick={() => setSuppressionOuverte(true)}
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  {produit.marque} · {produit.categorie}
                </p>
                <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">
                  {produit.nom}
                </h1>
              </div>
              <StatusBadge statut={statutProduit(produit)} />
            </div>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{produit.description}</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Prix d'achat" value={formatFCFA(produit.prixAchat)} />
              <Info label="Prix de vente" value={formatFCFA(produit.prixVente)} accent />
              <Info label="Marge bénéficiaire" value={`${marge.toFixed(1)} %`} />
              <Info label="Quantité disponible" value={`${produit.stock} ${produit.unite}`} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SectionCard title="Informations produit" description="Références et logistique">
              <dl className="grid gap-3 text-sm">
                <Ligne label="Code-barres" value={produit.codeBarres || "—"} mono />
                <Ligne label="Unité" value={produit.unite} />
                <Ligne label="Stock minimum" value={String(produit.stockMinimum)} />
                <Ligne label="Fournisseur" value={produit.fournisseur} />
                <Ligne label="Date d'expiration" value={formatDate(produit.dateExpiration)} />
              </dl>
            </SectionCard>

            <SectionCard title="Suivi" description="Traçabilité de la fiche">
              <dl className="grid gap-3 text-sm">
                <Ligne label="Référence interne" value={produit.id} mono />
                <Ligne label="Date d'ajout" value={formatDate(produit.dateAjout)} />
                <Ligne label="Dernière modification" value={formatDate(produit.dateModification)} />
                <Ligne label="Statut de vente" value={produit.actif ? "Actif" : "Désactivé"} />
              </dl>
            </SectionCard>
          </div>
        </div>
      </div>

      <SectionCard
        title="Historique des mouvements"
        description="Entrées et sorties de ce produit"
        bodyClassName="p-0 sm:p-0"
      >
        {mouvementsProduit.length === 0 ? (
          <Vide texte="Aucun mouvement enregistré pour ce produit." />
        ) : (
          <ul className="divide-y divide-border">
            {mouvementsProduit.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{m.observation}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateCourt(m.date)} à {formatHeure(m.date)} · {m.utilisateur}
                  </p>
                </div>
                <span
                  className={
                    m.type === "entree"
                      ? "rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success"
                      : "rounded-full border border-primary/30 bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary"
                  }
                >
                  {m.type === "entree" ? "+" : "−"}
                  {m.quantite} {m.type === "entree" ? "Entrée" : "Sortie"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Historique des ventes"
          description="Dernières sorties commerciales"
          bodyClassName="p-0 sm:p-0"
        >
          {ventesProduit.length === 0 ? (
            <Vide texte="Aucune vente enregistrée." />
          ) : (
            <ul className="divide-y divide-border">
              {ventesProduit.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{v.tiers}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.reference} · {formatDateCourt(v.date)} · {v.quantite} unités
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-foreground">
                    {formatFCFA(v.montant)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Historique des achats"
          description="Réceptions fournisseurs"
          bodyClassName="p-0 sm:p-0"
        >
          {achatsProduit.length === 0 ? (
            <Vide texte="Aucun achat enregistré." />
          ) : (
            <ul className="divide-y divide-border">
              {achatsProduit.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{a.tiers}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.reference} · {formatDateCourt(a.date)} · {a.quantite} unités
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-foreground">
                    {formatFCFA(a.montant)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <ProductFormDialog
        open={formOuvert}
        onOpenChange={setFormOuvert}
        produit={produit}
        onSubmit={handleSubmit}
      />

      <DeleteProductDialog
        open={suppressionOuverte}
        onOpenChange={setSuppressionOuverte}
        produitNom={produit.nom}
        onConfirm={() => {
          supprimerProduit(produit.id);
          toast.success("Produit supprimé.", { description: produit.nom });
          navigate({ to: "/produits" });
        }}
      />
    </div>
  );
}

function Info({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p
        className={
          accent
            ? "mt-1 font-display text-lg font-semibold text-primary"
            : "mt-1 font-display text-lg font-semibold text-foreground"
        }
      >
        {value}
      </p>
    </div>
  );
}

function Ligne({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono text-xs text-foreground" : "text-sm text-foreground"}>
        {value}
      </dd>
    </div>
  );
}

function Vide({ texte }: { texte: string }) {
  return <p className="px-5 py-6 text-center text-sm text-muted-foreground">{texte}</p>;
}
