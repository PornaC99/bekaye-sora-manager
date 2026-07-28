import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileSpreadsheet, Printer } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import { PageHeader } from "@/components/layout/page";
import {
  BiKpiCards,
  EtatVide,
  EvolutionCharts,
  MiniTable,
  RepartitionPie,
} from "@/components/reports/pieces";
import { cn } from "@/lib/utils";
import { formatFCFA } from "@/lib/products/types";
import { exporterCsvRapport, exporterExcelRapport, imprimerRapportBi } from "@/lib/reports/print";
import type { Periode } from "@/lib/reports/types";
import { useReports } from "@/lib/reports/use-reports";

const TITLE = "Statistiques";
const DESCRIPTION =
  "Indicateurs de performance, tendances et comparaisons sur les ventes, le stock, les clients et l'équipe.";

export const Route = createFileRoute("/_authenticated/statistiques")({
  head: () => ({
    meta: [
      { title: `${TITLE} — Bekaye Sora Business Manager` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `${TITLE} — Bekaye Sora Business Manager` },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

type Fenetre = "jour" | "7j" | "30j" | "12m";

const FENETRES: { cle: Fenetre; label: string }[] = [
  { cle: "jour", label: "Aujourd'hui" },
  { cle: "7j", label: "7 derniers jours" },
  { cle: "30j", label: "30 derniers jours" },
  { cle: "12m", label: "12 derniers mois" },
];

function construireFenetre(cle: Fenetre): Periode {
  const fin = new Date();
  fin.setHours(23, 59, 59, 999);
  const debut = new Date(fin);
  if (cle === "jour") debut.setHours(0, 0, 0, 0);
  if (cle === "7j") debut.setDate(debut.getDate() - 6);
  if (cle === "30j") debut.setDate(debut.getDate() - 29);
  if (cle === "12m") debut.setMonth(debut.getMonth() - 11);
  if (cle !== "jour") debut.setHours(0, 0, 0, 0);
  return {
    cle: "personnalisee",
    label: FENETRES.find((f) => f.cle === cle)?.label ?? "Période",
    debut,
    fin,
  };
}

function Page() {
  const [fenetre, setFenetre] = useState<Fenetre>("30j");
  const periode = useMemo(() => construireFenetre(fenetre), [fenetre]);
  const d = useReports(periode);

  const tableauExport = {
    entetes: ["Produit", "Catégorie", "Quantité", "Chiffre d'affaires", "Bénéfice", "Marge %"],
    lignes: d.ventesAnalyse.lignes.map((l) => [
      l.nom,
      l.categorie,
      l.quantite,
      l.chiffreAffaires,
      l.benefice,
      l.marge,
    ]),
  };

  const bouton =
    "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted";

  const alertesStock = d.stocks.prochesRupture.slice(0, 8);

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5">
      <PageHeader
        eyebrow="Analyse"
        title={TITLE}
        description={DESCRIPTION}
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={bouton}
              onClick={() => exporterCsvRapport(tableauExport, "statistiques")}
            >
              <Download className="h-4 w-4" /> CSV
            </button>
            <button
              type="button"
              className={bouton}
              onClick={() => exporterExcelRapport(tableauExport, "statistiques")}
            >
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </button>
            <button
              type="button"
              className={bouton}
              onClick={() =>
                imprimerRapportBi({
                  periode,
                  kpis: d.kpis,
                  resume: d.resume,
                  scores: d.scores,
                  meilleursProduits: d.ventesAnalyse.meilleursProduits,
                  categories: d.ventesAnalyse.categories,
                  vendeurs: d.vendeurs,
                  previsions: d.previsions,
                  alertes: d.alertes,
                })
              }
            >
              <Printer className="h-4 w-4" /> PDF
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-2 shadow-[var(--shadow-card)]">
        {FENETRES.map((f) => (
          <button
            key={f.cle}
            type="button"
            onClick={() => setFenetre(f.cle)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              fenetre === f.cle
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto self-center px-2 text-xs text-muted-foreground">
          Comparé à la période précédente de même durée
        </span>
      </div>

      <BiKpiCards kpis={d.kpis} precedents={d.kpisPrecedents} />

      <EvolutionCharts serie={d.serie} />

      <div className="grid gap-5 xl:grid-cols-[1fr_1.4fr]">
        <RepartitionPie
          titre="Répartition des ventes par catégorie"
          description="Part du chiffre d'affaires par famille de produits."
          donnees={d.ventesAnalyse.categories}
        />
        <SectionCard
          title="Produits les plus vendus"
          description="Classement par quantité vendue sur la période."
        >
          <MiniTable
            entetes={["Produit", "Qté", "CA", "Marge %"]}
            lignes={d.ventesAnalyse.meilleursProduits.map((l) => [
              l.nom,
              l.quantite,
              formatFCFA(l.chiffreAffaires),
              `${l.marge} %`,
            ])}
          />
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard
          title="Produits les moins vendus"
          description="À animer, remiser ou déréférencer."
        >
          <MiniTable
            entetes={["Produit", "Qté", "CA"]}
            lignes={d.ventesAnalyse.produitsFaibles.map((l) => [
              l.nom,
              l.quantite,
              formatFCFA(l.chiffreAffaires),
            ])}
          />
        </SectionCard>

        <SectionCard
          title="État du stock"
          description="Produits en rupture ou sous le seuil d'alerte."
        >
          {alertesStock.length === 0 ? (
            <EtatVide message="Aucune alerte de stock : tout est approvisionné." />
          ) : (
            <MiniTable
              entetes={["Produit", "Stock", "Seuil"]}
              lignes={alertesStock.map((p) => [p.nom, p.stock, p.stockMinimum])}
            />
          )}
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard
          title="Performance de l'équipe"
          description="Ventes réalisées, panier moyen et présence."
        >
          <MiniTable
            entetes={["Employé", "Ventes", "CA", "Présence"]}
            lignes={d.vendeurs
              .slice(0, 8)
              .map((v) => [
                v.employe.nom,
                v.nombreVentes,
                formatFCFA(v.chiffreAffaires),
                `${v.tauxPresence} %`,
              ])}
          />
        </SectionCard>

        <SectionCard
          title="Répartition des clients"
          description="Structure du portefeuille client sur la période."
        >
          <MiniTable
            entetes={["Indicateur", "Valeur"]}
            lignes={[
              ["Clients au fichier", d.clientsAnalyse.total],
              ["Nouveaux clients", d.clientsAnalyse.nouveaux],
              ["Clients fidèles", d.clientsAnalyse.fideles],
              ["Clients VIP", d.clientsAnalyse.vip],
              ["Clients inactifs", d.clientsAnalyse.inactifs],
              ["Panier moyen", formatFCFA(d.clientsAnalyse.panierMoyen)],
            ]}
          />
        </SectionCard>
      </div>

      <SectionCard
        title="Comparaison avec la période précédente"
        description={`${periode.label} face à la période équivalente précédente.`}
      >
        <MiniTable
          entetes={["Indicateur", "Période", "Précédent", "Écart"]}
          lignes={[
            ["Chiffre d'affaires", "chiffreAffaires"],
            ["Bénéfice", "benefice"],
            ["Dépenses", "depenses"],
            ["Nombre de ventes", "nombreVentes"],
            ["Produits vendus", "produitsVendus"],
            ["Panier moyen", "panierMoyen"],
          ].map(([label, cle]) => {
            const k = cle as keyof typeof d.kpis;
            const actuel = d.kpis[k] as number;
            const precedent = d.kpisPrecedents[k] as number;
            const ecart =
              precedent === 0
                ? actuel > 0
                  ? 100
                  : 0
                : Math.round(((actuel - precedent) / precedent) * 100);
            const monetaire = ["chiffreAffaires", "benefice", "depenses", "panierMoyen"].includes(
              cle as string,
            );
            return [
              label as string,
              monetaire ? formatFCFA(actuel) : actuel,
              monetaire ? formatFCFA(precedent) : precedent,
              `${ecart > 0 ? "+" : ""}${ecart} %`,
            ];
          })}
        />
      </SectionCard>
    </div>
  );
}
