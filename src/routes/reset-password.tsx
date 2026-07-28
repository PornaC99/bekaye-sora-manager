import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Lock, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/layout/brand-mark";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — Bekaye Sora Business Manager" },
      {
        name: "description",
        content: "Définissez un nouveau mot de passe pour votre espace de gestion Bekaye Sora.",
      },
      { property: "og:title", content: "Nouveau mot de passe — Bekaye Sora" },
      {
        property: "og:description",
        content: "Réinitialisation sécurisée de votre mot de passe.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [verification, setVerification] = useState(true);
  const [lienValide, setLienValide] = useState(false);

  // Le lien de récupération ouvre une session temporaire : sans elle, impossible
  // de changer le mot de passe (lien expiré ou déjà utilisé).
  useEffect(() => {
    let annule = false;
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const erreur = params.get("error_description") ?? hash.get("error_description");

    async function verifier() {
      if (erreur) {
        if (!annule) {
          setLienValide(false);
          setVerification(false);
        }
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (annule) return;
      setLienValide(Boolean(data.session));
      setVerification(false);
    }

    void verifier();
    return () => {
      annule = true;
    };
  }, []);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    if (motDePasse !== confirmation) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    setEnCours(true);
    const { error } = await supabase.auth.updateUser({ password: motDePasse });
    setEnCours(false);
    if (error) {
      const m = error.message.toLowerCase();
      return toast.error("Modification impossible", {
        description: m.includes("pwned") || m.includes("compromised")
          ? "Ce mot de passe apparaît dans des fuites de données connues. Choisissez-en un autre."
          : m.includes("should be at least")
            ? "Le mot de passe doit contenir au moins 8 caractères."
            : error.message,
      });
    }
    toast.success("Mot de passe mis à jour", { description: "Vous pouvez utiliser votre espace." });
    navigate({ to: "/", replace: true });
  }

  if (verification) {
    return (
      <main className="grid min-h-screen place-items-center bg-muted/40">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandMark />
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Nouveau mot de passe
          </h1>
          <p className="text-sm text-muted-foreground">
            Choisissez un mot de passe d'au moins 8 caractères.
          </p>
        </div>

        {!lienValide ? (
          <div className="mt-6 flex flex-col items-center gap-4 text-center">
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-left text-sm text-foreground"
            >
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <span>
                Ce lien de réinitialisation est expiré ou a déjà été utilisé. Demandez-en un
                nouveau depuis la page de connexion.
              </span>
            </div>
            <Button onClick={() => navigate({ to: "/auth" })} className="w-full">
              Retour à la connexion
            </Button>
          </div>
        ) : (
          <form onSubmit={soumettre} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mdp">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="mdp"
                  type="password"
                  autoComplete="new-password"
                  className="pl-9"
                  minLength={8}
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mdp2">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="mdp2"
                  type="password"
                  autoComplete="new-password"
                  className="pl-9"
                  minLength={8}
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={enCours} className="w-full">
              {enCours && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
