import { useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Pencil,
  Phone,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page";
import { StatutCommandeBadge } from "@/components/suppliers/orders-table";
import { SupplierFormDialog } from "@/components/suppliers/supplier-form-dialog";
import { SupplierLogo, StatutFournisseurBadge } from "@/components/suppliers/suppliers-table";
import { Button } from "@/components/ui/button";
import { useProductsStore } from "@/lib/products/store";
import { formatDateCourt, formatFCFA } from "@/lib/products/types";
import { produitsDuFournisseur, totalAchatsFournisseur } from "@/lib/suppliers/analytics";
import { modifierFournisseur, useSuppliersStore } from "@/lib/suppliers/store";
import { montantCommande } from "@/lib/suppliers/types";

export const Route = createFileRoute("/fournisseurs/$fournisseurId")({
  head: () => ({
    meta: [
      { title: "Fiche fournisseur — Bekaye Sora Business Manager" },
      {
        name: "description",
        content: "Coordonnées, historique des commandes et produits fournis par ce partenaire.",
      },
      { property: "og:title", content: "Fiche fournisseur — Bekaye Sora Business Manager" },
      {
        property: "og:description",
        content: "Coordonnées, historique des commandes et produits fournis par ce partenaire.",
      },
    ],
  }),
  component: FicheFournisseur,
});

function Info({ label, valeur, icone: Icone }: { label: string; valeur: string; icone?: typeof Phone }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-foreground">
        {Icone && <Icone className="h-3.5 w-3.5 text-muted-foreground" />}
        {valeur || "—"}
      </p>
    </div>
  );
}

function FicheFournisseur() {
  const { fournisseurId } = useParams({ from: "/fournisseurs/$fournisseurId" });
  const { fournisseurs, commandes } = useSuppliersStore();
  const { produits } = useProductsStore();
  const [formOuvert, setFormOuvert] = useState(false);

  const fournisseur = fournisseurs.find((f) => f.id === fournisseurId) ?? null;

  const commandesLiees = useMemo(
    () =>
      commandes
        .filter((c) => c.fournisseurId === fournisseurId)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [commandes, fournisseurId],
  );

  if (!fournisseur) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">Ce fournisseur est introuvable.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/fournisseurs">Retour au répertoire</Link>
        </Button>
      </div>
    );
  }

  const produitsFournis = produitsDuFournisseur(fournisseur, produits);

  return (
    <div className="flex flex-col gap-5">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to="/fournisseurs">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Retour aux fournisseurs
        </Link>
      </Button>

      <PageHeader
        eyebrow="Fiche fournisseur"
        title={fournisseur.nom}
        description={fournisseur.entreprise}
        actions={
          <Button variant="outline" onClick={() => setFormOuvert(true)}>
            <Pencil className="mr-1.5 h-4 w-4" /> Modifier
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-start gap-4">
              <SupplierLogo fournisseur={fournisseur} taille={56} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    {fournisseur.nom}
                  </h2>
                  <StatutFournisseurBadge actif={fournisseur.actif} />
                  {fournisseur.favori && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                      <Star className="h-3 w-3 fill-amber-500" /> Favori
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Client depuis le {formatDateCourt(fournisseur.dateCreation)}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Info label="Entreprise" valeur={fournisseur.entreprise} icone={Building2} />
              <Info label="Téléphone" valeur={fournisseur.telephone} icone={Phone} />
              <Info label="WhatsApp" valeur={fournisseur.whatsapp} icone={MessageCircle} />
              <Info label="Email" valeur={fournisseur.email} icone={Mail} />
              <Info label="Adresse" valeur={fournisseur.adresse} icone={MapPin} />
              <Info label="Ville" valeur={fournisseur.ville} />
              <Info label="Pays" valeur={fournisseur.pays} />
              <Info label="Contact principal" valeur={fournisseur.contactPrincipal} />
              <Info label="Conditions de paiement" valeur={fournisseur.conditionsPaiement} />
              <Info label="Délai de livraison" valeur={`${fournisseur.delaiLivraisonJours} jours`} />
            </div>

            {fournisseur.notes && (
              <p className="mt-4 rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                {fournisseur.notes}
              </p>
            )}
          </section>

          <section
            id="historique"
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]"
          >
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-display text-base font-semibold text-foreground">
                Historique des commandes
              </h2>
              <p className="text-xs text-muted-foreground">
                {commandesLiees.length} commande(s) ·{" "}
                {formatFCFA(totalAchatsFournisseur(fournisseur.id, commandes))} d'achats cumulés
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                    <th className="px-5 py-3 text-left font-medium">Date</th>
                    <th className="px-5 py-3 text-left font-medium">Numéro</th>
                    <th className="px-5 py-3 text-right font-medium">Montant</th>
                    <th className="px-5 py-3 text-left font-medium">Statut</th>
                    <th className="px-5 py-3 text-left font-medium">Date de réception</th>
                  </tr>
                </thead>
                <tbody>
                  {commandesLiees.map((c) => (
                    <tr key={c.id} className="border-b border-border/60 last:border-0">
                      <td className="px-5 py-3 text-muted-foreground">{formatDateCourt(c.date)}</td>
                      <td className="px-5 py-3">
                        <Link
                          to="/fournisseurs/commandes/$commandeId"
                          params={{ commandeId: c.id }}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {c.numero}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums">
                        {formatFCFA(montantCommande(c))}
                      </td>
                      <td className="px-5 py-3">
                        <StatutCommandeBadge commande={c} />
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatDateCourt(c.dateReception)}
                      </td>
                    </tr>
                  ))}
                  {!commandesLiees.length && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                        Aucune commande enregistrée pour ce fournisseur.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-base font-semibold text-foreground">Produits fournis</h2>
          <p className="text-xs text-muted-foreground">
            {produitsFournis.length} produit(s) rattaché(s) à ce fournisseur.
          </p>
          <div className="mt-3 space-y-2">
            {produitsFournis.map((p) => (
              <Link
                key={p.id}
                to="/produits/$produitId"
                params={{ produitId: p.id }}
                className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 transition hover:bg-muted/40"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Package className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{p.nom}</p>
                  <p className="text-xs text-muted-foreground">
                    Stock {p.stock} · achat {formatFCFA(p.prixAchat)}
                  </p>
                </div>
              </Link>
            ))}
            {!produitsFournis.length && (
              <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                Aucun produit rattaché pour le moment.
              </p>
            )}
          </div>
        </section>
      </div>

      <SupplierFormDialog
        open={formOuvert}
        onOpenChange={setFormOuvert}
        fournisseur={fournisseur}
        onSubmit={(values) => {
          modifierFournisseur(fournisseur.id, values);
          toast.success("Fournisseur mis à jour", { description: values.nom });
        }}
      />
    </div>
  );
}
