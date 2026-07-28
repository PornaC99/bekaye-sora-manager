import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { AdminCard, Bascule, Champ, Pastille } from "@/components/admin/pieces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  enregistrerPolitique,
  fermerSession,
  fermerToutesSessions,
  journaliser,
  useAdminStore,
} from "@/lib/admin/store";
import { formatDateHeure, type PolitiqueMotDePasse } from "@/lib/admin/types";

export const Route = createFileRoute("/_authenticated/administration/securite")({
  component: SecuritePage,
});

function SecuritePage() {
  const { politique, sessions } = useAdminStore();
  const [form, setForm] = useState<PolitiqueMotDePasse>(politique);
  const [mdp, setMdp] = useState({ actuel: "", nouveau: "", confirmation: "" });

  const maj = <K extends keyof PolitiqueMotDePasse>(cle: K, valeur: PolitiqueMotDePasse[K]) =>
    setForm((f) => ({ ...f, [cle]: valeur }));

  const changerMotDePasse = () => {
    if (mdp.nouveau.length < form.longueurMin) {
      toast.error(`Le mot de passe doit contenir au moins ${form.longueurMin} caractères.`);
      return;
    }
    if (mdp.nouveau !== mdp.confirmation) {
      toast.error("La confirmation ne correspond pas.");
      return;
    }
    journaliser({
      action: "modification",
      module: "Sécurité",
      details: "Mot de passe personnel modifié.",
    });
    setMdp({ actuel: "", nouveau: "", confirmation: "" });
    toast.success("Mot de passe mis à jour");
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <AdminCard titre="Modifier le mot de passe" description="Sécurisez votre compte personnel.">
          <div className="flex flex-col gap-4">
            <Champ label="Mot de passe actuel">
              <Input
                type="password"
                value={mdp.actuel}
                onChange={(e) => setMdp((m) => ({ ...m, actuel: e.target.value }))}
              />
            </Champ>
            <Champ label="Nouveau mot de passe">
              <Input
                type="password"
                value={mdp.nouveau}
                onChange={(e) => setMdp((m) => ({ ...m, nouveau: e.target.value }))}
              />
            </Champ>
            <Champ label="Confirmer le nouveau mot de passe">
              <Input
                type="password"
                value={mdp.confirmation}
                onChange={(e) => setMdp((m) => ({ ...m, confirmation: e.target.value }))}
              />
            </Champ>
            <Button onClick={changerMotDePasse}>Mettre à jour</Button>
          </div>
        </AdminCard>

        <AdminCard
          titre="Politique de mot de passe"
          description="Règles appliquées à tous les comptes de l'entreprise."
          actions={
            <Button
              variant="secondary"
              onClick={() => {
                enregistrerPolitique(form);
                toast.success("Politique enregistrée");
              }}
            >
              Enregistrer
            </Button>
          }
        >
          <div className="flex flex-col gap-3">
            <Champ label="Longueur minimale">
              <Input
                type="number"
                min={6}
                value={form.longueurMin}
                onChange={(e) => maj("longueurMin", Number(e.target.value))}
              />
            </Champ>
            <Bascule
              label="Exiger une majuscule"
              active={form.majuscule}
              onChange={(v) => maj("majuscule", v)}
            />
            <Bascule
              label="Exiger un chiffre"
              active={form.chiffre}
              onChange={(v) => maj("chiffre", v)}
            />
            <Bascule
              label="Exiger un caractère spécial"
              active={form.special}
              onChange={(v) => maj("special", v)}
            />
            <Champ label="Expiration du mot de passe (jours)">
              <Input
                type="number"
                min={0}
                value={form.expirationJours}
                onChange={(e) => maj("expirationJours", Number(e.target.value))}
              />
            </Champ>
            <Bascule
              label="Authentification à deux facteurs"
              description="Prévu : code à usage unique par email ou application d'authentification."
              active={form.double_authentification}
              onChange={(v) => maj("double_authentification", v)}
            />
          </div>
        </AdminCard>
      </div>

      <AdminCard
        titre="Gestion des sessions"
        description="Appareils actuellement connectés à votre espace."
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              fermerToutesSessions();
              toast.success("Tous les autres appareils ont été déconnectés");
            }}
          >
            <LogOut className="mr-1.5 h-4 w-4" /> Déconnecter tous les appareils
          </Button>
        }
      >
        <ul className="flex flex-col gap-2">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {s.appareil} {s.courante && <Pastille ton="succes">Session actuelle</Pastille>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {s.utilisateur} · {s.ip} · {s.localisation} · depuis {formatDateHeure(s.debut)}
                </p>
              </div>
              {!s.courante && (
                <Button variant="ghost" size="sm" onClick={() => fermerSession(s.id)}>
                  Fermer
                </Button>
              )}
            </li>
          ))}
        </ul>
      </AdminCard>
    </div>
  );
}
