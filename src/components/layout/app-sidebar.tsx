import { Link, useRouterState } from "@tanstack/react-router";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useRoleActuel } from "@/hooks/use-role";
import { peutAcceder } from "@/lib/access/roles";
import { cn } from "@/lib/utils";
import { BRAND, navSections } from "@/lib/navigation";
import { BrandMark } from "./brand-mark";
import { useShell } from "./shell-context";

function NavLinks({ onNavigate, compact }: { onNavigate?: () => void; compact?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { role } = useRoleActuel();

  const sections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => peutAcceder(role, item.to)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <nav className="flex flex-col gap-3 px-2.5 pb-4 lg:gap-5 lg:px-3 lg:pb-6">
      {sections.map((section) => (
        <div key={section.label} className="flex flex-col gap-0.5 lg:gap-1">
          {!compact && (
            <p className="px-3 pb-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {section.label}
            </p>
          )}
          {section.items.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                title={compact ? item.title : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "tap group relative flex min-h-[40px] items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors lg:min-h-[44px] lg:py-2.5 lg:text-sm",
                  compact && "justify-center px-0",
                  active
                    ? "bg-primary-soft text-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                )}
                <item.icon
                  className={cn("h-[18px] w-[18px] shrink-0", active && "text-primary")}
                  strokeWidth={active ? 2.3 : 1.8}
                />
                {!compact && <span className="truncate">{item.title}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function AppSidebar() {
  const { collapsed, toggleCollapsed } = useShell();

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex",
        collapsed ? "w-[76px]" : "w-[264px]",
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-sidebar-border px-4",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        <BrandMark compact={collapsed} />
        {!collapsed && (
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label="Replier le menu"
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label="Déplier le menu"
          className="mx-auto mt-3 grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}

      <div className="scrollbar-slim mt-3 flex-1 overflow-y-auto">
        <NavLinks compact={collapsed} />
      </div>

      {!collapsed && (
        <div className="border-t border-sidebar-border px-5 py-4">
          <p className="font-display text-xs font-medium text-foreground">{BRAND.slogan}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Version 1.0 · Structure</p>
        </div>
      )}
    </aside>
  );
}

export function MobileSidebar() {
  const { mobileOpen, setMobileOpen } = useShell();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [dragX, setDragX] = useState(0);
  const depart = useRef<number | null>(null);

  /* Fermeture automatique après changement de page */
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  /* Blocage du défilement de l'arrière-plan pendant l'ouverture */
  useEffect(() => {
    if (typeof document === "undefined") return;
    const precedent = document.body.style.overflow;
    if (mobileOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = precedent;
    };
  }, [mobileOpen]);

  /* Geste : glisser vers la gauche pour fermer */
  function onTouchStart(e: React.TouchEvent) {
    depart.current = e.touches[0].clientX;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (depart.current === null) return;
    setDragX(Math.min(0, e.touches[0].clientX - depart.current));
  }
  function onTouchEnd() {
    if (dragX < -70) setMobileOpen(false);
    depart.current = null;
    setDragX(0);
  }

  return (
    <div className={cn("lg:hidden", !mobileOpen && "pointer-events-none")}>
      <div
        onClick={() => setMobileOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-foreground/50 backdrop-blur-[2px] transition-opacity duration-200",
          mobileOpen ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={dragX ? { transform: `translateX(${dragX}px)`, transition: "none" } : undefined}
        className={cn(
          "safe-top safe-bottom fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-[320px] flex-col border-r border-sidebar-border bg-sidebar shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-sidebar-border px-4">
          <div className="min-w-0">
            <BrandMark />
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer le menu"
            className="tap grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-sidebar-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="scrollbar-slim flex-1 overflow-y-auto overscroll-contain pt-2">
          {/* Profil utilisateur déplacé de l'en-tête vers le menu */}
          <div className="mx-2.5 mb-3 rounded-2xl border border-sidebar-border bg-sidebar-accent/40 p-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {initiales}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{nom}</p>
                <p className="truncate text-[11px] text-muted-foreground">{identifiant}</p>
              </div>
              <ThemeToggle />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                to="/parametres"
                onClick={() => setMobileOpen(false)}
                className="tap flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-sidebar-border bg-background text-xs font-medium text-foreground"
              >
                <User className="h-3.5 w-3.5" /> Mon profil
              </Link>
              <button
                type="button"
                onClick={() => void seDeconnecter()}
                className="tap flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 text-xs font-medium text-destructive"
              >
                <LogOut className="h-3.5 w-3.5" /> Déconnexion
              </button>
            </div>
          </div>
          <NavLinks onNavigate={() => setMobileOpen(false)} />
        </div>
        <div className="shrink-0 border-t border-sidebar-border px-5 py-2.5">
          <p className="font-display text-[11px] font-medium text-foreground">{BRAND.slogan}</p>
        </div>
      </div>
    </div>
  );
}
