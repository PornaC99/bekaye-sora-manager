import { Link } from "@tanstack/react-router";
import { Bell, Menu, Search, ChevronDown } from "lucide-react";

import { navItems } from "@/lib/navigation";
import { useSession, nomAffiche, initialesUtilisateur } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { BrandMark } from "./brand-mark";
import { useShell } from "./shell-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

export function TopBar() {
  const { setMobileOpen } = useShell();
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const nom = nomAffiche(user);
  const initiales = initialesUtilisateur(nom);
  const identifiant = user?.email ?? "Session locale";

  async function seDeconnecter() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="grid h-16 grid-cols-[auto_1fr_auto] items-center gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border text-foreground transition-colors hover:bg-muted lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="lg:hidden">
            <BrandMark />
          </div>
        </div>

        <div className="flex min-w-0 justify-center lg:justify-start">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden h-10 w-full max-w-md items-center gap-2 rounded-lg border border-border bg-muted/60 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted sm:flex"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="truncate">Rechercher dans l'application…</span>
            <kbd className="ml-auto hidden rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground md:block">
              Ctrl K
            </kbd>
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Recherche globale"
            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-foreground transition-colors hover:bg-muted sm:hidden"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="relative grid h-9 w-9 place-items-center rounded-lg border border-border text-foreground transition-colors hover:bg-muted"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg border border-border py-1 pl-1 pr-2 transition-colors hover:bg-muted">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary text-[11px] font-semibold text-primary-foreground">
                {initiales}
              </span>
              <span className="hidden min-w-0 text-left sm:block">
                <span className="block truncate text-xs font-semibold leading-tight text-foreground">
                  {nom}
                </span>
                <span className="block truncate text-[10px] text-muted-foreground">
                  {identifiant}
                </span>
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <span className="block text-sm font-semibold">{nom}</span>
                <span className="block text-xs font-normal text-muted-foreground">
                  {identifiant}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/parametres">Mon profil</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/parametres">Paramètres</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => void seDeconnecter()}>
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Rechercher une page…" />
        <CommandList>
          <CommandEmpty>Aucun résultat.</CommandEmpty>
          <CommandGroup heading="Pages">
            {navItems.map((item) => (
              <CommandItem
                key={item.to}
                value={item.title}
                onSelect={() => {
                  setSearchOpen(false);
                  navigate({ to: item.to });
                }}
              >
                <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                {item.title}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
