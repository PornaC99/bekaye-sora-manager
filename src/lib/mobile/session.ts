import { useSyncExternalStore } from "react";

/**
 * Session locale de l'application mobile du Directeur.
 * Volontairement isolée : lors du branchement sur Lovable Cloud, il suffira de
 * remplacer `connecter` / `deconnecter` par des appels d'authentification
 * (mêmes signatures), le reste de l'interface restera inchangé.
 */

export type MethodeConnexion = "mot_de_passe" | "empreinte" | "visage";

export type SessionDirecteur = {
  nom: string;
  fonction: string;
  email: string;
  telephone: string;
  photo: string | null;
  methode: MethodeConnexion;
  connecteLe: string;
};

export type PreferencesMobile = {
  theme: "clair" | "sombre";
  langue: "fr" | "en";
  notificationsPush: boolean;
  alertesStock: boolean;
  alertesCaisse: boolean;
  biometrie: boolean;
  surveillanceLive: boolean;
};

export const DIRECTEUR = {
  nom: "Bekaye Sora",
  fonction: "Directeur général",
  email: "directeur@bekayesora.com",
  telephone: "+223 76 00 05 01",
  photo: null as string | null,
};

const CLE_SESSION = "bsm.mobile.session";
const CLE_PREFS = "bsm.mobile.preferences";
const CLE_LUES = "bsm.mobile.notifications.lues";

const PREFS_DEFAUT: PreferencesMobile = {
  theme: "clair",
  langue: "fr",
  notificationsPush: true,
  alertesStock: true,
  alertesCaisse: true,
  biometrie: true,
  surveillanceLive: true,
};

type State = {
  pret: boolean;
  session: SessionDirecteur | null;
  preferences: PreferencesMobile;
  lues: string[];
};

let state: State = { pret: false, session: null, preferences: PREFS_DEFAUT, lues: [] };

const listeners = new Set<() => void>();
const getSnapshot = () => state;
const getServerSnapshot = () => state;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setState(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function lireJSON<T>(cle: string, defaut: T): T {
  try {
    const brut = window.localStorage.getItem(cle);
    return brut ? ({ ...defaut, ...(JSON.parse(brut) as object) } as T) : defaut;
  } catch {
    return defaut;
  }
}

function ecrireJSON(cle: string, valeur: unknown) {
  try {
    window.localStorage.setItem(cle, JSON.stringify(valeur));
  } catch {
    /* stockage indisponible : la session reste en mémoire */
  }
}

export function appliquerTheme(theme: PreferencesMobile["theme"]) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "sombre");
}

/** À appeler une fois côté client (layout mobile). */
export function hydraterMobile() {
  if (typeof window === "undefined" || state.pret) return;
  const preferences = lireJSON<PreferencesMobile>(CLE_PREFS, PREFS_DEFAUT);
  let session: SessionDirecteur | null = null;
  try {
    const brut = window.localStorage.getItem(CLE_SESSION);
    session = brut ? (JSON.parse(brut) as SessionDirecteur) : null;
  } catch {
    session = null;
  }
  const lues = lireJSON<{ ids: string[] }>(CLE_LUES, { ids: [] }).ids ?? [];
  appliquerTheme(preferences.theme);
  setState({ pret: true, session, preferences, lues });
}

export function useMobileSession() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function connecter(input: {
  identifiant?: string;
  methode: MethodeConnexion;
}): SessionDirecteur {
  const session: SessionDirecteur = {
    ...DIRECTEUR,
    email: input.identifiant?.includes("@") ? input.identifiant : DIRECTEUR.email,
    telephone: input.identifiant?.startsWith("+") ? input.identifiant : DIRECTEUR.telephone,
    methode: input.methode,
    connecteLe: new Date().toISOString(),
  };
  ecrireJSON(CLE_SESSION, session);
  setState({ session, pret: true });
  return session;
}

export function deconnecter() {
  try {
    window.localStorage.removeItem(CLE_SESSION);
  } catch {
    /* ignore */
  }
  setState({ session: null });
}

export function majPreferences(patch: Partial<PreferencesMobile>) {
  const preferences = { ...state.preferences, ...patch };
  ecrireJSON(CLE_PREFS, preferences);
  if (patch.theme) appliquerTheme(patch.theme);
  setState({ preferences });
}

export function marquerLue(id: string) {
  if (state.lues.includes(id)) return;
  const lues = [...state.lues, id];
  ecrireJSON(CLE_LUES, { ids: lues });
  setState({ lues });
}

export function marquerToutLu(ids: string[]) {
  const lues = Array.from(new Set([...state.lues, ...ids]));
  ecrireJSON(CLE_LUES, { ids: lues });
  setState({ lues });
}

export function reinitialiserLues() {
  ecrireJSON(CLE_LUES, { ids: [] });
  setState({ lues: [] });
}
