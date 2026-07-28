import { useCallback, useSyncExternalStore } from "react";

/**
 * Thème clair / sombre de Bekaye Sora Business Manager.
 * Le choix est mémorisé dans le navigateur (localStorage) et appliqué
 * immédiatement sur <html> via la classe `dark`.
 */

export type Theme = "clair" | "sombre";

const CLE = "bsbm-theme";

let theme: Theme = "clair";
const listeners = new Set<() => void>();

function appliquer(valeur: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", valeur === "sombre");
  document.documentElement.style.colorScheme = valeur === "sombre" ? "dark" : "light";
}

function lireStockage(): Theme {
  if (typeof window === "undefined") return "clair";
  const enregistre = window.localStorage.getItem(CLE);
  if (enregistre === "sombre" || enregistre === "clair") return enregistre;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "sombre" : "clair";
}

/** Initialisation côté client (appelée au montage de l'application). */
export function initialiserTheme() {
  theme = lireStockage();
  appliquer(theme);
  listeners.forEach((l) => l());
}

export function definirTheme(valeur: Theme) {
  theme = valeur;
  if (typeof window !== "undefined") window.localStorage.setItem(CLE, valeur);
  appliquer(valeur);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => theme;
const getServerSnapshot = (): Theme => "clair";

export function useTheme() {
  const valeur = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const basculer = useCallback(() => {
    definirTheme(valeur === "sombre" ? "clair" : "sombre");
  }, [valeur]);
  return { theme: valeur, basculer, definirTheme };
}
