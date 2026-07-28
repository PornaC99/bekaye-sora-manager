import { createFileRoute } from "@tanstack/react-router";

import {
  CourbeEvolution,
  ListeInsights,
  NexusHeader,
  Pastille,
  SectionCard,
  StatTile,
  TableauCompact,
} from "@/components/nexusia/pieces";
import { useNexusia } from "@/lib/nexusia/insight";
import { formatFCFA } from "@/lib/products/types";

export const Route = createFileRoute("/nexusia/finances")({
  head: () => ({
    meta: [
      { title: "Analyse financière — NEXUSIA Insight | Bekaye Sora" },
      {
        name: "description",
        content:
          "Bénéfice réel, structure des dépenses, trésorerie, créances, dettes et prévisions financières.",
      },
      { property: "og:title", content: "Analyse financière — NEXUSIA Insight" },
      {
        property: "og:description",
        content: "La santé financière de votre entreprise, expliquée simplement.",
      },
    ],
  }),
  component: AnalyseFinances,
});

function AnalyseFinances() {
  const donnees = useNexusia();
  const { finances, mois } = donnees;

  const serie = mois.serie.map((p) => ({
    label: p.label,
    ca: p.ca,
    benefice: p.benefice,
    depenses: p.depenses,
  }));

  return (
    <div className="flex flex-col gap-5">
      <NexusHeader
        eyebrow="Santé financière"
        titre="Analyse des finances"
        sous="Bénéfice réel, dépenses, trésorerie et projections."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Bénéfice réel du mois"
          valeur={formatFCFA(finances.kpis.beneficeMois)}
          detail={`Marge nette ${finances.kpis.margeNette} %`}
          ton={finances.kpis.beneficeMois >= 0 ? "succes" : "danger"}
        />
        <StatTile
          label="Trésorerie disponible"
          valeur={formatFCFA(finances.tresorerie.solde)}
          detail={`Caisse ${formatFCFA(finances.kpis.montantCaisse)}`}
          ton="info"
        />
        <StatTile
          label="Créances clients"
          valeur={formatFCFA(finances.kpis.creances)}
          detail="À encaisser"
          ton={finances.kpis.creances > 0 ? "alerte" : "succes"}
        />
        <StatTile
          label="Dettes fournisseurs"
          valeur={formatFCFA(finances.kpis.dettes)}
          detail="À régler"
          ton={finances.kpis.dettes > 0 ? "alerte" : "succes"}
        />
      </div>

      <SectionCard
        title="Évolution financière du mois"
        description="Chiffre d'affaires, bénéfice et dépenses."
      >
        <CourbeEvolution
          data={serie}
          cles={[
            { cle: "ca", nom: "Chiffre d'affaires", couleur: "var(--chart-1)" },
            { cle: "benefice", nom: "Bénéfice", couleur: "var(--chart-2)" },
            { cle: "depenses", nom: "Dépenses", couleur: "var(--chart-3)" },
          ]}
        />
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard
          title="Structure des dépenses"
          description="Répartition des sorties du mois en cours."
        >
          <TableauCompact
            entetes={["Catégorie", "Montant", "Part"]}
            lignes={finances.repartition.map((r) => [
              r.label,
              formatFCFA(r.montant),
              <Pastille key={r.categorie} ton={r.part > 40 ? "alerte" : "info"}>
                {r.part} %
              </Pastille>,
            ])}
          />
        </SectionCard>

        <SectionCard
          title="Prévisions financières"
          description="Projection automatique à fin de mois."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <StatTile
              label="CA prévu"
              valeur={formatFCFA(finances.previsions.caPrevu)}
              detail={`Réalisé ${formatFCFA(finances.previsions.caRealise)}`}
            />
            <StatTile
              label="Bénéfice prévu"
              valeur={formatFCFA(finances.previsions.beneficePrevu)}
              detail={`Moyenne/jour ${formatFCFA(finances.previsions.moyenneJournaliereCA)}`}
              ton="succes"
            />
            <StatTile
              label="Dépenses prévues"
              valeur={formatFCFA(finances.previsions.depensesPrevues)}
              detail="Sur le mois complet"
              ton="alerte"
            />
            <StatTile
              label="Risque de trésorerie"
              valeur={
                finances.previsions.joursAvantRupture !== null
                  ? `${finances.previsions.joursAvantRupture} jours`
                  : "Aucun risque"
              }
              detail={
                finances.previsions.dateRuptureTresorerie
                  ? `Prévu le ${new Date(finances.previsions.dateRuptureTresorerie).toLocaleDateString("fr-FR")}`
                  : "Flux net positif"
              }
              ton={finances.previsions.joursAvantRupture !== null ? "danger" : "succes"}
            />
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard
          title="Produits les plus rentables"
          description="Bénéfice généré et marge réelle."
        >
          <TableauCompact
            entetes={["Produit", "Chiffre d'affaires", "Bénéfice", "Marge"]}
            lignes={finances.rentabilites.slice(0, 10).map((r) => [
              r.nom,
              formatFCFA(r.chiffreAffaires),
              formatFCFA(r.benefice),
              <Pastille key={r.produitId} ton={r.marge >= 30 ? "succes" : "alerte"}>
                {r.marge} %
              </Pastille>,
            ])}
          />
        </SectionCard>

        <SectionCard
          title="Conseils financiers"
          description="Analyse automatique de votre situation."
        >
          <ListeInsights
            items={finances.conseils.map((c, i) => ({
              id: `${c.titre}-${i}`,
              titre: c.titre,
              message: c.message,
              ton: c.ton === "danger" || c.ton === "alerte" ? c.ton : "info",
            }))}
          />
        </SectionCard>
      </div>
    </div>
  );
}
