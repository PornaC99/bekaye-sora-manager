import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Home,
  LineChart,
  Package,
  Radio,
  Search,
  Settings,
  Sparkles,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { useNotificationsMobile } from "@/lib/mobile/feed";
import { hydraterMobile, majPreferences, useMobileSession } from "@/lib/mobile/session";

const ONGLETS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/mobile", label: "Accueil", icon: Home },
  { to: "/mobile/direct", label: "En direct", icon: Radio },
  { to: "/mobile/assistant", label: "Assistant", icon: Sparkles },
  { to: "/mobile/finances", label: "Finances", icon: LineChart },
  { to: "/mobile/parametres", label: "Réglages", icon: Settings },
];

export function MobileFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-surface">
      <div className="mx-auto w-full max-w-md bg-background pb-24 shadow-[0_0_60px_-25px_rgba(0,0,0,0.35)]">
        {children}
      </div>
    </div>
  );
}

/** Page mobile protégée : redirige vers la connexion si aucune session. */
export function MobilePage({
  titre,
  sousTitre,
  children,
  entete,
  sansEntete,
}: {
  titre?: string;
  sousTitre?: string;
  children: ReactNode;
  entete?: ReactNode;
  sansEntete?: boolean;
}) {
  const { pret, session } = useMobileSession();
  const navigate = useNavigate();

  useEffect(() => {
    hydraterMobile();
  }, []);

  useEffect(() => {
    if (pret && !session) navigate({ to: "/mobile/connexion", replace: true });
  }, [pret, session, navigate]);

  if (!pret || !session) {
    return (
      <MobileFrame>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
        </div>
      </MobileFrame>
    );
  }

  return (
    <MobileFrame>
      {!sansEntete && (entete ?? <MobileTopBar titre={titre} sousTitre={sousTitre} />)}
      <main className="animate-in fade-in slide-in-from-bottom-2 space-y-5 px-4 pt-4 duration-500">
        {children}
      </main>
      <MobileTabBar />
    </MobileFrame>
  );
}

export function MobileTopBar({ titre, sousTitre }: { titre?: string; sousTitre?: string }) {
  const notifications = useNotificationsMobile();
  const nonLues = notifications.filter((n) => !n.lue).length;
  const { preferences } = useMobileSession();

  return (
    <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur-xl">
      <div className="min-w-0">
        <h1 className="truncate font-display text-lg font-semibold text-foreground">
          {titre ?? "Bekaye Sora"}
        </h1>
        {sousTitre && <p className="truncate text-xs text-muted-foreground">{sousTitre}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          aria-label="Changer le thème"
          onClick={() =>
            majPreferences({ theme: preferences.theme === "sombre" ? "clair" : "sombre" })
          }
          className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors active:scale-95"
        >
          {preferences.theme === "sombre" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
        <Link
          to="/mobile/recherche"
          aria-label="Recherche globale"
          className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors active:scale-95"
        >
          <Search className="h-4 w-4" />
        </Link>
        <Link
          to="/mobile/notifications"
          aria-label="Notifications"
          className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors active:scale-95"
        >
          <Bell className="h-4 w-4" />
          {nonLues > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {nonLues > 9 ? "9+" : nonLues}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}

function MobileTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-border/70 bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <ul className="grid grid-cols-5">
        {ONGLETS.map((onglet) => {
          const actif =
            onglet.to === "/mobile" ? pathname === "/mobile" : pathname.startsWith(onglet.to);
          return (
            <li key={onglet.to}>
              <Link
                to={onglet.to}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl py-2.5 text-[10px] font-medium transition-all active:scale-95",
                  actif ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-full transition-colors",
                    actif && "bg-primary-soft",
                  )}
                >
                  <onglet.icon className="h-[18px] w-[18px]" />
                </span>
                {onglet.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileSection({
  titre,
  action,
  children,
}: {
  titre: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h2 className="truncate font-display text-sm font-semibold text-foreground">{titre}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function MobileCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MobileEmpty({ message }: { message: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
      {message}
    </p>
  );
}

export { Package as IconePaquet };
