import { useSyncExternalStore } from "react";

import { supabase } from "@/integrations/supabase/client";
import { lireEntrepriseId } from "@/lib/db/tenant";
import { viderCentre } from "@/lib/core/notifications";
import { reinitialiserVentesDemo } from "@/lib/sales/store";
import { reinitialiserFinancesDemo } from "@/lib/finance/store";
import { reinitialiserInventairesDemo } from "@/lib/inventory/store";

/**
 * Réinitialisation des données de démonstration.
 * Remet à zéro l'activité (ventes, caisse, dépenses, notifications, rapports,
 * statistiques et compteurs du tableau de bord) sans toucher aux référentiels :
 * produits, catégories, fournisseurs, employés et paramètres restent intacts.
 */

const CLE = "bsbm-demo-vierge";

let vierge = false;
const listeners = new Set<() => void>();

function notifier() {
  listeners.forEach((l) => l());
}

export function initialiserEtatDemo() {
  if (typeof window === "undefined") return;
  vierge = window.localStorage.getItem(CLE) === "1";
  notifier();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => vierge;
const getServerSnapshot = () => false;

/** Indique si l'activité de démonstration a été remise à zéro. */
export function useDemoVierge() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Tables transactionnelles remises à zéro (dans l'ordre des dépendances). */
const TABLES_TRANSACTIONNELLES = [
  "paiements_vente",
  "lignes_vente",
  "lignes_retour",
  "retours",
  "ventes",
  "mouvements_stock",
  "sessions_caisse",
  "transactions_tresorerie",
  "depenses",
  "notifications",
  "lignes_inventaire",
  "inventaires",
] as const;

async function viderSupabase() {
  const entrepriseId = await lireEntrepriseId();
  if (!entrepriseId) return;

  for (const table of TABLES_TRANSACTIONNELLES) {
    try {
      if (table === "lignes_vente" || table === "paiements_vente") {
        const { data } = await supabase.from("ventes").select("id").eq("entreprise_id", entrepriseId);
        const ids = (data ?? []).map((v) => v.id);
        if (ids.length) await supabase.from(table).delete().in("vente_id", ids);
        continue;
      }
      if (table === "lignes_retour") {
        const { data } = await supabase
          .from("retours")
          .select("id")
          .eq("entreprise_id", entrepriseId);
        const ids = (data ?? []).map((r) => r.id);
        if (ids.length) await supabase.from(table).delete().in("retour_id", ids);
        continue;
      }
      if (table === "lignes_inventaire") {
        const { data } = await supabase
          .from("inventaires")
          .select("id")
          .eq("entreprise_id", entrepriseId);
        const ids = (data ?? []).map((i) => i.id);
        if (ids.length) await supabase.from(table).delete().in("inventaire_id", ids);
        continue;
      }
      await supabase.from(table).delete().eq("entreprise_id", entrepriseId);
    } catch {
      // Les tables non utilisées par la démonstration sont simplement ignorées.
    }
  }
}

export async function reinitialiserDonneesDemo() {
  reinitialiserVentesDemo();
  reinitialiserFinancesDemo();
  reinitialiserInventairesDemo();
  viderCentre();

  vierge = true;
  if (typeof window !== "undefined") window.localStorage.setItem(CLE, "1");
  notifier();

  await viderSupabase();
}
