import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  ChevronRight,
  Fingerprint,
  Globe,
  LogOut,
  Moon,
  Radio,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { MobileCard, MobilePage, MobileSection } from "@/components/mobile/shell";
import { Switch } from "@/components/ui/switch";
import { deconnecter, majPreferences, useMobileSession } from "@/lib/mobile/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mobile/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres — Bekaye Sora Mobile" },
      {
        name: "description",
        content: "Profil, notifications push, sécurité biométrique, langue et mode sombre.",
      },
      { property: "og:title", content: "Paramètres — Bekaye Sora Mobile" },
      {
        property: "og:description",
        content: "Personnalisez l'application mobile du Directeur en quelques secondes.",
      },
    ],
  }),
  component: ParametresMobile,
});

function ParametresMobile() {
  const { session, preferences } = useMobileSession();
  const navigate = useNavigate();

  const bascules = [
    {
      cle: "notificationsPush" as const,
      label: "Notifications push",
      description: "Ventes, livraisons, caisse, dépenses",
      icone: Bell,
    },
    {
      cle: "alertesStock" as const,
      label: "Alertes de stock",
      description: "Rupture et stock faible",
      icone: ShieldCheck,
    },
    {
      cle: "alertesCaisse" as const,
      label: "Alertes de caisse",
      description: "Ouverture, fermeture et écarts",
      icone: ShieldCheck,
    },
    {
      cle: "biometrie" as const,
      label: "Connexion biométrique",
      description: "Empreinte digitale et reconnaissance faciale",
      icone: Fingerprint,
    },
    {
      cle: "surveillanceLive" as const,
      label: "Surveillance en direct",
      description: "Actualisation automatique du tableau de bord",
      icone: Radio,
    },
  ];

  return (
    <MobilePage titre="Paramètres" sousTitre="Profil, sécurité et préférences">
      <MobileCard>
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary font-display text-base font-semibold text-primary-foreground">
            {(session?.nom ?? "BS")
              .split(" ")
              .map((m) => m[0])
              .join("")
              .slice(0, 2)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold text-foreground">
              {session?.nom}
            </p>
            <p className="truncate text-xs text-muted-foreground">{session?.fonction}</p>
            <p className="truncate text-xs text-muted-foreground">{session?.email}</p>
          </div>
        </div>
      </MobileCard>

      <MobileSection titre="Notifications & sécurité">
        <div className="space-y-2">
          {bascules.map((b) => (
            <MobileCard key={b.cle} className="p-3">
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                  <b.icone className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{b.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{b.description}</p>
                </div>
                <Switch
                  checked={preferences[b.cle]}
                  onCheckedChange={(valeur) => majPreferences({ [b.cle]: valeur })}
                  aria-label={b.label}
                />
              </div>
            </MobileCard>
          ))}
        </div>
      </MobileSection>

      <MobileSection titre="Apparence & langue">
        <MobileCard className="p-3">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
              <Moon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">Mode sombre</p>
              <p className="truncate text-xs text-muted-foreground">Confort visuel de nuit</p>
            </div>
            <Switch
              checked={preferences.theme === "sombre"}
              onCheckedChange={(valeur) => majPreferences({ theme: valeur ? "sombre" : "clair" })}
              aria-label="Mode sombre"
            />
          </div>
        </MobileCard>

        <MobileCard className="p-3">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
              <Globe className="h-4 w-4" />
            </span>
            <p className="truncate text-sm font-medium text-foreground">Langue</p>
            <div className="flex gap-1">
              {(["fr", "en"] as const).map((langue) => (
                <button
                  key={langue}
                  type="button"
                  onClick={() => majPreferences({ langue })}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase transition-colors",
                    preferences.langue === langue
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground",
                  )}
                >
                  {langue}
                </button>
              ))}
            </div>
          </div>
        </MobileCard>
      </MobileSection>

      <MobileSection titre="Raccourcis">
        <div className="space-y-2">
          {[
            { to: "/mobile/produits", label: "Produits & stock", icon: UserRound },
            { to: "/mobile/employes", label: "Équipe", icon: UserRound },
            { to: "/mobile/clients", label: "Clients VIP", icon: UserRound },
            { to: "/mobile/rapports", label: "Rapports", icon: UserRound },
            { to: "/mobile/alertes", label: "Alertes critiques", icon: UserRound },
          ].map((item) => (
            <Link key={item.to} to={item.to}>
              <MobileCard className="flex items-center justify-between p-3">
                <span className="truncate text-sm font-medium text-foreground">{item.label}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </MobileCard>
            </Link>
          ))}
        </div>
      </MobileSection>

      <button
        type="button"
        onClick={() => {
          deconnecter();
          navigate({ to: "/mobile/connexion", replace: true });
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 py-3 text-sm font-semibold text-destructive transition-transform active:scale-[0.98]"
      >
        <LogOut className="h-4 w-4" />
        Se déconnecter
      </button>
    </MobilePage>
  );
}
