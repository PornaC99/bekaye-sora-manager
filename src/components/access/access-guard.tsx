import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useRoleActuel } from "@/hooks/use-role";
import { LABEL_ROLE, peutAcceder } from "@/lib/access/roles";

/**
 * Garde d'accès global : vérifie que le rôle de l'utilisateur autorise la
 * route demandée, y compris lorsque l'URL est saisie directement.
 */
export function AccessGuard({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { role, chargement } = useRoleActuel();

  if (chargement) return <>{children}</>;
  if (peutAcceder(role, pathname)) return <>{children}</>;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft">
        <ShieldAlert className="h-6 w-6 text-primary" />
      </span>
      <h1 className="font-display text-xl font-semibold text-foreground">Accès non autorisé</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Votre profil <strong className="text-foreground">{LABEL_ROLE[role]}</strong> ne dispose pas
        des permissions nécessaires pour ouvrir cette page. Contactez le Directeur si vous pensez
        qu'il s'agit d'une erreur.
      </p>
      <Button asChild>
        <Link to="/">Retour au tableau de bord</Link>
      </Button>
    </div>
  );
}
