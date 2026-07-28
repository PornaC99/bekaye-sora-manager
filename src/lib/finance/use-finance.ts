import { useMemo } from "react";

import { useHrStore } from "@/lib/hr/store";
import { useProductsStore } from "@/lib/products/store";
import { useSalesStore, useSessionOuverte } from "@/lib/sales/store";
import { soldeCaisse } from "@/lib/sales/types";
import { useSuppliersStore } from "@/lib/suppliers/store";

import {
  assistantFinancier,
  depensesConsolidees,
  fluxFinanciers,
  kpisFinanciers,
  previsionsFinancieres,
  progressionObjectifs,
  rentabiliteCategories,
  rentabiliteProduits,
  repartitionDepenses,
  resumeTresorerie,
} from "./analytics";
import { useFinanceStore } from "./store";
import { estCeMois } from "./types";

/**
 * Agrège en un seul endroit toutes les données financières issues des modules
 * Produits, Ventes, Caisse, Employés, Fournisseurs et Finances.
 * Aucune saisie en double : tout est dérivé des modules existants.
 */
export function useFinances() {
  const { produits } = useProductsStore();
  const { ventes, retours } = useSalesStore();
  const session = useSessionOuverte();
  const { bulletins, employes } = useHrStore();
  const { commandes, fournisseurs } = useSuppliersStore();
  const { depenses, creances, dettes, objectifs, notifications } = useFinanceStore();

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

    const montantCaisse = session ? soldeCaisse(session) : 0;

    const kpis = kpisFinanciers({
      ventes,
      produits,
      depenses: toutesDepenses,
      creances,
      dettes,
      montantCaisse,
    });

    const flux = fluxFinanciers({ ventes, retours, depenses: toutesDepenses });
    const tresorerie = resumeTresorerie(flux);

    const previsions = previsionsFinancieres({
      ventes,
      produits,
      depenses: toutesDepenses,
      soldeActuel: tresorerie.solde,
    });

    const rentabilites = rentabiliteProduits(ventes, produits);

    return {
      produits,
      ventes,
      retours,
      depenses,
      toutesDepenses,
      depensesDuMois: toutesDepenses.filter((d) => estCeMois(d.date)),
      creances,
      dettes,
      objectifs,
      notifications,
      kpis,
      flux,
      tresorerie,
      previsions,
      rentabilites,
      categoriesRentables: rentabiliteCategories(rentabilites),
      repartition: repartitionDepenses(toutesDepenses.filter((d) => estCeMois(d.date))),
      progression: progressionObjectifs(objectifs, kpis),
      conseils: assistantFinancier({
        ventes,
        produits,
        depenses: toutesDepenses,
        creances,
        dettes,
        kpis,
        objectifs,
        previsions,
      }),
    };
  }, [
    produits,
    ventes,
    retours,
    session,
    bulletins,
    employes,
    commandes,
    fournisseurs,
    depenses,
    creances,
    dettes,
    objectifs,
    notifications,
  ]);
}

export type DonneesFinancieres = ReturnType<typeof useFinances>;
