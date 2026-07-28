import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, Search, ShoppingBag, UserRound, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { MobileCard, MobileEmpty, MobilePage } from "@/components/mobile/shell";
import { Input } from "@/components/ui/input";
import { useClientsStore } from "@/lib/clients/store";
import { useHrStore } from "@/lib/hr/store";
import { useProductsStore } from "@/lib/products/store";
import { formatFCFA } from "@/lib/products/types";
import { useSalesStore } from "@/lib/sales/store";
import { totalVente } from "@/lib/sales/types";

export const Route = createFileRoute("/mobile/recherche")({
  head: () => ({
    meta: [
      { title: "Recherche globale — Bekaye Sora Mobile" },
      {
        name: "description",
        content: "Retrouvez un produit, une vente, un client ou un employé en une seule recherche.",
      },
      { property: "og:title", content: "Recherche globale — Bekaye Sora Mobile" },
      {
        property: "og:description",
        content: "Une seule barre de recherche pour toute l'entreprise Bekaye Sora.",
      },
    ],
  }),
  component: RechercheMobile,
});

function RechercheMobile() {
  const [q, setQ] = useState("");
  const { produits } = useProductsStore();
  const { ventes } = useSalesStore();
  const { clients } = useClientsStore();
  const { employes } = useHrStore();

  const resultats = useMemo(() => {
    const terme = q.trim().toLowerCase();
    if (terme.length < 2) return null;
    return {
      produits: produits
        .filter((p) => [p.nom, p.marque, p.categorie, p.codeBarres].some((v) => v.toLowerCase().includes(terme)))
        .slice(0, 5),
      ventes: ventes
        .filter((v) =>
          [v.numero, v.client, v.vendeur, ...v.lignes.map((l) => l.nom)].some((x) =>
            x.toLowerCase().includes(terme),
          ),
        )
        .slice(0, 5),
      clients: clients
        .filter((c) => [c.nom, c.telephone, c.ville, c.numero].some((v) => v.toLowerCase().includes(terme)))
        .slice(0, 5),
      employes: employes
        .filter((e) => [e.nom, e.fonction, e.matricule].some((v) => v.toLowerCase().includes(terme)))
        .slice(0, 5),
    };
  }, [q, produits, ventes, clients, employes]);

  return (
    <MobilePage titre="Recherche" sousTitre="Produits · Ventes · Clients · Employés">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Que cherchez-vous ?"
          className="h-12 rounded-xl pl-9"
          autoFocus
        />
      </div>

      {!resultats ? (
        <MobileEmpty message="Saisissez au moins 2 caractères pour lancer la recherche." />
      ) : (
        <div className="space-y-5">
          <Groupe titre="Produits" icone={Boxes} vide={resultats.produits.length === 0}>
            {resultats.produits.map((p) => (
              <MobileCard key={p.id} className="p-3">
                <p className="truncate text-sm font-semibold text-foreground">{p.nom}</p>
                <p className="truncate text-xs text-muted-foreground">
                  Stock {p.stock} · {formatFCFA(p.prixVente)}
                </p>
              </MobileCard>
            ))}
          </Groupe>

          <Groupe titre="Ventes" icone={ShoppingBag} vide={resultats.ventes.length === 0}>
            {resultats.ventes.map((v) => (
              <MobileCard key={v.id} className="p-3">
                <p className="truncate text-sm font-semibold text-foreground">{v.numero}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {v.client} · {v.vendeur} · {formatFCFA(totalVente(v))}
                </p>
              </MobileCard>
            ))}
          </Groupe>

          <Groupe titre="Clients" icone={UserRound} vide={resultats.clients.length === 0}>
            {resultats.clients.map((c) => (
              <MobileCard key={c.id} className="p-3">
                <p className="truncate text-sm font-semibold text-foreground">{c.nom}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {c.telephone} · {formatFCFA(c.totalDepense)}
                </p>
              </MobileCard>
            ))}
          </Groupe>

          <Groupe titre="Employés" icone={Users} vide={resultats.employes.length === 0}>
            {resultats.employes.map((e) => (
              <MobileCard key={e.id} className="p-3">
                <p className="truncate text-sm font-semibold text-foreground">{e.nom}</p>
                <p className="truncate text-xs text-muted-foreground">{e.fonction}</p>
              </MobileCard>
            ))}
          </Groupe>

          <Link
            to="/mobile"
            className="block rounded-xl border border-border bg-card py-3 text-center text-xs font-medium text-foreground"
          >
            Retour à l'accueil
          </Link>
        </div>
      )}
    </MobilePage>
  );
}

function Groupe({
  titre,
  icone: Icone,
  vide,
  children,
}: {
  titre: string;
  icone: typeof Boxes;
  vide: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <Icone className="h-3.5 w-3.5" />
        {titre}
      </h2>
      {vide ? (
        <p className="text-xs text-muted-foreground/80">Aucun résultat.</p>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </section>
  );
}
