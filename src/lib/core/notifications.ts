import { useSyncExternalStore } from "react";

/**
 * Centre de liaisons de Bekaye Sora Business Manager.
 *
 * Tous les modules (Produits, Ventes, Caisse, Clients, Fournisseurs, Stock,
 * Inventaire, RH, Finances) publient ici leurs évènements métier.
 * Le centre sert de source unique pour la page Notifications, la cloche de la
 * barre supérieure, le flux mobile et les alertes NEXUSIA.
 */

export type ModuleSysteme =
  | "ventes"
  | "caisse"
  | "produits"
  | "stock"
  | "inventaire"
  | "clients"
  | "fournisseurs"
  | "finances"
  | "rh"
  | "systeme";

export const MODULE_LABEL: Record<ModuleSysteme, string> = {
  ventes: "Ventes",
  caisse: "Caisse",
  produits: "Produits",
  stock: "Stock",
  inventaire: "Inventaire",
  clients: "Clients",
  fournisseurs: "Fournisseurs",
  finances: "Finances",
  rh: "Employés",
  systeme: "Système",
};

export const MODULE_LIEN: Record<ModuleSysteme, string> = {
  ventes: "/ventes",
  caisse: "/caisse",
  produits: "/produits",
  stock: "/entrees-stock",
  inventaire: "/inventaire",
  clients: "/clients",
  fournisseurs: "/fournisseurs",
  finances: "/depenses",
  rh: "/employes",
  systeme: "/administration",
};

export type TonEvenement = "info" | "succes" | "alerte" | "danger";

export const TON_CLASSE: Record<TonEvenement, string> = {
  info: "bg-primary-soft text-primary",
  succes: "bg-success/10 text-success",
  alerte: "bg-amber-500/10 text-amber-600",
  danger: "bg-destructive/10 text-destructive",
};

export type EvenementSysteme = {
  id: string;
  date: string;
  module: ModuleSysteme;
  ton: TonEvenement;
  titre: string;
  message: string;
  lien: string;
  lu: boolean;
};

type State = { evenements: EvenementSysteme[] };

let state: State = { evenements: [] };

const listeners = new Set<() => void>();

function setState(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => state;

let compteur = 0;

/** Publie un évènement métier dans le centre de liaisons. */
export function publier(input: {
  module: ModuleSysteme;
  ton?: TonEvenement;
  titre: string;
  message: string;
  lien?: string;
  date?: string;
}) {
  const evenement: EvenementSysteme = {
    id: `EV-${Date.now()}-${(compteur += 1)}`,
    date: input.date ?? new Date().toISOString(),
    module: input.module,
    ton: input.ton ?? "info",
    titre: input.titre,
    message: input.message,
    lien: input.lien ?? MODULE_LIEN[input.module],
    lu: false,
  };
  setState({ evenements: [evenement, ...state.evenements].slice(0, 200) });
  return evenement;
}

/** Évite les doublons pour les alertes récurrentes (rupture, retard, etc.). */
export function publierUnique(
  cle: string,
  input: Parameters<typeof publier>[0],
  fenetreMs = 6 * 60 * 60 * 1000,
) {
  const limite = Date.now() - fenetreMs;
  const existe = state.evenements.some(
    (e) => e.titre === cle && new Date(e.date).getTime() > limite,
  );
  if (existe) return null;
  return publier({ ...input, titre: cle });
}

export function useCentreNotifications() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function marquerLu(id: string) {
  setState({
    evenements: state.evenements.map((e) => (e.id === id ? { ...e, lu: true } : e)),
  });
}

export function toutMarquerLu() {
  setState({ evenements: state.evenements.map((e) => ({ ...e, lu: true })) });
}

export function supprimerEvenement(id: string) {
  setState({ evenements: state.evenements.filter((e) => e.id !== id) });
}

export function viderCentre() {
  setState({ evenements: [] });
}

export const lireEvenements = () => state.evenements;
export const compterNonLus = () => state.evenements.filter((e) => !e.lu).length;
