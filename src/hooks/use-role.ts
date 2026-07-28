import { useSyncExternalStore } from "react";

import { useEntreprise } from "@/hooks/use-entreprise";
import { roleDepuisBase, type RoleCle } from "@/lib/access/roles";

/**
 * Rôle de l'utilisateur connecté (lu depuis la base) avec possibilité de
 * simulation locale — utile en démonstration pour montrer l'interface telle
 * que la voit un caissier, un comptable ou un magasinier.
 */

const CLE = "bsbm-role-simule";
const listeners = new Set<() => void>();

function lire(): RoleCle | null {
  if (typeof window === "undefined") return null;
  const valeur = window.localStorage.getItem(CLE);
  return (valeur as RoleCle | null) || null;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

let cache: RoleCle | null = null;
let initialise = false;

function getSnapshot(): RoleCle | null {
  if (!initialise) {
    cache = lire();
    initialise = true;
  }
  return cache;
}

export function simulerRole(role: RoleCle | null) {
  if (typeof window !== "undefined") {
    if (role) window.localStorage.setItem(CLE, role);
    else window.localStorage.removeItem(CLE);
  }
  cache = role;
  initialise = true;
  listeners.forEach((l) => l());
}

export function useRoleActuel() {
  const simule = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => null as RoleCle | null,
  );
  const { data, isLoading } = useEntreprise();
  const reel = roleDepuisBase(data?.role);

  return {
    role: simule ?? reel,
    reel,
    simule,
    chargement: isLoading,
  };
}
