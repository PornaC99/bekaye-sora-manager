import { Link, useRouterState } from "@tanstack/react-router";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

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
    <nav className="flex flex-col gap-5 px-3 pb-6">
      {sections.map((section) => (
        <div key={section.label} className="flex flex-col gap-1">
          {!compact && (
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
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
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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

  return (
    <div className={cn("lg:hidden", !mobileOpen && "pointer-events-none")}>
      <div
        onClick={() => setMobileOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-foreground/40 transition-opacity duration-200",
          mobileOpen ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center border-b border-sidebar-border px-4">
          <BrandMark />
        </div>
        <div className="scrollbar-slim mt-3 flex-1 overflow-y-auto">
          <NavLinks onNavigate={() => setMobileOpen(false)} />
        </div>
        <div className="border-t border-sidebar-border px-5 py-4">
          <p className="font-display text-xs font-medium text-foreground">{BRAND.slogan}</p>
        </div>
      </div>
    </div>
  );
}
