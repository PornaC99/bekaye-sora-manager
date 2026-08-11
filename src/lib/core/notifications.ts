import { useSyncExternalStore } from "react";

import { supabase } from "@/integrations/supabase/client";
import { lireEntrepriseId } from "@/lib/db/tenant";

/**
 * Centre de liaisons de Bekaye Sora Business Manager.
 *
 * Tous les modules (Produits, Ventes, Caisse, Clients, Fournisseurs, Stock,
 * Inventaire, RH, Finances) publient ici leurs évènements métier.
 * Le centre sert de source unique pour la page Notifications, la cloche de la
 * barre supérieure, le flux mobile et les alertes NEXUSIA.
 *
 * Les évènements sont conservés dans Supabase (table `notifications`) afin de
 * survivre au rechargement de la page et d'être partagés entre les appareils.
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
  /** `direction` = notification de supervision (visible par la direction seule). */
  audience: "tous" | "direction";
  acteur: string;
  montant: number | null;
  quantite: number | null;
  entite: string | null;
  entiteId: string | null;
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

/* ------------------------------------------------------------------ */
/* Persistance Supabase                                                 */
/* ------------------------------------------------------------------ */

const MODULES = Object.keys(MODULE_LABEL) as ModuleSysteme[];
const TONS: TonEvenement[] = ["info", "succes", "alerte", "danger"];

const estModule = (v: string | null): v is ModuleSysteme =>
  !!v && (MODULES as string[]).includes(v);
const estTon = (v: string | null): v is TonEvenement => !!v && (TONS as string[]).includes(v);

const CHAMPS =
  "id, titre, message, type, priorite, lien, lue, created_at, audience, acteur, montant, quantite, entite, entite_id";

type LigneNotification = {
  id: string;
  titre: string;
  message: string | null;
  type: string | null;
  priorite: string | null;
  lien: string | null;
  lue: boolean;
  created_at: string;
  audience?: string | null;
  acteur?: string | null;
  montant?: number | null;
  quantite?: number | null;
  entite?: string | null;
  entite_id?: string | null;
};

function versEvenement(n: LigneNotification): EvenementSysteme {
  const module = estModule(n.type) ? n.type : "systeme";
  return {
    id: n.id,
    date: n.created_at,
    module,
    ton: estTon(n.priorite) ? n.priorite : "info",
    titre: n.titre,
    message: n.message ?? "",
    lien: n.lien ?? MODULE_LIEN[module],
    lu: n.lue,
    audience: n.audience === "direction" ? "direction" : "tous",
    acteur: n.acteur ?? "",
    montant: n.montant ?? null,
    quantite: n.quantite ?? null,
    entite: n.entite ?? null,
    entiteId: n.entite_id ?? null,
  };
}

function fusionner(distantes: EvenementSysteme[]) {
  const connus = new Set(distantes.map((e) => e.id));
  const fusion = [...state.evenements.filter((e) => !connus.has(e.id)), ...distantes].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  setState({ evenements: fusion.slice(0, 200) });
}

/** Charge l'historique depuis Supabase (appelé une fois au démarrage). */
export async function chargerNotifications() {
  try {
    const entrepriseId = await lireEntrepriseId();
    if (!entrepriseId) return;
    const { data, error } = await supabase
      .from("notifications")
      .select(CHAMPS)
      .eq("entreprise_id", entrepriseId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error || !data) return;
    // Le RLS filtre déjà les notifications de direction : un caissier ne
    // reçoit jamais les lignes destinées au directeur.
    fusionner((data as LigneNotification[]).map(versEvenement));
  } catch {
    // Mode hors ligne / non authentifié : le centre reste local.
  }
}

let canal: ReturnType<typeof supabase.channel> | null = null;

/** Abonnement temps réel : les nouvelles notifications arrivent sans rechargement. */
export async function demarrerTempsReelNotifications() {
  if (canal) return;
  const entrepriseId = await lireEntrepriseId();
  if (!entrepriseId) return;
  canal = supabase
    .channel(`notifications-${entrepriseId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `entreprise_id=eq.${entrepriseId}`,
      },
      () => {
        // On relit via l'API : le RLS reste l'unique arbitre de la visibilité.
        void chargerNotifications();
      },
    )
    .subscribe();
}

export function arreterTempsReelNotifications() {
  if (!canal) return;
  void supabase.removeChannel(canal);
  canal = null;
}


async function persister(evenement: EvenementSysteme) {
  try {
    const entrepriseId = await lireEntrepriseId();
    if (!entrepriseId) return;
    const { data: auth } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        entreprise_id: entrepriseId,
        user_id: auth.user?.id ?? null,
        titre: evenement.titre,
        message: evenement.message,
        type: evenement.module,
        priorite: evenement.ton,
        lien: evenement.lien,
        lue: evenement.lu,
        created_at: evenement.date,
      })
      .select("id")
      .single();
    if (error || !data) return;
    // Remplace l'identifiant local par celui de la base.
    setState({
      evenements: state.evenements.map((e) =>
        e.id === evenement.id ? { ...e, id: data.id } : e,
      ),
    });
  } catch {
    // Persistance best-effort : l'affichage local reste correct.
  }
}

const estIdLocal = (id: string) => id.startsWith("EV-");

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
  void persister(evenement);
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
  if (!estIdLocal(id)) void supabase.from("notifications").update({ lue: true }).eq("id", id);
}

export function toutMarquerLu() {
  const ids = state.evenements.filter((e) => !e.lu && !estIdLocal(e.id)).map((e) => e.id);
  setState({ evenements: state.evenements.map((e) => ({ ...e, lu: true })) });
  if (ids.length) void supabase.from("notifications").update({ lue: true }).in("id", ids);
}

export function supprimerEvenement(id: string) {
  setState({ evenements: state.evenements.filter((e) => e.id !== id) });
  if (!estIdLocal(id)) void supabase.from("notifications").delete().eq("id", id);
}

export function viderCentre() {
  const ids = state.evenements.filter((e) => !estIdLocal(e.id)).map((e) => e.id);
  setState({ evenements: [] });
  if (ids.length) void supabase.from("notifications").delete().in("id", ids);
}

export const lireEvenements = () => state.evenements;
export const compterNonLus = () => state.evenements.filter((e) => !e.lu).length;
