import { useState } from "react";
import { toast } from "sonner";
import { Download, KeyRound, Moon, RefreshCw, Save, Sun } from "lucide-react";

import { AdminCard, Bascule, Champ, Pastille } from "@/components/admin/pieces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession, nomAffiche } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/use-theme";
import {
  creerSauvegarde,
  enregistrerInfos,
  enregistrerNotifications,
  enregistrerPersonnalisation,
  enregistrerPlanification,
  enregistrerPolitique,
  fermerToutesSessions,
  useAdminStore,
} from "@/lib/admin/store";
import type {
  InfosEntreprise,
  Personnalisation,
  PlanificationSauvegarde,
  PolitiqueMotDePasse,
  PreferencesNotifications,
} from "@/lib/admin/types";

const selectClass =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary";

/* ------------------------------------------------------------------ */
/* Entreprise                                                           */
/* ------------------------------------------------------------------ */

export function SectionEntreprise() {
  const { infos } = useAdminStore();
  const [form, setForm] = useState<InfosEntreprise>(infos);
  const maj = <K extends keyof InfosEntreprise>(cle: K, valeur: InfosEntreprise[K]) =>
    setForm((f) => ({ ...f, [cle]: valeur }));

  return (
    <AdminCard
      titre="Informations de l'entreprise"
      description="Identité affichée sur les factures, les rapports et les documents imprimés."
      actions={
        <Button
          onClick={() => {
            enregistrerInfos(form);
            toast.success("Informations de l'entreprise enregistrées");
          }}
        >
          <Save className="mr-2 h-4 w-4" />
          Enregistrer
        </Button>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Champ label="Nom légal">
          <Input value={form.nom} onChange={(e) => maj("nom", e.target.value)} />
        </Champ>
        <Champ label="Nom commercial">
          <Input
            value={form.nomCommercial}
            onChange={(e) => maj("nomCommercial", e.target.value)}
          />
        </Champ>
        <Champ label="Slogan">
          <Input value={form.slogan} onChange={(e) => maj("slogan", e.target.value)} />
        </Champ>
        <Champ label="Numéro fiscal / identifiant">
          <Input value={form.identifiant} onChange={(e) => maj("identifiant", e.target.value)} />
        </Champ>
        <Champ label="Adresse">
          <Input value={form.adresse} onChange={(e) => maj("adresse", e.target.value)} />
        </Champ>
        <Champ label="Téléphone">
          <Input value={form.telephone} onChange={(e) => maj("telephone", e.target.value)} />
        </Champ>
        <Champ label="WhatsApp">
          <Input value={form.whatsapp} onChange={(e) => maj("whatsapp", e.target.value)} />
        </Champ>
        <Champ label="Email">
          <Input type="email" value={form.email} onChange={(e) => maj("email", e.target.value)} />
        </Champ>
        <Champ label="Site web">
          <Input value={form.siteWeb} onChange={(e) => maj("siteWeb", e.target.value)} />
        </Champ>
        <Champ label="Devise">
          <select
            className={selectClass}
            value={form.devise}
            onChange={(e) => maj("devise", e.target.value as InfosEntreprise["devise"])}
          >
            <option value="XOF">Franc CFA (XOF)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="USD">Dollar (USD)</option>
          </select>
        </Champ>
        <Champ label="Fuseau horaire">
          <Input
            value={form.fuseauHoraire}
            onChange={(e) => maj("fuseauHoraire", e.target.value)}
          />
        </Champ>
        <Champ label="Langue de l'interface">
          <select
            className={selectClass}
            value={form.langue}
            onChange={(e) => maj("langue", e.target.value as InfosEntreprise["langue"])}
          >
            <option value="fr">Français</option>
            <option value="en">Anglais</option>
          </select>
        </Champ>
        <Champ label="Format de date">
          <select
            className={selectClass}
            value={form.formatDate}
            onChange={(e) => maj("formatDate", e.target.value as InfosEntreprise["formatDate"])}
          >
            <option value="jj/mm/aaaa">jj/mm/aaaa</option>
            <option value="aaaa-mm-jj">aaaa-mm-jj</option>
            <option value="mm/jj/aaaa">mm/jj/aaaa</option>
          </select>
        </Champ>
      </div>
    </AdminCard>
  );
}

/* ------------------------------------------------------------------ */
/* Profil utilisateur                                                   */
/* ------------------------------------------------------------------ */

export function SectionProfil() {
  const { user } = useSession();
  const [nom, setNom] = useState(nomAffiche(user));
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [enCours, setEnCours] = useState(false);

  const enregistrerProfil = async () => {
    setEnCours(true);
    const { error } = await supabase.auth.updateUser({ data: { nom_complet: nom } });
    setEnCours(false);
    if (error) toast.error("Impossible d'enregistrer le profil");
    else toast.success("Profil mis à jour");
  };

  const changerMotDePasse = async () => {
    if (motDePasse.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (motDePasse !== confirmation) {
      toast.error("Les deux mots de passe ne correspondent pas");
      return;
    }
    setEnCours(true);
    const { error } = await supabase.auth.updateUser({ password: motDePasse });
    setEnCours(false);
    if (error) {
      toast.error("Le changement de mot de passe a échoué");
      return;
    }
    setMotDePasse("");
    setConfirmation("");
    toast.success("Mot de passe modifié");
  };

  return (
    <div className="flex flex-col gap-4">
      <AdminCard
        titre="Mon profil"
        description="Vos informations personnelles de connexion."
        actions={
          <Button disabled={enCours} onClick={() => void enregistrerProfil()}>
            <Save className="mr-2 h-4 w-4" />
            Enregistrer
          </Button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Champ label="Nom complet">
            <Input value={nom} onChange={(e) => setNom(e.target.value)} />
          </Champ>
          <Champ label="Adresse email" hint="L'email de connexion ne peut pas être modifié ici.">
            <Input value={user?.email ?? ""} disabled />
          </Champ>
        </div>
      </AdminCard>

      <AdminCard
        titre="Mot de passe"
        description="Choisissez un mot de passe d'au moins 8 caractères."
        actions={
          <Button variant="outline" disabled={enCours} onClick={() => void changerMotDePasse()}>
            <KeyRound className="mr-2 h-4 w-4" />
            Modifier
          </Button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Champ label="Nouveau mot de passe">
            <Input
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
            />
          </Champ>
          <Champ label="Confirmation">
            <Input
              type="password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </Champ>
        </div>
      </AdminCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Apparence                                                            */
/* ------------------------------------------------------------------ */

export function SectionApparence() {
  const { personnalisation } = useAdminStore();
  const { theme, definirTheme } = useTheme();
  const [form, setForm] = useState<Personnalisation>(personnalisation);

  return (
    <AdminCard
      titre="Apparence"
      description="Thème, couleur d'accent et typographie de l'application."
      actions={
        <Button
          onClick={() => {
            enregistrerPersonnalisation(form);
            toast.success("Apparence enregistrée");
          }}
        >
          <Save className="mr-2 h-4 w-4" />
          Enregistrer
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => definirTheme("clair")}
            className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
              theme === "clair" ? "border-primary bg-primary-soft" : "border-border hover:bg-muted"
            }`}
          >
            <Sun className="h-5 w-5 text-primary" />
            <span>
              <span className="block text-sm font-semibold text-foreground">Mode clair</span>
              <span className="block text-xs text-muted-foreground">
                Idéal en boutique et pour l'impression.
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => definirTheme("sombre")}
            className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
              theme === "sombre" ? "border-primary bg-primary-soft" : "border-border hover:bg-muted"
            }`}
          >
            <Moon className="h-5 w-5 text-primary" />
            <span>
              <span className="block text-sm font-semibold text-foreground">Mode sombre</span>
              <span className="block text-xs text-muted-foreground">
                Confort visuel en soirée et sur mobile.
              </span>
            </span>
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Champ label="Couleur principale">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.couleurPrincipale}
                onChange={(e) => setForm((f) => ({ ...f, couleurPrincipale: e.target.value }))}
                className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-background"
                aria-label="Couleur principale"
              />
              <Input
                value={form.couleurPrincipale}
                onChange={(e) => setForm((f) => ({ ...f, couleurPrincipale: e.target.value }))}
              />
            </div>
          </Champ>
          <Champ label="Police de caractères">
            <select
              className={selectClass}
              value={form.police}
              onChange={(e) =>
                setForm((f) => ({ ...f, police: e.target.value as Personnalisation["police"] }))
              }
            >
              <option value="Sora">Sora</option>
              <option value="Inter">Inter</option>
              <option value="Manrope">Manrope</option>
            </select>
          </Champ>
        </div>
      </div>
    </AdminCard>
  );
}

/* ------------------------------------------------------------------ */
/* Préférences                                                          */
/* ------------------------------------------------------------------ */

export function SectionPreferences() {
  const { notifications } = useAdminStore();
  const [form, setForm] = useState<PreferencesNotifications>(notifications);
  const maj = <K extends keyof PreferencesNotifications>(
    cle: K,
    valeur: PreferencesNotifications[K],
  ) => setForm((f) => ({ ...f, [cle]: valeur }));

  return (
    <AdminCard
      titre="Préférences de notification"
      description="Choisissez les canaux par lesquels l'entreprise est alertée."
      actions={
        <Button
          onClick={() => {
            enregistrerNotifications(form);
            toast.success("Préférences enregistrées");
          }}
        >
          <Save className="mr-2 h-4 w-4" />
          Enregistrer
        </Button>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Bascule
          label="Notifications internes"
          description="Alertes affichées dans l'application (stock, ventes, caisse)."
          active={form.internes}
          onChange={(v) => maj("internes", v)}
        />
        <Bascule
          label="Notifications par email"
          description="Résumés quotidiens et alertes critiques."
          active={form.email}
          onChange={(v) => maj("email", v)}
        />
        <Bascule
          label="WhatsApp"
          description="Rappels clients et alertes direction."
          active={form.whatsapp}
          onChange={(v) => maj("whatsapp", v)}
        />
        <Bascule
          label="Push mobile"
          description="Alertes en direct sur l'application mobile du Directeur."
          active={form.push}
          onChange={(v) => maj("push", v)}
        />
      </div>
      <div className="mt-4 max-w-md">
        <Champ label="Email destinataire des alertes">
          <Input
            type="email"
            value={form.emailDestinataire}
            onChange={(e) => maj("emailDestinataire", e.target.value)}
          />
        </Champ>
      </div>
    </AdminCard>
  );
}

/* ------------------------------------------------------------------ */
/* Sécurité                                                             */
/* ------------------------------------------------------------------ */

export function SectionSecurite() {
  const { politique, sessions } = useAdminStore();
  const [form, setForm] = useState<PolitiqueMotDePasse>(politique);
  const maj = <K extends keyof PolitiqueMotDePasse>(cle: K, valeur: PolitiqueMotDePasse[K]) =>
    setForm((f) => ({ ...f, [cle]: valeur }));

  return (
    <div className="flex flex-col gap-4">
      <AdminCard
        titre="Politique de sécurité"
        description="Exigences appliquées aux mots de passe des utilisateurs."
        actions={
          <Button
            onClick={() => {
              enregistrerPolitique(form);
              toast.success("Politique de sécurité enregistrée");
            }}
          >
            <Save className="mr-2 h-4 w-4" />
            Enregistrer
          </Button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Champ label="Longueur minimale">
            <Input
              type="number"
              min={6}
              value={form.longueurMin}
              onChange={(e) => maj("longueurMin", Number(e.target.value))}
            />
          </Champ>
          <Champ label="Expiration (jours)">
            <Input
              type="number"
              min={0}
              value={form.expirationJours}
              onChange={(e) => maj("expirationJours", Number(e.target.value))}
            />
          </Champ>
          <Bascule
            label="Majuscule obligatoire"
            active={form.majuscule}
            onChange={(v) => maj("majuscule", v)}
          />
          <Bascule
            label="Chiffre obligatoire"
            active={form.chiffre}
            onChange={(v) => maj("chiffre", v)}
          />
          <Bascule
            label="Caractère spécial obligatoire"
            active={form.special}
            onChange={(v) => maj("special", v)}
          />
          <Bascule
            label="Double authentification"
            description="Vérification supplémentaire à la connexion."
            active={form.double_authentification}
            onChange={(v) => maj("double_authentification", v)}
          />
        </div>
      </AdminCard>

      <AdminCard
        titre="Sessions actives"
        description="Appareils actuellement connectés à votre espace."
        actions={
          <Button
            variant="outline"
            onClick={() => {
              fermerToutesSessions();
              toast.success("Toutes les autres sessions ont été fermées");
            }}
          >
            Fermer les autres sessions
          </Button>
        }
      >
        <ul className="flex flex-col gap-2">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{s.appareil}</p>
                <p className="text-xs text-muted-foreground">
                  {s.localisation} · {s.ip}
                </p>
              </div>
              <Pastille ton={s.courante ? "succes" : "neutre"}>
                {s.courante ? "Session courante" : "Ouverte"}
              </Pastille>
            </li>
          ))}
        </ul>
      </AdminCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sauvegarde                                                           */
/* ------------------------------------------------------------------ */

export function SectionSauvegarde() {
  const { sauvegardes, planification } = useAdminStore();
  const [form, setForm] = useState<PlanificationSauvegarde>(planification);

  return (
    <div className="flex flex-col gap-4">
      <AdminCard
        titre="Sauvegarde automatique"
        description="Fréquence et rétention des copies de sécurité de vos données."
        actions={
          <Button
            onClick={() => {
              enregistrerPlanification(form);
              toast.success("Planification enregistrée");
            }}
          >
            <Save className="mr-2 h-4 w-4" />
            Enregistrer
          </Button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Bascule
            label="Sauvegarde automatique"
            description="Copie régulière de la base de données."
            active={form.active}
            onChange={(v) => setForm((f) => ({ ...f, active: v }))}
          />
          <Champ label="Fréquence">
            <select
              className={selectClass}
              value={form.frequence}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  frequence: e.target.value as PlanificationSauvegarde["frequence"],
                }))
              }
            >
              <option value="quotidienne">Quotidienne</option>
              <option value="hebdomadaire">Hebdomadaire</option>
              <option value="mensuelle">Mensuelle</option>
            </select>
          </Champ>
          <Champ label="Heure d'exécution">
            <Input
              type="time"
              value={form.heure}
              onChange={(e) => setForm((f) => ({ ...f, heure: e.target.value }))}
            />
          </Champ>
          <Champ label="Rétention (jours)">
            <Input
              type="number"
              min={1}
              value={form.retentionJours}
              onChange={(e) => setForm((f) => ({ ...f, retentionJours: Number(e.target.value) }))}
            />
          </Champ>
        </div>
      </AdminCard>

      <AdminCard
        titre="Historique des sauvegardes"
        description="Dernières copies de sécurité générées."
        actions={
          <Button
            variant="outline"
            onClick={() => {
              creerSauvegarde();
              toast.success("Sauvegarde lancée");
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Sauvegarder maintenant
          </Button>
        }
      >
        <ul className="flex flex-col gap-2">
          {sauvegardes.slice(0, 6).map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {new Date(s.date).toLocaleString("fr-FR")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {s.type === "manuelle" ? "Manuelle" : "Automatique"} · {s.taille} · {s.auteur}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Pastille
                  ton={
                    s.statut === "reussie"
                      ? "succes"
                      : s.statut === "en_cours"
                        ? "attention"
                        : "danger"
                  }
                >
                  {s.statut === "reussie"
                    ? "Réussie"
                    : s.statut === "en_cours"
                      ? "En cours"
                      : "Échouée"}
                </Pastille>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Télécharger"
                  onClick={() => toast.success("Téléchargement de la sauvegarde préparé")}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </AdminCard>
    </div>
  );
}
