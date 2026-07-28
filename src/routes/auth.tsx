import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Lock, Mail, TriangleAlert, User as UserIcon } from "lucide-react";
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

/** Traduit les erreurs Supabase Auth en messages clairs pour l'utilisateur. */
function messageErreurAuth(brut: string): string {
  const m = brut.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou mot de passe incorrect.";
  if (m.includes("email not confirmed"))
    return "Votre adresse e-mail n'est pas encore confirmée. Utilisez le lien reçu par e-mail ou demandez un nouvel envoi ci-dessous.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Un compte existe déjà avec cet e-mail.";
  if (m.includes("password should be at least"))
    return "Le mot de passe doit contenir au moins 8 caractères.";
  if (m.includes("pwned") || m.includes("compromised"))
    return "Ce mot de passe apparaît dans des fuites de données connues. Choisissez-en un autre.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Trop de tentatives. Patientez quelques minutes avant de réessayer.";
  if (m.includes("expired") || m.includes("invalid flow state"))
    return "Ce lien a expiré. Demandez un nouvel e-mail de confirmation.";
  if (m.includes("user not found")) return "Aucun compte ne correspond à cet e-mail.";
  if (m.includes("failed to fetch") || m.includes("network"))
    return "Connexion au serveur impossible. Vérifiez votre connexion Internet.";
  return brut;
}

