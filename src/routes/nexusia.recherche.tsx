import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";

import { NexusHeader, Pastille, SectionCard } from "@/components/nexusia/pieces";
import { rechercherGlobal, useNexusia } from "@/lib/nexusia/insight";

const FILTRES = ["Tout", "Produit", "Client", "Employé", "Facture", "Fournisseur", "Rapport"] as const;

export const Route = createFileRoute("/nexusia/recherche")({
  head: () => ({
    meta: [
      { title: "Recherche intelligente — NEXUSIA Insight | Bekaye Sora" },
      {
        name: "description",
        content:
          "Recherchez instantanément un produit, un client, un employé, une facture, un fournisseur ou un rapport.",
      },
      { property: "og:title", content: "Recherche intelligente — NEXUSIA Insight" },
      {
        property: "og:description",
        content: "Une seule barre de recherche pour retrouver toute votre activité.",
      },
    ],
  }),
  component: RecherchePage,
});

function RecherchePage() {
  const donnees = useNexusia();
  const [terme, setTerme] = useState("");
  const [filtre, setFiltre] = useState<(typeof FILTRES)[number]>("Tout");

  const resultats = useMemo(() => {
    const base = rechercherGlobal(donnees.index, terme);
    return filtre === "Tout" ? base : base.filter((r) => r.type === filtre);
  }, [donnees.index, terme, filtre]);

  return (
    <div className="flex flex-col gap-5">
      <NexusHeader
        eyebrow="Accès instantané"
        titre="Recherche intelligente"
        sous="Produits, clients, employés, factures, fournisseurs et rapports au même endroit."
      />

      <SectionCard
        title="Rechercher"
        description="Saisissez un nom, un numéro de facture ou un mot-clé."
        bodyClassName="flex flex-col gap-4"
      >
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={terme}
            onChange={(e) => setTerme(e.target.value)}
            placeholder="Ex. crème éclaircissante, Aïssata, FV-2024…"
            className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTRES.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltre(f)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                f === filtre
                  ? "border-primary/40 bg-primary-soft text-primary"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          {resultats.length} résultat(s) trouvé(s).
        </p>

        <ul className="flex flex-col gap-2">
          {resultats.slice(0, 40).map((r) => (
            <li key={r.id}>
              <Link
                to={r.to}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-3.5 py-3 transition hover:border-primary/40"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {r.titre}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{r.detail}</span>
                </span>
                <Pastille ton="info">{r.type}</Pastille>
              </Link>
            </li>
          ))}
          {resultats.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucun résultat pour cette recherche. Essayez un autre mot-clé.
            </p>
          )}
        </ul>
      </SectionCard>
    </div>
  );
}
