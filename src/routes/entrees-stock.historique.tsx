import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EntriesTable } from "@/components/stock-entries/entries-table";
import { FOURNISSEURS } from "@/lib/products/demo-data";
import { useProductsStore } from "@/lib/products/store";
import { imprimerEntree } from "@/lib/stock/print";
import { useEntreesStore } from "@/lib/stock/store";
import { UTILISATEURS } from "@/lib/stock/demo-entries";
import { dansLaSemaine, dansLeMois, memeJour } from "@/lib/stock/types";

const DESCRIPTION = "Retrouvez toutes les livraisons reçues et filtrez-les en un clic.";

export const Route = createFileRoute("/entrees-stock/historique")({
  head: () => ({
    meta: [
      { title: "Historique des entrées — Bekaye Sora Business Manager" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Historique des entrées — Bekaye Sora Business Manager" },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: HistoriqueEntreesPage,
});

function HistoriqueEntreesPage() {
  const { entrees } = useEntreesStore();
  const { produits } = useProductsStore();
  const [recherche, setRecherche] = useState("");
  const [periode, setPeriode] = useState<"toutes" | "jour" | "semaine" | "mois">("toutes");
  const [fournisseur, setFournisseur] = useState("tous");
  const [produit, setProduit] = useState("tous");
  const [utilisateur, setUtilisateur] = useState("tous");

  const nomProduit = (id: string) => produits.find((p) => p.id === id)?.nom ?? id;

  const resultats = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return entrees
      .filter((e) =>
        periode === "jour"
          ? memeJour(e.date)
          : periode === "semaine"
            ? dansLaSemaine(e.date)
            : periode === "mois"
              ? dansLeMois(e.date)
              : true,
      )
      .filter((e) => (fournisseur === "tous" ? true : e.fournisseur === fournisseur))
      .filter((e) => (utilisateur === "tous" ? true : e.utilisateur === utilisateur))
      .filter((e) => (produit === "tous" ? true : e.lignes.some((l) => l.produitId === produit)))
      .filter((e) => {
        if (!q) return true;
        return [
          e.numero,
          e.fournisseur,
          e.referenceFacture,
          e.bonLivraison,
          ...e.lignes.map((l) => `${nomProduit(l.produitId)} ${l.codeBarres}`),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entrees, produits, recherche, periode, fournisseur, produit, utilisateur]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <Link
        to="/entrees-stock"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour aux entrées de stock
      </Link>

      <PageHeader eyebrow="Stock" title="Historique des entrées" description={DESCRIPTION} />

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un produit, un code-barres, un fournisseur ou une facture…"
            className="h-11 rounded-xl pl-9"
            aria-label="Rechercher dans l'historique des entrées"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Select value={periode} onValueChange={(v) => setPeriode(v as typeof periode)}>
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="toutes">Toutes les périodes</SelectItem>
              <SelectItem value="jour">Aujourd'hui</SelectItem>
              <SelectItem value="semaine">Cette semaine</SelectItem>
              <SelectItem value="mois">Ce mois</SelectItem>
            </SelectContent>
          </Select>
          <Select value={fournisseur} onValueChange={setFournisseur}>
            <SelectTrigger className="h-11 rounded-xl">
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
          <Select value={produit} onValueChange={setProduit}>
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les produits</SelectItem>
              {produits.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={utilisateur} onValueChange={setUtilisateur}>
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les utilisateurs</SelectItem>
              {UTILISATEURS.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {resultats.length} réception{resultats.length > 1 ? "s" : ""} affichée
        {resultats.length > 1 ? "s" : ""}
      </p>

      {resultats.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Aucune entrée de stock ne correspond à ces filtres.
        </div>
      ) : (
        <EntriesTable
          entrees={resultats}
          actions={{
            onEdit: () =>
              toast.info("Modification", {
                description: "Ouvrez la fiche de la réception pour la modifier.",
              }),
            onPrint: (entree) => {
              const ok = imprimerEntree(entree, produits);
              if (!ok)
                toast.error("Impression bloquée", {
                  description: "Autorisez les fenêtres pop-up pour imprimer le bon d'entrée.",
                });
            },
            onDelete: () =>
              toast.info("Suppression", {
                description: "Ouvrez la fiche de la réception pour la supprimer.",
              }),
          }}
        />
      )}
    </div>
  );
}