const urlRetourConfirmation = () =>
  `${window.location.origin}/auth?confirmation=reussie`;

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"connexion" | "inscription">("connexion");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [renvoiEnCours, setRenvoiEnCours] = useState(false);
  const [confirme, setConfirme] = useState(false);
  const [erreurLien, setErreurLien] = useState<string | null>(null);
  const [afficherRenvoi, setAfficherRenvoi] = useState(false);
  const [initialisation, setInitialisation] = useState(true);

  // Traitement du retour de l'e-mail de confirmation puis redirection si déjà connecté.
  useEffect(() => {
    let annule = false;

    async function initialiser() {
      const params = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const erreur = params.get("error_description") ?? hash.get("error_description");
      const estConfirmation = params.get("confirmation") === "reussie";

      if (erreur) {
        setErreurLien(messageErreurAuth(decodeURIComponent(erreur)));
        setAfficherRenvoi(true);
        window.history.replaceState({}, "", "/auth");
        setInitialisation(false);
        return;
      }

      if (estConfirmation) {
        // Supabase crée une session juste après la validation du lien : on la ferme
        // pour que l'utilisateur saisisse volontairement ses identifiants.
        await supabase.auth.signOut().catch(() => undefined);
        if (annule) return;
        setConfirme(true);
        setMode("connexion");
        window.history.replaceState({}, "", "/auth");
        setInitialisation(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (annule) return;
      if (data.session) navigate({ to: "/", replace: true });
      else setInitialisation(false);
    }

    void initialiser();
    return () => {
      annule = true;
    };
  }, [navigate]);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setEnCours(true);
    setErreurLien(null);
    try {
      if (mode === "connexion") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
        if (error) throw error;
        setConfirme(false);
        toast.success("Connexion réussie", { description: "Bienvenue dans votre espace." });
        navigate({ to: "/", replace: true });
      } else {
        // ⚠️ MODE DÉMONSTRATION : la confirmation d'e-mail est temporairement
        // désactivée côté backend (auto-confirmation activée), donc `signUp`
        // renvoie directement une session et l'utilisateur entre sans valider
        // son adresse. Tout le flux de confirmation ci-dessous (lien de retour,
        // bannière « confirmation=reussie », renvoi d'e-mail) reste en place.
        // À RÉACTIVER AVANT LA MISE EN PRODUCTION : désactiver
        // l'auto-confirmation des e-mails dans les réglages d'authentification.
        const { data, error } = await supabase.auth.signUp({

          email,
          password: motDePasse,
          options: {
            emailRedirectTo: urlRetourConfirmation(),
            data: { nom_complet: nom, full_name: nom },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Compte créé", { description: "Votre espace est prêt." });
          navigate({ to: "/", replace: true });
        } else {
          setAfficherRenvoi(true);
          setMode("connexion");
          toast.success("Compte créé", {
            description: `Un e-mail de confirmation a été envoyé à ${email}. Cliquez sur « Confirmer mon adresse e-mail » pour activer votre compte.`,
            duration: 8000,
          });
        }
      }
    } catch (error) {
      const brut = error instanceof Error ? error.message : "Une erreur est survenue";
      const message = messageErreurAuth(brut);
      if (brut.toLowerCase().includes("email not confirmed")) setAfficherRenvoi(true);
      toast.error("Échec de l'opération", { description: message });
    } finally {
      setEnCours(false);
    }
  }

  async function renvoyerConfirmation() {
    if (!email) return toast.error("Saisissez d'abord votre adresse e-mail");
    setRenvoiEnCours(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: urlRetourConfirmation() },
    });
    setRenvoiEnCours(false);
    if (error)
      toast.error("Envoi impossible", { description: messageErreurAuth(error.message) });
    else
      toast.success("E-mail renvoyé", {
        description: `Un nouveau lien de confirmation a été envoyé à ${email}.`,
      });
  }

  async function motDePasseOublie() {
    if (!email) return toast.error("Saisissez d'abord votre adresse e-mail");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error)
      toast.error("Envoi impossible", { description: messageErreurAuth(error.message) });
    else
      toast.success("Lien envoyé", {
        description: `Consultez ${email} pour définir un nouveau mot de passe.`,
      });
  }

  if (initialisation) {
    return (
      <main className="brand-surface-red grid min-h-screen place-items-center">
        <div className="flex flex-col items-center gap-4">
          <img
            src={LOGO_URL}
            alt="Bekaye Sora Collection"
            className="h-20 w-20 animate-scale-in rounded-2xl object-cover ring-1 ring-[var(--color-gold)]/50"
          />
          <Loader2 className="h-5 w-5 animate-spin text-[var(--color-gold)]" />
        </div>
      </main>
    );
  }

  return (
    <main className="brand-surface-red relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      {/* Composition bouteille 501 en arrière-plan, légèrement floutée */}
      <img
        src={BOUTEILLE_501_URL}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[58%] object-cover opacity-45 blur-[2px] lg:block"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[oklch(0.18_0.07_23)] via-[oklch(0.2_0.08_23)]/85 to-transparent" />
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[var(--color-gold)]/10 blur-3xl" />

      <div className="relative z-10 grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1fr_minmax(0,420px)]">
        <div className="hidden flex-col gap-6 lg:flex">
          <img
            src={LOGO_URL}
            alt="Bekaye Sora Collection"
            className="h-28 w-28 rounded-2xl object-cover shadow-2xl ring-1 ring-[var(--color-gold)]/50"
          />
          <div>
            <h2 className="font-display text-4xl font-semibold leading-tight text-white">
              Pilotez Bekaye Sora
              <br />
              en toute simplicité.
            </h2>
            <p className="mt-3 max-w-md text-sm text-white/70">{MARQUE.slogan}</p>
          </div>
          <div className="brand-gold-line h-px w-48 opacity-80" />
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-gold)]">
            {MARQUE.signature}
          </p>
        </div>

        <div className="brand-glass w-full rounded-2xl p-6 shadow-[var(--shadow-luxe)] sm:p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandMark taille="lg" />
          <h1 className="font-display text-2xl font-semibold text-foreground">
            {mode === "connexion" ? "Connexion à votre espace" : "Créer votre compte"}
          </h1>
          <p className="text-sm text-muted-foreground">{MARQUE.slogan}</p>
        </div>


        {confirme && (
          <div
            role="status"
            className="mt-5 flex items-start gap-2.5 rounded-xl border border-success/30 bg-success/10 p-3 text-sm text-foreground"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span>
              Votre adresse e-mail a été confirmée avec succès. Vous pouvez maintenant vous
              connecter.
            </span>
          </div>
        )}

        {erreurLien && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-foreground"
          >
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <span>{erreurLien}</span>
          </div>
        )}

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
            {mode === "inscription" && (
              <p className="text-xs text-muted-foreground">
                8 caractères minimum. Les mots de passe issus de fuites connues sont refusés.
              </p>
            )}
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
          {afficherRenvoi && (
            <button
              type="button"
              onClick={renvoyerConfirmation}
              disabled={renvoiEnCours}
              className="flex items-center gap-2 text-muted-foreground underline-offset-4 hover:underline disabled:opacity-60"
            >
              {renvoiEnCours && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Renvoyer l'e-mail de confirmation
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "connexion" ? "inscription" : "connexion");
              setErreurLien(null);
            }}
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
