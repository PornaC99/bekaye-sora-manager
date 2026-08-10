import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, KeyRound, Pencil, Plus, RefreshCw, ShieldBan, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { AdminCard, Champ, Pastille } from "@/components/admin/pieces";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermissions } from "@/hooks/use-permissions";
import { simulerRole, useRoleActuel } from "@/hooks/use-role";
import {
  basculerCompteEmploye,
  creerCompteEmploye,
  modifierCompteEmploye,
  reinitialiserMotDePasseEmploye,
} from "@/lib/admin/users.functions";
import { ROLES, type RoleCle } from "@/lib/access/roles";
import { listerMagasins } from "@/lib/db/sorties";
import {
  basculerPermissionRole,
  LABEL_ROLE_BASE,
  listerCataloguePermissions,
  listerMatricePermissions,
  listerUtilisateurs,
  ROLES_BASE,
  type RoleBase,
  type UtilisateurEntreprise,
} from "@/lib/db/utilisateurs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/administration/utilisateurs")({
  component: UtilisateursPage,
});

type FormValues = {
  nomComplet: string;
  email: string;
  motDePasse: string;
  telephone: string;
  role: RoleBase;
  magasinId: string;
};

const vide: FormValues = {
  nomComplet: "",
  email: "",
  motDePasse: "",
  telephone: "",
  role: "vendeur",
  magasinId: "aucun",
};

function genererMotDePasseTemporaire() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const octets = crypto.getRandomValues(new Uint32Array(10));
  return `Bs${[...octets].map((n) => alphabet[n % alphabet.length]).join("")}!`;
}

