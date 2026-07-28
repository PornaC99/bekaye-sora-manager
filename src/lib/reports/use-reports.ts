import { useMemo } from "react";

import { useClientsStore } from "@/lib/clients/store";
import { depensesConsolidees } from "@/lib/finance/analytics";
import { useFinanceStore } from "@/lib/finance/store";
import { useHrStore } from "@/lib/hr/store";
import { useProductsStore } from "@/lib/products/store";
import { useSalesStore } from "@/lib/sales/store";
import { useSuppliersStore } from "@/lib/suppliers/store";

import {
  alertesIntelligentes,
  analyseClients,
  analyseEmployes,
  analyseFournisseurs,
  analyseStocks,
  analyseVentes,
  comparerRetours,
  depensesPeriode,
  kpisRapport,
  previsionsRapport,
  resumeExecutif,
  scoresPerformance,
  serieRapport,
  ventesPeriode,
} from "./analytics";
import { periodePrecedente, type Periode } from "./types";

/**
 * Agrège toutes les données de l'entreprise pour le module
 * « Rapports & Business Intelligence ». Aucune donnée n'est ressaisie :
 * tout provient des modules Produits, Ventes, Clients, Employés,
 * Fournisseurs et Finances.
 */
export function useReports(periode: Periode) {
  const { produits } = useProductsStore();
  const { ventes, retours } = useSalesStore();
  const { clients } = useClientsStore();
  const { employes, presences, bulletins } = useHrStore();
  const { fournisseurs, commandes } = useSuppliersStore();
  const { depenses } = useFinanceStore();

  return useMemo(() => {
    const nomFournisseur = (id: string) =>
      fournisseurs.find((f) => f.id === id)?.nom ?? "Fournisseur";

    const toutesDepenses = depensesConsolidees({
      depenses,
      bulletins,
      employes,
      commandes,
      nomFournisseur,
    });

    const precedente = periodePrecedente(periode);

    const base = {
      ventes,
      produits,
      depenses: toutesDepenses,
      clients,
      fournisseurs,
      employes,
    };

    const kpis = kpisRapport({ ...base, periode });
    const kpisPrecedents = kpisRapport({ ...base, periode: precedente });

    const ventesDeLaPeriode = ventesPeriode(ventes, periode);
    const depensesDeLaPeriode = depensesPeriode(toutesDepenses, periode);
    const depensesPrecedentes = depensesPeriode(toutesDepenses, precedente);

    const serie = serieRapport({ ventes, produits, depenses: toutesDepenses, periode });
    const ventesAnalyse = analyseVentes(ventesDeLaPeriode, produits);
    const joursPeriode = Math.max(
      1,
      Math.round((periode.fin.getTime() - periode.debut.getTime()) / 86_400_000),
    );
    const stocks = analyseStocks(ventesDeLaPeriode, produits, joursPeriode);
    const vendeurs = analyseEmployes(employes, ventesDeLaPeriode, presences, periode);
    const clientsAnalyse = analyseClients(clients, ventesDeLaPeriode, periode);
    const fournisseursAnalyse = analyseFournisseurs(fournisseurs, commandes, periode);
    const previsions = previsionsRapport({ ventes, produits, depenses: toutesDepenses });
    const scores = scoresPerformance({ kpis, kpisPrecedents, produits, vendeurs });

    return {
      periode,
      precedente,
      produits,
      ventes,
      ventesDeLaPeriode,
      retours: comparerRetours(retours, periode),
      clients,
      employes,
      fournisseurs,
      commandes,
      toutesDepenses,
      depensesDeLaPeriode,
      kpis,
      kpisPrecedents,
      serie,
      ventesAnalyse,
      stocks,
      vendeurs,
      clientsAnalyse,
      fournisseursAnalyse,
      previsions,
      scores,
      alertes: alertesIntelligentes({
        kpis,
        kpisPrecedents,
        serie,
        vendeurs,
        ventesLignes: ventesAnalyse.lignes,
        previsions,
        depenses: depensesDeLaPeriode,
        depensesPrecedentes,
      }),
      resume: resumeExecutif({
        kpis,
        kpisPrecedents,
        scores,
        ventesLignes: ventesAnalyse.lignes,
        vendeurs,
        previsions,
        depenses: depensesDeLaPeriode,
        depensesPrecedentes,
        periodeLabel: periode.label,
      }),
    };
  }, [
    produits,
    ventes,
    retours,
    clients,
    employes,
    presences,
    bulletins,
    fournisseurs,
    commandes,
    depenses,
    periode,
  ]);
}

export type DonneesRapports = ReturnType<typeof useReports>;
