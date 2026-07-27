import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Pencil, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
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
import { EntryStatusBadge } from "@/components/stock-entries/entries-table";
import { EntryFormDialog } from "@/components/stock-entries/entry-form-dialog";
import { useProductsStore } from "@/lib/products/store";
import { formatDate, formatDateCourt, formatFCFA, formatHeure } from "@/lib/products/types";
import { imprimerEntree } from "@/lib/stock/print";
import { modifierEntree, supprimerEntree, useEntree } from "@/lib/stock/store";
import { montantEntree, quantiteEntree, sousTotalLigne } from "@/lib/stock/types";

export const Route = createFileRoute("/entrees-stock/$entreeId")({
  head: () => ({
    meta: [
      { title: "Détail d'une entrée de stock — Bekaye Sora Business Manager" },
      {
        name: "description",
        content: "Détail complet d'une réception fournisseur : produits, quantités et montants.",
      },
      {
        property: "og:title",
        content: "Détail d'une entrée de stock — Bekaye Sora Business Manager",
      },
      {
        property: "og:description",
        content: "Détail complet d'une réception fournisseur : produits, quantités et montants.",
      },
    ],
  }),
  component: DetailEntreePage,
});

function DetailEntreePage() {
  const { entreeId } = Route.useParams();
  const entree = useEntree(entreeId);
  const { produits } = useProductsStore();
  const navigate = useNavigate();
  const [formOuvert, setFormOuvert] = useState(false);
  const [confirmation, setConfirmation] = useState(false);

  if (!entree) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <PageHeader
          eyebrow="Stock"
          title="Réception introuvable"
          description="Cette entrée de stock n'existe plus ou a été supprimée."
        />
        <Link
          to="/entrees-stock"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux entrées de stock
        </Link>
      </div>
    );
  }

  const nomProduit = (id: string) => produits.find((p) => p.id === id)?.nom ?? id;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Link
        to="/entrees-stock"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour aux entrées de stock
      </Link>

      <PageHeader
        eyebrow="Réception"
        title={entree.numero}
        description={`${entree.fournisseur} · ${formatDate(entree.date)} à ${formatHeure(entree.date)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                const ok = imprimerEntree(entree, produits);
                if (!ok)
                  toast.error("Impression bloquée", {
                    description: "Autorisez les fenêtres pop-up pour imprimer le bon d'entrée.",
                  });
              }}
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Imprimer</span>
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setFormOuvert(true)}>
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Modifier</span>
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setConfirmation(true)}>
              <Trash2 className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">Supprimer</span>
            </Button>
          </div>
        }
      />

      <SectionCard title="Informations de la réception" description="Détails de la livraison">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Date" value={formatDate(entree.date)} />
          <Info label="Heure" value={formatHeure(entree.date)} />
          <Info label="Fournisseur" value={entree.fournisseur} />
          <Info label="Référence de facture" value={entree.referenceFacture || "—"} />
          <Info label="Bon de livraison" value={entree.bonLivraison || "—"} />
          <Info label="Enregistré par" value={entree.utilisateur} />
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Statut</p>
            <div className="mt-1">
              <EntryStatusBadge statut={entree.statut} />
            </div>
          </div>
          <Info
            label="Observation"
            value={entree.observation || "—"}
            className="sm:col-span-2"
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Produits reçus"
        description={`${entree.lignes.length} ligne(s) · ${quantiteEntree(entree)} article(s)`}
        bodyClassName="px-0 py-0"
      >
        <div className="overflow-x-auto scrollbar-slim">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Produit</th>
                <th className="px-4 py-3 font-semibold">Code-barres</th>
                <th className="px-4 py-3 font-semibold">Lot</th>
                <th className="px-4 py-3 font-semibold">Expiration</th>
                <th className="px-4 py-3 text-right font-semibold">Quantité</th>
                <th className="px-4 py-3 text-right font-semibold">Prix d'achat</th>
                <th className="px-4 py-3 text-right font-semibold">Prix de vente</th>
                <th className="px-5 py-3 text-right font-semibold">Sous-total</th>
              </tr>
            </thead>
            <tbody>
              {entree.lignes.map((ligne) => (
                <tr key={ligne.id} className="border-b border-border/70 last:border-0">
                  <td className="px-5 py-3">
                    <Link
                      to="/produits/$produitId"
                      params={{ produitId: ligne.produitId }}
                      className="font-medium text-foreground transition-colors hover:text-primary"
                    >
                      {nomProduit(ligne.produitId)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{ligne.codeBarres || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{ligne.numeroLot || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateCourt(ligne.dateExpiration)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">
                    +{ligne.quantite}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatFCFA(ligne.prixAchat)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatFCFA(ligne.prixVente)}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-foreground">
                    {formatFCFA(sousTotalLigne(ligne))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/40">
                <td colSpan={7} className="px-5 py-3 text-right text-sm text-muted-foreground">
                  Montant total
                </td>
                <td className="px-5 py-3 text-right font-display text-lg font-semibold text-foreground">
                  {formatFCFA(montantEntree(entree))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Historique des modifications"
        description="Traçabilité des actions sur cette réception"
      >
        <ol className="flex flex-col gap-3">
          {[...entree.historique].reverse().map((evenement) => (
            <li key={evenement.id} className="flex gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">{evenement.action}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(evenement.date)} à {formatHeure(evenement.date)} ·{" "}
                  {evenement.utilisateur}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </SectionCard>

      <EntryFormDialog
        open={formOuvert}
        onOpenChange={setFormOuvert}
        entree={entree}
        onSubmit={(values) => {
          modifierEntree(entree.id, values);
          toast.success("Entrée de stock mise à jour.", {
            description: "Le stock des produits a été recalculé automatiquement.",
          });
        }}
      />

      <AlertDialog open={confirmation} onOpenChange={setConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette entrée de stock ?</AlertDialogTitle>
            <AlertDialogDescription>
              La réception {entree.numero} sera supprimée et les quantités reçues seront retirées
              du stock des produits concernés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                supprimerEntree(entree.id);
                toast.success("Entrée de stock supprimée.", {
                  description: `${entree.numero} · stock mis à jour.`,
                });
                navigate({ to: "/entrees-stock" });
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

function Info({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