function UtilisateursPage() {
  const queryClient = useQueryClient();
  const { peut } = usePermissions();
  const { simule } = useRoleActuel();

  const creer = useServerFn(creerCompteEmploye);
  const modifier = useServerFn(modifierCompteEmploye);
  const basculer = useServerFn(basculerCompteEmploye);
  const reinitialiser = useServerFn(reinitialiserMotDePasseEmploye);

  const { data: utilisateurs = [], isLoading } = useQuery({
    queryKey: ["utilisateurs"],
    queryFn: listerUtilisateurs,
  });
  const { data: magasins = [] } = useQuery({ queryKey: ["magasins"], queryFn: listerMagasins });
  const { data: catalogue = [] } = useQuery({
    queryKey: ["permissions-catalogue"],
    queryFn: listerCataloguePermissions,
  });
  const { data: matrice = {} } = useQuery({
    queryKey: ["permissions-matrice"],
    queryFn: listerMatricePermissions,
  });

  const [ouvert, setOuvert] = useState(false);
  const [edition, setEdition] = useState<UtilisateurEntreprise | null>(null);
  const [form, setForm] = useState<FormValues>(vide);
  const [motDePasseCible, setMotDePasseCible] = useState<UtilisateurEntreprise | null>(null);
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [resetEffectue, setResetEffectue] = useState(false);

  const gererErreur = (e: unknown) =>
    toast.error(e instanceof Error ? e.message : "Opération refusée par le serveur.");

  const rafraichir = async () => {
    await queryClient.invalidateQueries({ queryKey: ["utilisateurs"] });
    await queryClient.invalidateQueries({ queryKey: ["mes-permissions"] });
  };

  const mutationEnregistrer = useMutation({
    mutationFn: async () => {
      const magasinId = form.magasinId === "aucun" ? null : form.magasinId;
      if (edition) {
        return modifier({
          data: {
            userId: edition.userId,
            nomComplet: form.nomComplet.trim(),
            telephone: form.telephone.trim() || null,
            role: form.role,
            magasinId,
          },
        });
      }
      return creer({
        data: {
          nomComplet: form.nomComplet.trim(),
          email: form.email.trim(),
          motDePasse: form.motDePasse,
          telephone: form.telephone.trim() || undefined,
          role: form.role,
          magasinId,
        },
      });
    },
    onSuccess: async () => {
      toast.success(edition ? "Utilisateur mis à jour." : "Compte créé.");
      setOuvert(false);
      await rafraichir();
    },
    onError: gererErreur,
  });

  const mutationStatut = useMutation({
    mutationFn: (u: UtilisateurEntreprise) =>
      basculer({ data: { userId: u.userId, actif: !u.actif } }),
    onSuccess: async () => {
      toast.success("Statut du compte mis à jour.");
      await rafraichir();
    },
    onError: gererErreur,
  });

  const mutationMotDePasse = useMutation({
    mutationFn: () =>
      reinitialiser({
        data: { userId: motDePasseCible!.userId, motDePasse: nouveauMotDePasse },
      }),
    onSuccess: () => {
      toast.success("Accès temporaire régénéré.");
      setResetEffectue(true);
    },
    onError: gererErreur,
  });

  const mutationPermission = useMutation({
    mutationFn: (v: { role: RoleBase; permission: string; autorise: boolean }) =>
      basculerPermissionRole(v.role, v.permission, v.autorise),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["permissions-matrice"] });
      await queryClient.invalidateQueries({ queryKey: ["mes-permissions"] });
    },
    onError: gererErreur,
  });

  const parModule = useMemo(() => {
    const groupes = new Map<string, typeof catalogue>();
    for (const p of catalogue) {
      groupes.set(p.module, [...(groupes.get(p.module) ?? []), p]);
    }
    return [...groupes.entries()];
  }, [catalogue]);

  const gestion = peut("users.manage");
  const gestionRoles = peut("roles.manage");

  return (
    <div className="flex flex-col gap-5">
      <AdminCard
        titre="Utilisateurs"
        description="Comptes réels de votre entreprise. Chaque création génère un accès à l'application."
        actions={
          gestion ? (
            <Button
              onClick={() => {
                setEdition(null);
                setForm(vide);
                setOuvert(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Ajouter un utilisateur
            </Button>
          ) : undefined
        }
      >
        {isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Chargement des comptes…</p>
        ) : (
          <div className="overflow-x-auto scrollbar-slim">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Utilisateur</th>
                  <th className="pb-2 pr-3 font-medium">Rôle</th>
                  <th className="pb-2 pr-3 font-medium">Magasin</th>
                  <th className="pb-2 pr-3 font-medium">Statut</th>
                  <th className="pb-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {utilisateurs.map((u) => (
                  <tr key={u.userId} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-3" data-label="Utilisateur">
                      <p className="font-medium text-foreground">{u.nomComplet}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                      {u.telephone && (
                        <p className="text-xs text-muted-foreground">{u.telephone}</p>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground" data-label="Rôle">
                      {u.role ? LABEL_ROLE_BASE[u.role] : "Aucun rôle"}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground" data-label="Magasin">
                      {magasins.find((m) => m.id === u.magasinId)?.nom ?? "Tous"}
                    </td>
                    <td className="py-3 pr-3" data-label="Statut">
                      <Pastille ton={u.actif ? "succes" : "danger"}>
                        {u.actif ? "Actif" : "Désactivé"}
                      </Pastille>
                    </td>
                    <td className="py-3" data-label="Actions">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Modifier"
                          disabled={!gestion}
                          onClick={() => {
                            setEdition(u);
                            setForm({
                              nomComplet: u.nomComplet,
                              email: u.email,
                              motDePasse: "",
                              telephone: u.telephone,
                              role: u.role ?? "vendeur",
                              magasinId: u.magasinId ?? "aucun",
                            });
                            setOuvert(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Réinitialiser le mot de passe"
                          disabled={!gestion}
                          onClick={() => {
                            setMotDePasseCible(u);
                            setNouveauMotDePasse(genererMotDePasseTemporaire());
                            setResetEffectue(false);
                          }}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={u.actif ? "Désactiver le compte" : "Réactiver le compte"}
                          disabled={!gestion || mutationStatut.isPending}
                          onClick={() => mutationStatut.mutate(u)}
                        >
                          {u.actif ? (
                            <ShieldBan className="h-4 w-4" />
                          ) : (
                            <ShieldCheck className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      <AdminCard
        titre="Rôles et permissions"
        description="Chaque case active une permission réelle, appliquée immédiatement côté serveur."
      >
        <div className="flex flex-col gap-6">
          {parModule.map(([module, permissions]) => (
            <div key={module} className="overflow-x-auto scrollbar-slim">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                {module}
              </p>
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Permission</th>
                    {ROLES_BASE.map((r) => (
                      <th key={r.value} className="pb-2 pr-2 text-center font-medium">
                        {r.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((p) => (
                    <tr key={p.code} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 pr-3">
                        <p className="text-foreground">{p.libelle}</p>
                        <p className="text-xs text-muted-foreground">{p.code}</p>
                      </td>
                      {ROLES_BASE.map((r) => {
                        const actif = (matrice[r.value] ?? []).includes(p.code);
                        return (
                          <td key={r.value} className="py-2.5 pr-2 text-center">
                            <button
                              type="button"
                              aria-label={`${p.libelle} — ${r.label}`}
                              disabled={!gestionRoles}
                              onClick={() =>
                                mutationPermission.mutate({
                                  role: r.value,
                                  permission: p.code,
                                  autorise: !actif,
                                })
                              }
                              className={cn(
                                "h-5 w-5 rounded-md border transition disabled:opacity-40",
                                actif
                                  ? "border-primary bg-primary"
                                  : "border-border bg-background hover:bg-muted",
                              )}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard
        titre="Interface par rôle"
        description="Prévisualisez l'application telle que la voit chaque profil. Les menus non autorisés sont masqués."
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
      </AdminCard>

      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{edition ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}</DialogTitle>
            <DialogDescription>
              {edition
                ? "Le rôle et les informations sont appliqués immédiatement."
                : "Le compte est créé et l'utilisateur peut se connecter aussitôt."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Nom complet">
              <Input
                value={form.nomComplet}
                onChange={(e) => setForm((f) => ({ ...f, nomComplet: e.target.value }))}
              />
            </Champ>
            <Champ label="Email">
              <Input
                type="email"
                value={form.email}
                disabled={!!edition}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </Champ>
            {!edition && (
              <Champ label="Mot de passe provisoire">
                <Input
                  type="password"
                  value={form.motDePasse}
                  onChange={(e) => setForm((f) => ({ ...f, motDePasse: e.target.value }))}
                  placeholder="8 caractères minimum"
                />
              </Champ>
            )}
            <Champ label="Téléphone">
              <Input
                value={form.telephone}
                onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
              />
            </Champ>
            <Champ label="Rôle">
              <Select
                value={form.role}
                onValueChange={(v) => setForm((f) => ({ ...f, role: v as RoleBase }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES_BASE.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Champ>
            <Champ label="Magasin">
              <Select
                value={form.magasinId}
                onValueChange={(v) => setForm((f) => ({ ...f, magasinId: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aucun">Tous les magasins</SelectItem>
                  {magasins.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Champ>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOuvert(false)}>
              Annuler
            </Button>
            <Button
              disabled={
                mutationEnregistrer.isPending ||
                !form.nomComplet.trim() ||
                (!edition && (!form.email.trim() || form.motDePasse.length < 8))
              }
              onClick={() => mutationEnregistrer.mutate()}
            >
              {mutationEnregistrer.isPending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={motDePasseCible !== null}
        onOpenChange={(o) => {
          if (!o) {
            setMotDePasseCible(null);
            setNouveauMotDePasse("");
            setResetEffectue(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              Générez un accès temporaire pour {motDePasseCible?.nomComplet}. L'employé devra le
              remplacer à sa prochaine connexion.
            </DialogDescription>
          </DialogHeader>
          <Champ label="Mot de passe temporaire">
            <div className="flex gap-2">
              <Input readOnly value={nouveauMotDePasse} className="font-mono" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Générer un autre mot de passe"
                disabled={resetEffectue}
                onClick={() => setNouveauMotDePasse(genererMotDePasseTemporaire())}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Copier le mot de passe temporaire"
                onClick={async () => {
                  await navigator.clipboard.writeText(nouveauMotDePasse);
                  toast.success("Mot de passe temporaire copié.");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </Champ>
          {resetEffectue && (
            <p role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-xs text-foreground">
              Le mot de passe affiché est maintenant actif. Copiez-le avant de fermer cette fenêtre.
            </p>
          )}
          <DialogFooter>
            {resetEffectue ? (
              <Button onClick={() => setMotDePasseCible(null)}>Terminer</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setMotDePasseCible(null)}>
                  Annuler
                </Button>
                <Button
                  disabled={nouveauMotDePasse.length < 8 || mutationMotDePasse.isPending}
                  onClick={() => mutationMotDePasse.mutate()}
                >
                  Activer ce mot de passe temporaire
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
