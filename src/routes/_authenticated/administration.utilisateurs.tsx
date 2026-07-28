import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { History, KeyRound, Pencil, Plus, ShieldBan, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminCard, Champ, Pastille } from "@/components/admin/pieces";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ajouterRole,
  ajouterUtilisateur,
  basculerPermission,
  basculerStatutUtilisateur,
  modifierUtilisateur,
  reinitialiserMotDePasse,
  supprimerRole,
  supprimerUtilisateur,
  useAdminStore,
} from "@/lib/admin/store";
import {
  PERMISSIONS,
  formatDateHeure,
  type PermissionCle,
  type Utilisateur,
  type UtilisateurFormValues,
} from "@/lib/admin/types";
import { useRoleActuel, simulerRole } from "@/hooks/use-role";
import { ROLES, type RoleCle } from "@/lib/access/roles";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/administration/utilisateurs")({
  component: UtilisateursPage,
});

const vide = (roleId: string): UtilisateurFormValues => ({
  nom: "",
  email: "",
  telephone: "",
  fonction: "",
  photo: "",
  roleId,
  statut: "invite",
  magasinId: null,
});

function UtilisateursPage() {
  const { utilisateurs, roles, magasins, audit } = useAdminStore();
  const { simule } = useRoleActuel();
  const [historique, setHistorique] = useState<Utilisateur | null>(null);
  const [ouvert, setOuvert] = useState(false);
  const [edition, setEdition] = useState<Utilisateur | null>(null);
  const [form, setForm] = useState<UtilisateurFormValues>(vide(roles[0]?.id ?? ""));

  const [nouveauRole, setNouveauRole] = useState({ nom: "", description: "" });

  const nomRole = useMemo(
    () => (idRole: string) => roles.find((r) => r.id === idRole)?.nom ?? "—",
    [roles],
  );

  const ouvrirCreation = () => {
    setEdition(null);
    setForm(vide(roles[0]?.id ?? ""));
    setOuvert(true);
  };

  const ouvrirEdition = (u: Utilisateur) => {
    setEdition(u);
    setForm({
      nom: u.nom,
      email: u.email,
      telephone: u.telephone,
      fonction: u.fonction ?? "",
      photo: u.photo ?? "",
      roleId: u.roleId,
      statut: u.statut,
      magasinId: u.magasinId,
    });
    setOuvert(true);
  };

  const soumettre = () => {
    if (!form.nom.trim() || !form.email.trim()) {
      toast.error("Le nom et l'email sont obligatoires.");
      return;
    }
    if (edition) {
      modifierUtilisateur(edition.id, form);
      toast.success("Utilisateur mis à jour");
    } else {
      ajouterUtilisateur(form);
      toast.success("Invitation envoyée");
    }
    setOuvert(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <AdminCard
        titre="Utilisateurs"
        description="Gérez les accès à l'application et les comptes de votre équipe."
        actions={
          <Button onClick={ouvrirCreation}>
            <Plus className="mr-1.5 h-4 w-4" /> Ajouter un utilisateur
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Utilisateur</th>
                <th className="pb-2 pr-3 font-medium">Fonction</th>
                <th className="pb-2 pr-3 font-medium">Rôle</th>
                <th className="pb-2 pr-3 font-medium">Magasin</th>
                <th className="pb-2 pr-3 font-medium">Créé le</th>
                <th className="pb-2 pr-3 font-medium">Dernière connexion</th>
                <th className="pb-2 pr-3 font-medium">Statut</th>
                <th className="pb-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {utilisateurs.map((u) => (
                <tr key={u.id} className="border-b border-border/60 last:border-0">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-3">
                      {u.photo ? (
                        <img
                          src={u.photo}
                          alt={u.nom}
                          loading="lazy"
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                          {u.nom
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((m) => m[0]?.toUpperCase() ?? "")
                            .join("")}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{u.nom}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                        <p className="text-xs text-muted-foreground">{u.telephone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-muted-foreground">{u.fonction || "—"}</td>
                  <td className="py-3 pr-3 text-muted-foreground">{nomRole(u.roleId)}</td>
                  <td className="py-3 pr-3 text-muted-foreground">
                    {magasins.find((m) => m.id === u.magasinId)?.nom ?? "Tous"}
                  </td>
                  <td className="py-3 pr-3 text-muted-foreground">{formatDateHeure(u.creeLe)}</td>
                  <td className="py-3 pr-3 text-muted-foreground">
                    {u.derniereConnexion ? formatDateHeure(u.derniereConnexion) : "Jamais"}
                  </td>
                  <td className="py-3 pr-3">
                    <Pastille
                      ton={
                        u.statut === "actif"
                          ? "succes"
                          : u.statut === "invite"
                            ? "neutre"
                            : "danger"
                      }
                    >
                      {u.statut === "actif"
                        ? "Actif"
                        : u.statut === "invite"
                          ? "Invitation envoyée"
                          : "Suspendu"}
                    </Pastille>
                  </td>
                  <td className="py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setHistorique(u)}
                        title="Consulter l'historique"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => ouvrirEdition(u)}
                        title="Modifier"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Réinitialiser le mot de passe"
                        onClick={() => {
                          reinitialiserMotDePasse(u.id);
                          toast.success(`Lien de réinitialisation envoyé à ${u.email}`);
                        }}
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={u.statut === "suspendu" ? "Réactiver" : "Suspendre"}
                        onClick={() => basculerStatutUtilisateur(u.id)}
                      >
                        {u.statut === "suspendu" ? (
                          <ShieldCheck className="h-4 w-4" />
                        ) : (
                          <ShieldBan className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Supprimer"
                        onClick={() => {
                          supprimerUtilisateur(u.id);
                          toast.success("Utilisateur supprimé");
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-primary" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>

      <AdminCard
        titre="Gestion des rôles"
        description="Créez des rôles personnalisés et attribuez précisément les permissions."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Rôle</th>
                {PERMISSIONS.map((p) => (
                  <th key={p.cle} className="pb-2 pr-2 text-center font-medium">
                    {p.label}
                  </th>
                ))}
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="py-3 pr-3">
                    <p className="font-medium text-foreground">{r.nom}</p>
                    <p className="max-w-[240px] text-xs text-muted-foreground">{r.description}</p>
                    {r.systeme && <Pastille ton="neutre">Rôle système</Pastille>}
                  </td>
                  {PERMISSIONS.map((p) => {
                    const actif = r.permissions.includes(p.cle as PermissionCle);
                    return (
                      <td key={p.cle} className="py-3 pr-2 text-center">
                        <button
                          type="button"
                          aria-label={`${p.label} — ${r.nom}`}
                          onClick={() => basculerPermission(r.id, p.cle as PermissionCle)}
                          className={cn(
                            "h-5 w-5 rounded-md border transition",
                            actif
                              ? "border-primary bg-primary"
                              : "border-border bg-background hover:bg-muted",
                          )}
                        />
                      </td>
                    );
                  })}
                  <td className="py-3 text-right">
                    {!r.systeme && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Supprimer le rôle"
                        onClick={() => {
                          supprimerRole(r.id);
                          toast.success("Rôle supprimé");
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-primary" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 grid gap-3 rounded-xl border border-dashed border-border p-4 md:grid-cols-[1fr_2fr_auto] md:items-end">
          <Champ label="Nom du rôle">
            <Input
              value={nouveauRole.nom}
              placeholder="Superviseur"
              onChange={(e) => setNouveauRole((r) => ({ ...r, nom: e.target.value }))}
            />
          </Champ>
          <Champ label="Description">
            <Input
              value={nouveauRole.description}
              placeholder="Contrôle des opérations quotidiennes"
              onChange={(e) => setNouveauRole((r) => ({ ...r, description: e.target.value }))}
            />
          </Champ>
          <Button
            variant="secondary"
            onClick={() => {
              if (!nouveauRole.nom.trim()) {
                toast.error("Indiquez un nom de rôle.");
                return;
              }
              ajouterRole(nouveauRole.nom, nouveauRole.description, ["voir"]);
              setNouveauRole({ nom: "", description: "" });
              toast.success("Rôle créé");
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Créer le rôle
          </Button>
        </div>
      </AdminCard>

      <AdminCard
        titre="Interface par rôle"
        description="Prévisualisez l'application telle que la voit chaque profil. Les menus et les pages non autorisés sont automatiquement masqués et bloqués."
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              simulerRole(null);
              toast.success("Retour à votre profil réel");
            }}
            className={cn(
              "rounded-lg border px-3 py-2 text-xs font-medium transition",
              !simule
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            Mon profil réel
          </button>
          {ROLES.map((r) => (
            <button
              key={r.cle}
              type="button"
              title={r.description}
              onClick={() => {
                simulerRole(r.cle as RoleCle);
                toast.success(`Interface affichée en tant que ${r.label}`);
              }}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-medium transition",
                simule === r.cle
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <ul className="mt-4 grid gap-2 md:grid-cols-2">
          {ROLES.map((r) => (
            <li key={r.cle} className="rounded-xl border border-border bg-background p-3">
              <p className="text-sm font-medium text-foreground">{r.label}</p>
              <p className="text-xs text-muted-foreground">{r.description}</p>
            </li>
          ))}
        </ul>
      </AdminCard>

      <Dialog open={historique !== null} onOpenChange={(o) => !o && setHistorique(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Historique — {historique?.nom}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[420px] space-y-2 overflow-y-auto">
            {audit.filter((e) => e.utilisateur === historique?.nom).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucune activité enregistrée pour cet utilisateur.
              </p>
            ) : (
              audit
                .filter((e) => e.utilisateur === historique?.nom)
                .slice(0, 40)
                .map((e) => (
                  <div key={e.id} className="rounded-xl border border-border bg-background p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{e.module}</p>
                      <p className="text-xs text-muted-foreground">{formatDateHeure(e.date)}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{e.details}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {e.appareil} · {e.ip}
                    </p>
                  </div>
                ))
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setHistorique(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {edition ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Nom complet">
              <Input
                value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
              />
            </Champ>
            <Champ label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </Champ>
            <Champ label="Téléphone">
              <Input
                value={form.telephone}
                onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
              />
            </Champ>
            <Champ label="Fonction">
              <Input
                value={form.fonction ?? ""}
                placeholder="Caissier principal"
                onChange={(e) => setForm((f) => ({ ...f, fonction: e.target.value }))}
              />
            </Champ>
            <Champ label="Photo (URL)">
              <Input
                value={form.photo ?? ""}
                placeholder="https://…"
                onChange={(e) => setForm((f) => ({ ...f, photo: e.target.value }))}
              />
            </Champ>
            <Champ label="Rôle">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.roleId}
                onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nom}
                  </option>
                ))}
              </select>
            </Champ>
            <Champ label="Magasin">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.magasinId ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    magasinId: e.target.value === "" ? null : e.target.value,
                  }))
                }
              >
                <option value="">Tous les magasins</option>
                {magasins.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom}
                  </option>
                ))}
              </select>
            </Champ>
            <Champ label="Statut">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.statut}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    statut: e.target.value as UtilisateurFormValues["statut"],
                  }))
                }
              >
                <option value="invite">Invitation envoyée</option>
                <option value="actif">Actif</option>
                <option value="suspendu">Suspendu</option>
              </select>
            </Champ>
            <div className="sm:col-span-2">
              <Champ label="Note interne">
                <Textarea rows={2} placeholder="Facultatif" />
              </Champ>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOuvert(false)}>
              Annuler
            </Button>
            <Button onClick={soumettre}>{edition ? "Enregistrer" : "Inviter"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
