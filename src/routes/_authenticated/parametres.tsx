import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Building2,
  Database,
  Palette,
  Shield,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page";
import { DemoResetCard } from "@/components/admin/demo-reset-card";
import {
  SectionApparence,
  SectionEntreprise,
  SectionPreferences,
  SectionProfil,
  SectionSauvegarde,
  SectionSecurite,
} from "@/components/settings/sections";
import { cn } from "@/lib/utils";

const TITLE = "Paramètres";
const DESCRIPTION =
  "Centre de configuration : entreprise, profil, apparence, préférences, sécurité et sauvegardes.";

export const Route = createFileRoute("/_authenticated/parametres")({
  head: () => ({
    meta: [
      { title: `${TITLE} — Bekaye Sora Business Manager` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `${TITLE} — Bekaye Sora Business Manager` },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Page,
});

const ONGLETS = [
  { cle: "entreprise", label: "Entreprise", icon: Building2 },
  { cle: "profil", label: "Mon profil", icon: UserRound },
  { cle: "apparence", label: "Apparence", icon: Palette },
  { cle: "preferences", label: "Préférences", icon: SlidersHorizontal },
  { cle: "securite", label: "Sécurité", icon: Shield },
  { cle: "donnees", label: "Sauvegarde & données", icon: Database },
] as const;

type Onglet = (typeof ONGLETS)[number]["cle"];

function Page() {
  const [onglet, setOnglet] = useState<Onglet>("entreprise");

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-5">
      <PageHeader eyebrow="Système" title={TITLE} description={DESCRIPTION} />

      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1 shadow-[var(--shadow-card)]">
        {ONGLETS.map((o) => (
          <button
            key={o.cle}
            type="button"
            onClick={() => setOnglet(o.cle)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
              onglet === o.cle
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <o.icon className="h-4 w-4" />
            {o.label}
          </button>
        ))}
      </div>

      <div className="animate-in flex flex-col gap-4 fade-in">
        {onglet === "entreprise" && <SectionEntreprise />}
        {onglet === "profil" && <SectionProfil />}
        {onglet === "apparence" && <SectionApparence />}
        {onglet === "preferences" && <SectionPreferences />}
        {onglet === "securite" && <SectionSecurite />}
        {onglet === "donnees" && (
          <>
            <SectionSauvegarde />
            <DemoResetCard />
          </>
        )}
      </div>
    </div>
  );
}
