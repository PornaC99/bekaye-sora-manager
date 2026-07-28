import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { AdminCard, Bascule, Champ } from "@/components/admin/pieces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { enregistrerPersonnalisation, useAdminStore } from "@/lib/admin/store";
import type { Personnalisation } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/administration/personnalisation")({
  component: PersonnalisationPage,
});

const COULEURS = ["#D62828", "#B91C1C", "#0F172A", "#0E7490", "#7C3AED", "#059669"];
const POLICES: Personnalisation["police"][] = ["Sora", "Inter", "Manrope"];

function PersonnalisationPage() {
  const { personnalisation } = useAdminStore();
  const [form, setForm] = useState<Personnalisation>(personnalisation);

  const maj = <K extends keyof Personnalisation>(cle: K, valeur: Personnalisation[K]) =>
    setForm((f) => ({ ...f, [cle]: valeur }));

  return (
    <div className="flex flex-col gap-5">
      <AdminCard
        titre="Identité visuelle"
        description="Adaptez l'application aux couleurs et à l'image de votre marque."
        actions={
          <Button
            onClick={() => {
              enregistrerPersonnalisation(form);
              toast.success("Personnalisation enregistrée");
            }}
          >
            Enregistrer
          </Button>
        }
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Champ label="Couleur principale">
              <div className="flex flex-wrap items-center gap-2">
                {COULEURS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => maj("couleurPrincipale", c)}
                    style={{ backgroundColor: c }}
                    aria-label={`Couleur ${c}`}
                    className={cn(
                      "h-9 w-9 rounded-full border-2 transition",
                      form.couleurPrincipale === c
                        ? "border-foreground scale-110"
                        : "border-transparent",
                    )}
                  />
                ))}
                <Input
                  className="h-9 w-32"
                  value={form.couleurPrincipale}
                  onChange={(e) => maj("couleurPrincipale", e.target.value)}
                />
              </div>
            </Champ>

            <Champ label="Police d'écriture">
              <div className="flex gap-2">
                {POLICES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => maj("police", p)}
                    className={cn(
                      "rounded-lg border px-4 py-2 text-sm transition",
                      form.police === p
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </Champ>

            <Champ label="Thème">
              <div className="flex gap-2">
                {(["clair", "sombre", "auto"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => maj("theme", t)}
                    className={cn(
                      "rounded-lg border px-4 py-2 text-sm capitalize transition",
                      form.theme === t
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {t === "auto" ? "Automatique" : `Mode ${t}`}
                  </button>
                ))}
              </div>
            </Champ>
          </div>

          <div className="flex flex-col gap-4">
            <Champ label="Logo clair (URL)">
              <Input
                value={form.logoClair}
                placeholder="https://…"
                onChange={(e) => maj("logoClair", e.target.value)}
              />
            </Champ>
            <Champ label="Logo sombre (URL)">
              <Input
                value={form.logoSombre}
                placeholder="https://…"
                onChange={(e) => maj("logoSombre", e.target.value)}
              />
            </Champ>
            <Champ label="Favicon (URL)">
              <Input
                value={form.favicon}
                placeholder="https://…"
                onChange={(e) => maj("favicon", e.target.value)}
              />
            </Champ>
          </div>
        </div>
      </AdminCard>

      <AdminCard titre="Aperçu" description="Prévisualisation de la couleur et de la police choisies.">
        <div className="rounded-xl border border-border p-5" style={{ fontFamily: form.police }}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: form.couleurPrincipale }}>
            Bekaye Sora
          </p>
          <h3 className="mt-1 text-2xl font-semibold text-foreground">Business Manager</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            501 – Révélez votre éclat. Interface en mode {form.theme}.
          </p>
          <button
            type="button"
            className="mt-4 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: form.couleurPrincipale }}
          >
            Bouton principal
          </button>
        </div>
      </AdminCard>

      <AdminCard titre="Options d'affichage" description="Réglages secondaires de l'interface.">
        <div className="grid gap-3 md:grid-cols-2">
          <Bascule
            label="Mode sombre par défaut"
            description="Applique le thème sombre à la prochaine connexion."
            active={form.theme === "sombre"}
            onChange={(v) => maj("theme", v ? "sombre" : "clair")}
          />
          <Bascule
            label="Suivre les préférences système"
            description="Bascule automatiquement entre clair et sombre."
            active={form.theme === "auto"}
            onChange={(v) => maj("theme", v ? "auto" : "clair")}
          />
        </div>
      </AdminCard>
    </div>
  );
}
