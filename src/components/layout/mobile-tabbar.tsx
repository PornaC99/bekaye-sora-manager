import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, Menu, Package, Receipt, ShoppingCart } from "lucide-react";

import { useRoleActuel } from "@/hooks/use-role";
import { peutAcceder } from "@/lib/access/roles";
import { cn } from "@/lib/utils";
import { useShell } from "./shell-context";

const ONGLETS = [
  { to: "/", label: "Accueil", icon: LayoutGrid },
  { to: "/ventes", label: "Ventes", icon: Receipt },
  { to: "/caisse", label: "Caisse", icon: ShoppingCart },
  { to: "/produits", label: "Produits", icon: Package },
] as const;

/**
 * Barre d'onglets inférieure — navigation principale sur smartphone.
 * Masquée à partir de `lg` où la barre latérale reprend la main.
 */
export function MobileTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { role } = useRoleActuel();
  const { setMobileOpen, mobileOpen } = useShell();

  const onglets = ONGLETS.filter((o) => peutAcceder(role, o.to));

  return (
    <nav
      aria-label="Navigation principale"
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-lg lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {onglets.map((onglet) => {
          const actif = onglet.to === "/" ? pathname === "/" : pathname.startsWith(onglet.to);
          return (
            <li key={onglet.to}>
              <Link
                to={onglet.to}
                aria-current={actif ? "page" : undefined}
                className={cn(
                  "tap flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2",
                  actif ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-12 place-items-center rounded-full transition-colors",
                    actif && "bg-primary-soft",
                  )}
                >
                  <onglet.icon className="h-[18px] w-[18px]" strokeWidth={actif ? 2.4 : 1.8} />
                </span>
                <span className="max-w-full truncate text-[10px] font-medium leading-none">
                  {onglet.label}
                </span>
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Ouvrir le menu complet"
            aria-expanded={mobileOpen}
            className={cn(
              "tap flex min-h-[56px] w-full flex-col items-center justify-center gap-1 px-1 py-2",
              mobileOpen ? "text-primary" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "grid h-7 w-12 place-items-center rounded-full transition-colors",
                mobileOpen && "bg-primary-soft",
              )}
            >
              <Menu className="h-[18px] w-[18px]" />
            </span>
            <span className="text-[10px] font-medium leading-none">Menu</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
