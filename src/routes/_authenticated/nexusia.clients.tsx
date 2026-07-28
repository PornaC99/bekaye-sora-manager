import { createFileRoute } from "@tanstack/react-router";

import {
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

export const Route = createFileRoute("/_authenticated/nexusia/clients")({
  head: () => ({
    meta: [
      { title: "Analyse des clients — NEXUSIA Insight | Bekaye Sora" },
      {
        name: "description",
        content:
          "Clients fidèles, VIP, inactifs, panier moyen et fréquence d'achat analysés automatiquement.",
      },
      { property: "og:title", content: "Analyse des clients — NEXUSIA Insight" },
      {
        property: "og:description",
        content: "Comprenez votre clientèle et identifiez les leviers de fidélisation.",
      },
    ],
  }),
  component: AnalyseClients,
});

function AnalyseClients() {
  const donnees = useNexusia();
  const analyse = donnees.mois.clientsAnalyse;

  return (
    <div className="flex flex-col gap-5">
      <NexusHeader
        eyebrow="Relation client"
        titre="Analyse des clients"
        sous="Fidélité, valeur, fréquence d'achat et opportunités de relance."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Clients au fichier"
          valeur={formatNombre(analyse.total)}
          detail={`${analyse.nouveaux} nouveau(x) ce mois`}
        />
        <StatTile
          label="Clients VIP"
          valeur={formatNombre(analyse.vip)}
          detail={`${analyse.fideles} clients fidèles`}
          ton="succes"
        />
        <StatTile
          label="Clients inactifs"
          valeur={formatNombre(analyse.inactifs)}
          detail="À relancer par message"
          ton={analyse.inactifs > 0 ? "alerte" : "succes"}
        />
        <StatTile
          label="Panier moyen"
          valeur={formatFCFA(analyse.panierMoyen)}
          detail={`${analyse.frequenceAchat} achat(s) par client`}
          ton="info"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <SectionCard
          title="Meilleurs clients"
          description="Montant total dépensé depuis l'inscription."
        >
          <BarresComparaison
            data={analyse.meilleurs.map((c) => ({ label: c.nom, total: c.totalDepense }))}
            cle="total"
            nom="Total dépensé"
            couleur="var(--chart-2)"
          />
        </SectionCard>

        <SectionCard title="Segments de clientèle" description="Répartition du fichier client.">
          <ul className="flex flex-col gap-3">
            {[
              { label: "Clients VIP", valeur: analyse.vip, ton: "succes" as const },
              { label: "Clients fidèles", valeur: analyse.fideles, ton: "info" as const },
              { label: "Nouveaux du mois", valeur: analyse.nouveaux, ton: "info" as const },
              { label: "Clients inactifs", valeur: analyse.inactifs, ton: "alerte" as const },
            ].map((s) => (
              <li
                key={s.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-3.5 py-3"
              >
                <span className="text-sm text-foreground">{s.label}</span>
                <Pastille ton={s.ton}>{formatNombre(s.valeur)}</Pastille>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard
        title="Fiche de valeur client"
        description="Points de fidélité, dépenses et dernier achat."
      >
        <TableauCompact
          entetes={["Client", "Téléphone", "Total dépensé", "Points", "Dernier achat"]}
          lignes={analyse.meilleurs.map((c) => [
            c.nom,
            c.numero,
            formatFCFA(c.totalDepense),
            formatNombre(c.points),
            c.dernierAchat ? new Date(c.dernierAchat).toLocaleDateString("fr-FR") : "—",
          ])}
        />
      </SectionCard>
    </div>
  );
}
