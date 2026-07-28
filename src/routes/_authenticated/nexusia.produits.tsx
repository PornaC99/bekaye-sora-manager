import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import {
  BarresComparaison,
  CourbeEvolution,
  NexusHeader,
  Pastille,
  SectionCard,
  StatTile,
  TableauCompact,
} from "@/components/nexusia/pieces";
import { useNexusia } from "@/lib/nexusia/insight";
import { formatFCFA, statutProduit } from "@/lib/products/types";
import { formatNombre } from "@/lib/nexusia/types";

export const Route = createFileRoute("/_authenticated/nexusia/produits")({
  head: () => ({
    meta: [
      { title: "Analyse des produits — NEXUSIA Insight | Bekaye Sora" },
      {
        name: "description",
        content:
          "Évolution des ventes, du bénéfice et du stock, prévision de rupture et rentabilité produit par produit.",
      },
      { property: "og:title", content: "Analyse des produits — NEXUSIA Insight" },
      {
        property: "og:description",
        content: "Comprenez la performance de chaque référence cosmétique 501.",
      },
    ],
  }),
  component: AnalyseProduits,
});

function AnalyseProduits() {
  const donnees = useNexusia();
  const lignes = donnees.mois.ventesAnalyse.lignes;
  const [selection, setSelection] = useState<string | null>(null);

  const produitId = selection ?? lignes[0]?.produitId ?? donnees.mois.produits[0]?.id ?? null;
  const produit = donnees.mois.produits.find((p) => p.id === produitId) ?? null;
  const ligne = lignes.find((l) => l.produitId === produitId) ?? null;
  const rotation = donnees.mois.stocks.rotations.find((r) => r.produit.id === produitId) ?? null;

  const serieProduit = useMemo(() => {
    if (!produit) return [];
    const seaux = new Map<string, { label: string; ca: number; quantite: number }>();
    donnees.mois.ventesDeLaPeriode.forEach((v) => {
      const label = new Date(v.date).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
      });
      const courant = seaux.get(label) ?? { label, ca: 0, quantite: 0 };
      v.lignes
        .filter((l) => l.produitId === produit.id)
        .forEach((l) => {
          courant.ca += l.prixUnitaire * l.quantite;
          courant.quantite += l.quantite;
        });
      seaux.set(label, courant);
    });
    return [...seaux.values()];
  }, [donnees.mois.ventesDeLaPeriode, produit]);

  const previsionRupture = donnees.mois.previsions.risquesRupture.find(
    (r) => r.produit.id === produitId,
  );

  return (
    <div className="flex flex-col gap-5">
      <NexusHeader
        eyebrow="Analyse avancée"
        titre="Analyse des produits"
        sous="Ventes, bénéfice, stock, rentabilité et prévisions pour chaque référence."
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <SectionCard
          title="Catalogue analysé"
          description="Sélectionnez un produit."
          bodyClassName="p-2"
        >
          <ul className="flex max-h-[560px] flex-col gap-1 overflow-y-auto">
            {donnees.mois.produits.map((p) => {
              const l = lignes.find((x) => x.produitId === p.id);
              const actif = p.id === produitId;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelection(p.id)}
                    className={`flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-left transition ${
                      actif ? "bg-primary-soft text-primary" : "hover:bg-muted"
                    }`}
                  >
                    <span className="truncate text-sm font-medium">{p.nom}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatNombre(l?.quantite ?? 0)} vendus · {p.stock} en stock
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </SectionCard>

        <div className="flex flex-col gap-5">
          {produit ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile
                  label="Ventes du mois"
                  valeur={`${formatNombre(ligne?.quantite ?? 0)} u.`}
                  detail={formatFCFA(ligne?.chiffreAffaires ?? 0)}
                />
                <StatTile
                  label="Bénéfice généré"
                  valeur={formatFCFA(ligne?.benefice ?? 0)}
                  detail={`Marge ${ligne?.marge ?? 0} %`}
                  ton="succes"
                />
                <StatTile
                  label="Stock actuel"
                  valeur={`${produit.stock} ${produit.unite.toLowerCase()}`}
                  detail={`Minimum ${produit.stockMinimum}`}
                  ton={statutProduit(produit) === "disponible" ? "info" : "alerte"}
                />
                <StatTile
                  label="Prévision de rupture"
                  valeur={
                    previsionRupture
                      ? `${previsionRupture.joursRestants} jours`
                      : rotation?.joursRestants
                        ? `${rotation.joursRestants} jours`
                        : "Non menacé"
                  }
                  detail={`Rotation ${rotation?.rotation ?? 0}`}
                  ton={previsionRupture ? "danger" : "succes"}
                />
              </div>

              <SectionCard
                title={`Évolution — ${produit.nom}`}
                description="Chiffre d'affaires quotidien du mois en cours."
              >
                <CourbeEvolution
                  data={serieProduit}
                  cles={[{ cle: "ca", nom: "Chiffre d'affaires", couleur: "var(--chart-1)" }]}
                />
              </SectionCard>
            </>
          ) : (
            <SectionCard title="Analyse produit" description="Aucun produit disponible.">
              <p className="text-sm text-muted-foreground">Ajoutez des produits au catalogue.</p>
            </SectionCard>
          )}

          <SectionCard
            title="Rentabilité du catalogue"
            description="Bénéfice généré par produit sur le mois."
          >
            <BarresComparaison
              data={lignes.slice(0, 8).map((l) => ({ label: l.nom, benefice: l.benefice }))}
              cle="benefice"
              nom="Bénéfice"
              couleur="var(--chart-2)"
            />
          </SectionCard>
        </div>
      </div>

      <SectionCard
        title="Tableau de performance"
        description="Ventes, bénéfice, marge et couverture de stock."
      >
        <TableauCompact
          entetes={["Produit", "Vendus", "Chiffre d'affaires", "Bénéfice", "Marge", "Couverture"]}
          lignes={lignes.slice(0, 15).map((l) => {
            const r = donnees.mois.stocks.rotations.find((x) => x.produit.id === l.produitId);
            return [
              l.nom,
              formatNombre(l.quantite),
              formatFCFA(l.chiffreAffaires),
              formatFCFA(l.benefice),
              <Pastille key={l.produitId} ton={l.marge >= 30 ? "succes" : "alerte"}>
                {l.marge} %
              </Pastille>,
              r?.joursRestants ? `${r.joursRestants} j` : "—",
            ];
          })}
        />
      </SectionCard>
    </div>
  );
}
