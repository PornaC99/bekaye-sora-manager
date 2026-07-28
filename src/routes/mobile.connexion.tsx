import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Fingerprint, Lock, Mail, Phone, ScanFace, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { MobileFrame } from "@/components/mobile/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/layout/brand-mark";
import { cn } from "@/lib/utils";
import { connecter, hydraterMobile, useMobileSession } from "@/lib/mobile/session";

export const Route = createFileRoute("/mobile/connexion")({
  head: () => ({
    meta: [
      { title: "Connexion Directeur — Bekaye Sora Mobile" },
      {
        name: "description",
        content: "Connexion sécurisée à l'espace Directeur : email, téléphone ou biométrie.",
      },
      { property: "og:title", content: "Connexion Directeur — Bekaye Sora Mobile" },
      {
        property: "og:description",
        content: "Accès protégé à l'application mobile de pilotage Bekaye Sora.",
      },
    ],
  }),
  component: ConnexionMobile,
});

function ConnexionMobile() {
  const navigate = useNavigate();
  const { session, pret } = useMobileSession();
  const [mode, setMode] = useState<"email" | "telephone">("email");
  const [identifiant, setIdentifiant] = useState("directeur@bekayesora.com");
  const [motDePasse, setMotDePasse] = useState("");
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    hydraterMobile();
  }, []);

  useEffect(() => {
    if (pret && session) navigate({ to: "/mobile", replace: true });
  }, [pret, session, navigate]);

  const valider = (methode: "mot_de_passe" | "empreinte" | "visage") => {
    if (methode === "mot_de_passe" && motDePasse.trim().length < 4) {
      toast.error("Mot de passe trop court", {
        description: "Saisissez au moins 4 caractères pour continuer.",
      });
      return;
    }
    setChargement(true);
    window.setTimeout(() => {
      connecter({ identifiant, methode });
      setChargement(false);
      toast.success("Bienvenue Bekaye Sora", {
        description:
          methode === "mot_de_passe"
            ? "Connexion sécurisée réussie."
            : "Authentification biométrique validée.",
      });
      navigate({ to: "/mobile", replace: true });
    }, 550);
  };

  return (
    <MobileFrame>
      <div className="flex min-h-screen flex-col justify-between px-6 pb-10 pt-14">
        <div className="animate-in fade-in slide-in-from-bottom-3 space-y-8 duration-500">
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <BrandMark />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold text-foreground">
                Espace Directeur
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Pilotez votre entreprise depuis votre téléphone.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
            {(
              [
                { value: "email", label: "Email", icon: Mail },
                { value: "telephone", label: "Téléphone", icon: Phone },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setMode(option.value);
                  setIdentifiant(
                    option.value === "email" ? "directeur@bekayesora.com" : "+223 76 00 05 01",
                  );
                }}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all",
                  mode === option.value
                    ? "bg-card text-foreground shadow-[var(--shadow-card)]"
                    : "text-muted-foreground",
                )}
              >
                <option.icon className="h-4 w-4" />
                {option.label}
              </button>
            ))}
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              valider("mot_de_passe");
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="identifiant">
                {mode === "email" ? "Adresse email" : "Numéro de téléphone"}
              </Label>
              <Input
                id="identifiant"
                inputMode={mode === "email" ? "email" : "tel"}
                type={mode === "email" ? "email" : "tel"}
                value={identifiant}
                onChange={(e) => setIdentifiant(e.target.value)}
                className="h-12 rounded-xl"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motdepasse">Mot de passe</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="motdepasse"
                  type="password"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 rounded-xl pl-9"
                  autoComplete="current-password"
                />
              </div>
            </div>
            <Button type="submit" disabled={chargement} className="h-12 w-full rounded-xl text-sm">
              {chargement ? "Connexion…" : "Se connecter"}
            </Button>
          </form>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                ou connexion biométrique
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => valider("empreinte")}
                className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card py-4 text-xs font-medium text-foreground transition-transform active:scale-95"
              >
                <Fingerprint className="h-6 w-6 text-primary" />
                Empreinte digitale
              </button>
              <button
                type="button"
                onClick={() => valider("visage")}
                className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card py-4 text-xs font-medium text-foreground transition-transform active:scale-95"
              >
                <ScanFace className="h-6 w-6 text-primary" />
                Reconnaissance faciale
              </button>
            </div>
          </div>
        </div>

        <p className="mt-10 flex items-center justify-center gap-2 text-center text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          Connexion chiffrée · Accès réservé au Directeur
        </p>
      </div>
    </MobileFrame>
  );
}
