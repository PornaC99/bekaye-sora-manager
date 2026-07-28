import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Pencil, Plus, ShieldBan, ShieldCheck, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/administration/utilisateurs")({
  component: UtilisateursPage,
});

const vide = (roleId: string): UtilisateurFormValues => ({
  nom: "",
  email: "",
  telephone: "",
  roleId,
  statut: "invite",
  magasinId: null,
});

function UtilisateursPage() {
  const { utilisateurs, roles, magasins } = useAdminStore();
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
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Utilisateur</th>
                <th className="pb-2 pr-3 font-medium">Rôle</th>
                <th className="pb-2 pr-3 font-medium">Magasin</th>
                <th className="pb-2 pr-3 font-medium">Dernière connexion</th>
                <th className="pb-2 pr-3 font-medium">Statut</th>
                <th className="pb-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {utilisateurs.map((u) => (
                <tr key={u.id} className="border-b border-border/60 last:border-0">
                  <td className="py-3 pr-3">
                    <p className="font-medium text-foreground">{u.nom}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="py-3 pr-3 text-muted-foreground">{nomRole(u.roleId)}</td>
                  <td className="py-3 pr-3 text-muted-foreground">
                    {magasins.find((m) => m.id === u.magasinId)?.nom ?? "Tous"}
                  </td>
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
