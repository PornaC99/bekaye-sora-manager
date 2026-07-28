import { createFileRoute } from "@tanstack/react-router";

import {
  BarreProgression,
  BarresComparaison,
  NexusHeader,
  Pastille,
  SectionCard,
  StatTile,
  TableauCompact,
} from "@/components/nexusia/pieces";
import { useNexusia } from "@/lib/nexusia/insight";
import { formatNombre } from "@/lib/nexusia/types";
import { formatFCFA } from "@/lib/products/types";
import { variation } from "@/lib/reports/types";

export const Route = createFileRoute("/_authenticated/nexusia/employes")({
  head: () => ({
    meta: [
      { title: "Analyse des employés — NEXUSIA Insight | Bekaye Sora" },
      {
        name: "description",
        content:
          "Performance, progression, objectifs, historique et comparaison de votre équipe de vente.",
      },
      { property: "og:title", content: "Analyse des employés — NEXUSIA Insight" },
      {
        property: "og:description",
        content: "Pilotez la performance de votre équipe avec des indicateurs clairs.",
      },
    ],
  }),
  component: AnalyseEmployes,
});

function AnalyseEmployes() {
  const donnees = useNexusia();
  const vendeurs = donnees.mois.vendeurs;
  const precedents = donnees.semaine.vendeurs;

  const moyenneProgression = vendeurs.length
    ? Math.round(vendeurs.reduce((t, v) => t + v.progression, 0) / vendeurs.length)
    : 0;

  return (
    <div className="flex flex-col gap-5">
      <NexusHeader
        eyebrow="Ressources humaines"
        titre="Analyse des employés"
        sous="Performance, progression, objectifs et comparaison de l'équipe."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Employés actifs"
          valeur={formatNombre(donnees.mois.kpis.employesActifs)}
          detail="Sur la période"
        />
        <StatTile
          label="Meilleur vendeur"
          valeur={vendeurs[0]?.employe.nom ?? "—"}
          detail={formatFCFA(vendeurs[0]?.chiffreAffaires ?? 0)}
          ton="succes"
        />
        <StatTile
          label="Objectifs atteints"
          valeur={`${vendeurs.filter((v) => v.progression >= 100).length}/${vendeurs.length}`}
          detail={`Moyenne ${moyenneProgression} %`}
          ton={moyenneProgression >= 80 ? "succes" : "alerte"}
        />
        <StatTile
          label="Présence moyenne"
          valeur={`${
            vendeurs.length
              ? Math.round(vendeurs.reduce((t, v) => t + v.tauxPresence, 0) / vendeurs.length)
              : 0
          } %`}
          detail="Pointage du mois"
          ton="info"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <SectionCard
          title="Comparaison des ventes"
          description="Chiffre d'affaires généré par vendeur ce mois."
        >
          <BarresComparaison
            data={vendeurs.map((v) => ({ label: v.employe.nom, ca: v.chiffreAffaires }))}
            cle="ca"
            nom="Chiffre d'affaires"
          />
        </SectionCard>

        <SectionCard title="Progression des objectifs" description="Avancement individuel du mois.">
          <ul className="flex flex-col gap-3.5">
            {vendeurs.map((v) => (
              <li key={v.employe.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-foreground">{v.employe.nom}</span>
                  <Pastille ton={v.progression >= 100 ? "succes" : v.progression >= 60 ? "info" : "alerte"}>
                    {v.progression} %
                  </Pastille>
                </div>
                <BarreProgression
                  valeur={v.progression}
                  ton={v.progression >= 100 ? "succes" : v.progression >= 60 ? "info" : "alerte"}
                />
                <p className="text-[11px] text-muted-foreground">
                  {formatFCFA(v.chiffreAffaires)} sur un objectif de {formatFCFA(v.objectif)}
                </p>
              </li>
            ))}
            {vendeurs.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun vendeur enregistré.</p>
            )}
          </ul>
        </SectionCard>
      </div>

      <SectionCard
        title="Historique et comparaison"
        description="Mois en cours comparé à la semaine écoulée."
      >
        <TableauCompact
          entetes={["Employé", "Ventes", "Chiffre d'affaires", "Panier moyen", "Présence", "Tendance"]}
          lignes={vendeurs.map((v) => {
            const semaine = precedents.find((p) => p.employe.id === v.employe.id);
            const tendance = variation(semaine?.chiffreAffaires ?? 0, v.chiffreAffaires / 4);
            return [
              v.employe.nom,
              formatNombre(v.nombreVentes),
              formatFCFA(v.chiffreAffaires),
              formatFCFA(v.panierMoyen),
              `${v.tauxPresence} %`,
              <Pastille key={v.employe.id} ton={tendance >= 0 ? "succes" : "alerte"}>
                {tendance > 0 ? "+" : ""}
                {tendance} %
              </Pastille>,
            ];
          })}
        />
      </SectionCard>
    </div>
  );
}
