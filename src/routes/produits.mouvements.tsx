import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownToLine, ArrowLeft, ArrowUpFromLine, Search } from "lucide-react";

import { PageHeader } from "@/components/layout/page";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProductsStore } from "@/lib/products/store";
import { formatDateCourt, formatHeure } from "@/lib/products/types";

const DESCRIPTION = "Toutes les entrées et sorties de stock, produit par produit.";

export const Route = createFileRoute("/produits/mouvements")({
  head: () => ({
    meta: [
      { title: "Historique des mouvements — Bekaye Sora Business Manager" },
      { name: "description", content: DESCRIPTION },
      {
        property: "og:title",
        content: "Historique des mouvements — Bekaye Sora Business Manager",
      },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: MouvementsPage,
});

function MouvementsPage() {
  const { mouvements, produits } = useProductsStore();
  const [recherche, setRecherche] = useState("");
  const [type, setType] = useState<"tous" | "entree" | "sortie">("tous");

  const nomProduit = (id: string) => produits.find((p) => p.id === id)?.nom ?? id;

  const lignes = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return mouvements
      .filter((m) => (type === "tous" ? true : m.type === type))
      .filter(
        (m) =>
          !q ||
          [nomProduit(m.produitId), m.utilisateur, m.observation]
            .join(" ")
            .toLowerCase()
            .includes(q),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mouvements, produits, recherche, type]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Link
        to="/produits"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour aux produits
      </Link>

      <PageHeader
        eyebrow="Catalogue"
        title="Historique des mouvements"
        description={DESCRIPTION}
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un produit, un utilisateur ou une observation…"
            className="h-11 rounded-xl pl-9"
            aria-label="Rechercher un mouvement"
          />
        </div>
        <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
          <SelectTrigger className="h-11 rounded-xl sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les mouvements</SelectItem>
            <SelectItem value="entree">Entrées</SelectItem>
            <SelectItem value="sortie">Sorties</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {lignes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Aucun mouvement ne correspond à votre recherche.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto scrollbar-slim">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Heure</th>
                  <th className="px-4 py-3 font-semibold">Produit</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Utilisateur</th>
                  <th className="px-4 py-3 text-right font-semibold">Quantité</th>
                  <th className="px-4 py-3 font-semibold">Observation</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-border/70 transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatDateCourt(m.date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatHeure(m.date)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to="/produits/$produitId"
                        params={{ produitId: m.produitId }}
                        className="font-medium text-foreground transition-colors hover:text-primary"
                      >
                        {nomProduit(m.produitId)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          m.type === "entree"
                            ? "inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success"
                            : "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary"
                        }
                      >
                        {m.type === "entree" ? (
                          <ArrowDownToLine className="h-3 w-3" />
                        ) : (
                          <ArrowUpFromLine className="h-3 w-3" />
                        )}
                        {m.type === "entree" ? "Entrée" : "Sortie"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {m.utilisateur}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">
                      {m.type === "entree" ? "+" : "−"}
                      {m.quantite}
                    </td>
                    <td className="max-w-[260px] px-4 py-3 text-muted-foreground">
                      <span className="block truncate">{m.observation}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
