import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, Printer } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import { PageHeader } from "@/components/layout/page";
import {
  AlertsPanel,
  BiKpiCards,
  EvolutionCharts,
  ExecutiveSummary,
  MiniTable,
  PeriodFilters,
  RepartitionPie,
} from "@/components/reports/pieces";
import { formatFCFA } from "@/lib/products/types";
import { exporterCsvRapport, exporterExcelRapport, imprimerRapportBi } from "@/lib/reports/print";
import { construirePeriode, type ClePeriode } from "@/lib/reports/types";
import { useReports } from "@/lib/reports/use-reports";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/rapports/")({
  component: RapportsPage,
});

const aujourdhuiISO = new Date().toISOString().slice(0, 10);

function RapportsPage() {
  const [cle, setCle] = useState<ClePeriode>("mois");
  const [personnalisee, setPersonnalisee] = useState({ debut: aujourdhuiISO, fin: aujourdhuiISO });
  const periode = useMemo(() => construirePeriode(cle, personnalisee), [cle, personnalisee]);
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

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Analyse"
        title="Rapports & Analyses"
        description="Analysez les performances de votre entreprise en temps réel."
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" className={bouton} onClick={() => exporterCsvRapport(tableauExport, "rapport")}>
              <Download className="h-4 w-4" /> CSV
            </button>
            <button type="button" className={bouton} onClick={() => exporterExcelRapport(tableauExport, "rapport")}>
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
              <Printer className="h-4 w-4" /> Imprimer / PDF
            </button>
          </div>
        }
      />

      <PeriodFilters
        cle={cle}
        personnalisee={personnalisee}
        onChange={setCle}
        onPersonnalisee={setPersonnalisee}
      />

      <ExecutiveSummary
        resume={d.resume}
        note={d.scores.find((s) => s.cle === "globale")?.note ?? 0}
        periodeLabel={periode.label}
      />

      <BiKpiCards kpis={d.kpis} precedents={d.kpisPrecedents} />

      <EvolutionCharts serie={d.serie} />

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Produits les plus vendus" description="Classement de la période">
          <MiniTable
            entetes={["Produit", "Quantité", "Chiffre d'affaires", "Marge"]}
            lignes={d.ventesAnalyse.meilleursProduits.map((p) => [
              p.nom,
              p.quantite,
              formatFCFA(p.chiffreAffaires),
              `${p.marge} %`,
            ])}
          />
        </SectionCard>
        <SectionCard title="Produits les moins vendus" description="À relancer ou à déstocker">
          <MiniTable
            entetes={["Produit", "Quantité", "Chiffre d'affaires", "Marge"]}
            lignes={d.ventesAnalyse.produitsFaibles.map((p) => [
              p.nom,
              p.quantite,
              formatFCFA(p.chiffreAffaires),
              `${p.marge} %`,
            ])}
          />
        </SectionCard>

        <RepartitionPie titre="Meilleures catégories" description="Part du chiffre d'affaires" donnees={d.ventesAnalyse.categories} />
        <RepartitionPie titre="Meilleures marques" description="Part du chiffre d'affaires" donnees={d.ventesAnalyse.marques} />

        <SectionCard title="Heures de forte affluence" description="Répartition des ventes">
          <MiniTable
            entetes={["Créneau", "Ventes", "Chiffre d'affaires"]}
            lignes={d.ventesAnalyse.heures
              .filter((h) => h.ventes > 0)
              .map((h) => [h.label, h.ventes, formatFCFA(h.chiffreAffaires)])}
          />
        </SectionCard>
        <SectionCard title="Jours les plus rentables" description="Classement par bénéfice">
          <MiniTable
            entetes={["Jour", "Ventes", "Chiffre d'affaires", "Bénéfice"]}
            lignes={d.ventesAnalyse.jours
              .filter((j) => j.ventes > 0)
              .map((j) => [j.label, j.ventes, formatFCFA(j.chiffreAffaires), formatFCFA(j.benefice)])}
          />
        </SectionCard>

        <SectionCard title="Analyse financière" description="Marges et rentabilité">
          <MiniTable
            entetes={["Indicateur", "Valeur"]}
            lignes={[
              ["Marge brute", `${d.kpis.margeBrute} %`],
              ["Marge nette", `${d.kpis.margeNette} %`],
              ["Bénéfice de la période", formatFCFA(d.kpis.benefice)],
              ["Dépenses de la période", formatFCFA(d.kpis.depenses)],
              ["Retours clients", `${d.retours.nombre} · ${formatFCFA(d.retours.montant)}`],
              ["Panier moyen", formatFCFA(d.kpis.panierMoyen)],
            ]}
          />
        </SectionCard>
        <SectionCard title="Analyse des stocks" description="Rotation et risques">
          <MiniTable
            entetes={["Produit", "Vendus", "Rotation", "Jours restants"]}
            lignes={d.stocks.forteRotation.map((r) => [
              r.produit.nom,
              r.quantiteVendue,
              r.rotation,
              r.joursRestants ?? "—",
            ])}
          />
          <p className="mt-3 text-xs text-muted-foreground">
            {d.stocks.prochesRupture.length} produit(s) proches de la rupture ·{" "}
            {d.stocks.prochePeremption.length} proches de la péremption ·{" "}
            {d.stocks.expires.length} expiré(s).
          </p>
        </SectionCard>

        <SectionCard title="Analyse des employés" description="Classement des vendeurs">
          <MiniTable
            entetes={["Employé", "Ventes", "Chiffre d'affaires", "Objectif"]}
            lignes={d.vendeurs.map((v) => [
              v.employe.nom,
              v.nombreVentes,
              formatFCFA(v.chiffreAffaires),
              `${v.progression} %`,
            ])}
          />
        </SectionCard>
        <SectionCard title="Analyse des clients" description="Fidélité et panier">
          <MiniTable
            entetes={["Indicateur", "Valeur"]}
            lignes={[
              ["Nouveaux clients", d.clientsAnalyse.nouveaux],
              ["Clients fidèles", d.clientsAnalyse.fideles],
              ["Clients VIP", d.clientsAnalyse.vip],
              ["Panier moyen", formatFCFA(d.clientsAnalyse.panierMoyen)],
              ["Fréquence d'achat", `${d.clientsAnalyse.frequenceAchat} achats / client`],
            ]}
          />
        </SectionCard>

        <SectionCard title="Analyse des fournisseurs" description="Achats et délais">
          <MiniTable
            entetes={["Fournisseur", "Commandes", "Montant", "Délai moyen", "Retards"]}
            lignes={d.fournisseursAnalyse
              .filter((f) => f.commandes > 0)
              .map((f) => [
                f.fournisseur.nom,
                f.commandes,
                formatFCFA(f.montant),
                `${f.delaiMoyen} j`,
                f.retards,
              ])}
          />
        </SectionCard>
        <AlertsPanel alertes={d.alertes} />
      </div>
    </div>
  );
}
