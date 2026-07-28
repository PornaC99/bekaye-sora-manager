import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Lock, Mail, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/layout/brand-mark";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Connexion — Bekaye Sora Business Manager" },
      {
        name: "description",
        content:
          "Accédez à votre espace de gestion Bekaye Sora : ventes, stock, clients et finances, sécurisés par NEXUSIA.",
      },
      { property: "og:title", content: "Connexion — Bekaye Sora Business Manager" },
      {
        property: "og:description",
        content: "Espace sécurisé de gestion d'entreprise propulsé par NEXUSIA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"connexion" | "inscription">("connexion");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setEnCours(true);
    try {
      if (mode === "connexion") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
        if (error) throw error;
        toast.success("Connexion réussie");
        navigate({ to: "/", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: motDePasse,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nom_complet: nom, full_name: nom },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Compte créé");
          navigate({ to: "/", replace: true });
        } else {
          toast.success("Compte créé — confirmez votre e-mail pour vous connecter.");
          setMode("connexion");
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Une erreur est survenue";
      toast.error(
        message.includes("Invalid login credentials")
          ? "E-mail ou mot de passe incorrect"
          : message.includes("already registered")
            ? "Un compte existe déjà avec cet e-mail"
            : message,
      );
    } finally {
      setEnCours(false);
    }
  }

  async function motDePasseOublie() {
    if (!email) return toast.error("Saisissez d'abord votre e-mail");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Lien de réinitialisation envoyé");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandMark />
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            {mode === "connexion" ? "Connexion à votre espace" : "Créer votre compte"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestion sécurisée de votre entreprise — propulsé par NEXUSIA.
          </p>
        </div>

        <form onSubmit={soumettre} className="mt-6 flex flex-col gap-4">
          {mode === "inscription" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nom">Nom complet</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="nom"
                  className="pl-9"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Bekaye Sora"
                  required
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Adresse e-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                className="pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@entreprise.com"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mdp">Mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="mdp"
                type="password"
                autoComplete={mode === "connexion" ? "current-password" : "new-password"}
                className="pl-9"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                minLength={8}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={enCours} className="mt-1 w-full">
            {enCours && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "connexion" ? "Se connecter" : "Créer mon compte"}
          </Button>
        </form>

        <div className="mt-5 flex flex-col items-center gap-2 text-sm">
          {mode === "connexion" && (
            <button
              type="button"
              onClick={motDePasseOublie}
              className="text-muted-foreground underline-offset-4 hover:underline"
            >
              Mot de passe oublié ?
            </button>
          )}
          <button
            type="button"
            onClick={() => setMode(mode === "connexion" ? "inscription" : "connexion")}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {mode === "connexion"
              ? "Pas encore de compte ? Créer un compte"
              : "J'ai déjà un compte — me connecter"}
          </button>
        </div>
      </div>
    </main>
  );
}
