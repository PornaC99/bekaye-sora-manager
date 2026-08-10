import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { creerCompteEmploye } from "@/lib/admin/users.functions";
import { ROLES_BASE, type RoleBase } from "@/lib/db/utilisateurs";
import { ajouterEmploye, modifierEmploye } from "@/lib/hr/store";
import {
  DEPARTEMENTS,
  ROLES,
  STATUT_EMPLOYE_LABEL,
  type Departement,
  type Employe,
  type EmployeFormValues,
  type RoleEmploye,
  type StatutEmploye,
} from "@/lib/hr/types";

const VIDE: EmployeFormValues = {
  nom: "",
  photo: null,
  dateNaissance: "",
  sexe: "Femme",
  telephone: "",
  whatsapp: "",
  adresse: "",
  email: "",
  fonction: "",
  departement: "Ventes",
  role: "vendeur",
  dateEmbauche: new Date().toISOString().slice(0, 10),
  salaireBase: 150000,
  objectifMensuel: 1000000,
  statut: "actif",
  notes: "",
  emailConnexion: null,
  userId: null,
  compteActif: false,
};

/** Mot de passe temporaire aléatoire (jamais stocké en base métier). */
function genererMotDePasse() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const octets = crypto.getRandomValues(new Uint32Array(10));
  return `Bs${[...octets].map((n) => alphabet[n % alphabet.length]).join("")}!`;
}


export function EmployeeFormDialog({
  open,
  onOpenChange,
  employe,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employe: Employe | null;
}) {
  const [values, setValues] = useState<EmployeFormValues>(VIDE);
  const [acces, setAcces] = useState(false);
  const [emailConnexion, setEmailConnexion] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [roleCompte, setRoleCompte] = useState<RoleBase>("vendeur");
  const [compteActif, setCompteActif] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [compteCree, setCompteCree] = useState(false);
  const [identifiantsCrees, setIdentifiantsCrees] = useState<{
    email: string;
    motDePasse: string;
  } | null>(null);
  const creerCompte = useServerFn(creerCompteEmploye);

  useEffect(() => {
    if (!open) return;
    setAcces(false);
    setEmailConnexion(employe?.emailConnexion ?? "");
    setMotDePasse("");
    setRoleCompte("vendeur");
    setCompteActif(true);
    setCompteCree(false);
    setIdentifiantsCrees(null);
    setValues(
      employe
        ? {
            nom: employe.nom,
            photo: employe.photo,
            dateNaissance: employe.dateNaissance ?? "",
            sexe: employe.sexe,
            telephone: employe.telephone,
            whatsapp: employe.whatsapp,
            adresse: employe.adresse,
            email: employe.email,
            fonction: employe.fonction,
            departement: employe.departement,
            role: employe.role,
            dateEmbauche: employe.dateEmbauche,
            salaireBase: employe.salaireBase,
            objectifMensuel: employe.objectifMensuel,
            statut: employe.statut,
            notes: employe.notes,
            emailConnexion: employe.emailConnexion ?? null,
            userId: employe.userId ?? null,
            compteActif: employe.compteActif ?? false,
          }
        : VIDE,
    );
  }, [open, employe]);

  const set = <K extends keyof EmployeFormValues>(cle: K, valeur: EmployeFormValues[K]) =>
    setValues((v) => ({ ...v, [cle]: valeur }));

  async function copierMotDePasse() {
    const valeur = identifiantsCrees?.motDePasse ?? motDePasse;
    if (!valeur) return;
    try {
      await navigator.clipboard.writeText(valeur);
      toast.success("Mot de passe temporaire copié.");
    } catch {
      toast.error("Copie impossible sur cet appareil.");
    }
  }

  async function soumettre() {
    if (!values.nom.trim() || !values.fonction.trim()) {
      toast.error("Le nom et la fonction sont obligatoires.");
      return;
    }
    if (acces) {
      if (!/^\S+@\S+\.\S+$/.test(emailConnexion.trim())) {
        toast.error("Saisissez un e-mail de connexion valide.");
        return;
      }
      if (motDePasse.length < 8) {
        toast.error("Générez un mot de passe temporaire (8 caractères minimum).");
        return;
      }
    }

    setEnCours(true);
    try {
      let userId: string | null = values.userId ?? null;
      let emailAuthCree: string | null = null;
      if (acces) {
        // Capture un instantané immuable : l'appel Auth peut prendre du temps et
        // l'écran de succès doit afficher exactement les valeurs envoyées.
        const emailAuthEnvoye = emailConnexion.trim();
        const motDePasseEnvoye = motDePasse;
        // Le compte est créé côté serveur : rôle, tenant, permissions et audit
        // sont déterminés par le backend, jamais par le frontend.
        const resultat = (await creerCompte({
          data: {
            nomComplet: values.nom.trim(),
            email: emailAuthEnvoye,
            motDePasse: motDePasseEnvoye,
            telephone: values.telephone.trim() || undefined,
            role: roleCompte,
            magasinId: null,
            actif: compteActif,
            employe: {
              email: values.email.trim() || null,
              adresse: values.adresse.trim() || null,
              poste: values.fonction.trim(),
              dateEmbauche: values.dateEmbauche,
              salaireBase: values.salaireBase,
            },
          },
        })) as { userId: string; email: string };
        userId = resultat.userId;
        emailAuthCree = resultat.email;
        setEmailConnexion(emailAuthCree);
        setIdentifiantsCrees({ email: emailAuthCree, motDePasse: motDePasseEnvoye });
      }

      const aEnregistrer: EmployeFormValues = {
        ...values,
        emailConnexion: acces ? emailAuthCree : (values.emailConnexion ?? null),
        userId,
        compteActif: acces ? compteActif : (values.compteActif ?? false),
      };

      if (employe) {
        modifierEmploye(employe.id, aEnregistrer);
        toast.success("Fiche employé mise à jour.");
      } else {
        const cree = ajouterEmploye(aEnregistrer);
        toast.success(`${cree.nom} a été ajouté (${cree.matricule}).`);
      }
      if (acces) {
        setCompteCree(true);
        toast.success("Compte de connexion créé", {
          description: "Copiez maintenant le mot de passe temporaire affiché avant de fermer.",
          duration: 8000,
        });
      } else {
        onOpenChange(false);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Création du compte refusée par le serveur.",
      );
    } finally {
      setEnCours(false);
    }
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employe ? "Modifier l'employé" : "Nouvel employé"}</DialogTitle>
          <DialogDescription>
            Renseignez les informations personnelles, professionnelles et contractuelles.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Champ label="Nom et prénom *">
            <Input value={values.nom} onChange={(e) => set("nom", e.target.value)} />
          </Champ>
          <Champ label="Fonction *">
            <Input value={values.fonction} onChange={(e) => set("fonction", e.target.value)} />
          </Champ>
          <Champ label="Téléphone">
            <Input value={values.telephone} onChange={(e) => set("telephone", e.target.value)} />
          </Champ>
          <Champ label="WhatsApp">
            <Input value={values.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
          </Champ>
          <Champ label="Email professionnel / personnel">
            <Input
              type="email"
              placeholder="Distinct de l'e-mail de connexion"
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Champ>
          <Champ label="Adresse">
            <Input value={values.adresse} onChange={(e) => set("adresse", e.target.value)} />
          </Champ>
          <Champ label="Date de naissance">
            <Input
              type="date"
              value={values.dateNaissance ?? ""}
              onChange={(e) => set("dateNaissance", e.target.value)}
            />
          </Champ>
          <Champ label="Sexe">
            <Select
              value={values.sexe}
              onValueChange={(v) => set("sexe", v as EmployeFormValues["sexe"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Femme">Femme</SelectItem>
                <SelectItem value="Homme">Homme</SelectItem>
              </SelectContent>
            </Select>
          </Champ>
          <Champ label="Département">
            <Select
              value={values.departement}
              onValueChange={(v) => set("departement", v as Departement)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPARTEMENTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Champ>
          <Champ label="Rôle et permissions">
            <Select value={values.role} onValueChange={(v) => set("role", v as RoleEmploye)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Champ>
          <Champ label="Date d'embauche">
            <Input
              type="date"
              value={values.dateEmbauche}
              onChange={(e) => set("dateEmbauche", e.target.value)}
            />
          </Champ>
          <Champ label="Statut">
            <Select value={values.statut} onValueChange={(v) => set("statut", v as StatutEmploye)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUT_EMPLOYE_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Champ>
          <Champ label="Salaire de base (FCFA)">
            <Input
              type="number"
              value={values.salaireBase}
              onChange={(e) => set("salaireBase", Number(e.target.value))}
            />
          </Champ>
          <Champ label="Objectif mensuel (FCFA)">
            <Input
              type="number"
              value={values.objectifMensuel}
              onChange={(e) => set("objectifMensuel", Number(e.target.value))}
            />
          </Champ>
          <div className="sm:col-span-2">
            <Champ label="Notes internes">
              <Textarea
                rows={3}
                value={values.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </Champ>
          </div>
        </div>

        <section className="rounded-xl border border-border bg-muted/30 p-4">
          <header className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-foreground">
              Accès au logiciel
            </h3>
          </header>

          <label className="mt-3 flex items-start gap-2.5 text-sm">
            <Checkbox
              checked={acces}
              onCheckedChange={(v) => {
                const actif = v === true;
                setAcces(actif);
                if (actif && !motDePasse) setMotDePasse(genererMotDePasse());
              }}
              className="mt-0.5"
              disabled={Boolean(values.userId) || enCours}
            />
            <span>
              Créer un compte de connexion
              <span className="block text-xs text-muted-foreground">
                Le compte est créé dans le système d'authentification sécurisé. Aucun mot de passe
                n'est stocké dans la fiche employé.
              </span>
            </span>
          </label>

          {values.userId && (
            <p className="mt-3 rounded-lg bg-success/10 p-2.5 text-xs text-foreground">
              Cet employé possède déjà un compte ({values.emailConnexion}). Gérez-le depuis
              Administration → Utilisateurs.
            </p>
          )}

          {compteCree && (
            <div role="status" className="mt-3 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-foreground">
              <p className="font-medium">Compte créé et confirmé</p>
              <p className="mt-1 break-all text-xs">E-mail Auth : {identifiantsCrees?.email}</p>
              <p className="mt-1 font-mono text-sm">
                Mot de passe temporaire : {identifiantsCrees?.motDePasse}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Copiez ce mot de passe maintenant : il ne sera plus affiché après fermeture.
              </p>
            </div>
          )}

          {acces && !compteCree && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Champ label="Email de connexion">
                <Input
                  type="email"
                  placeholder="caissier@entreprise.com"
                  value={emailConnexion}
                  onChange={(e) => setEmailConnexion(e.target.value)}
                  disabled={enCours}
                />
              </Champ>
              <Champ label="Rôle (permissions applicatives)">
                <Select
                  value={roleCompte}
                  onValueChange={(v) => setRoleCompte(v as RoleBase)}
                  disabled={enCours}
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
              <Champ label="Mot de passe temporaire">
                <div className="flex gap-2">
                  <Input readOnly value={motDePasse} disabled={enCours} className="font-mono text-sm" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Générer un mot de passe"
                    onClick={() => setMotDePasse(genererMotDePasse())}
                    disabled={enCours}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Copier le mot de passe temporaire"
                    onClick={copierMotDePasse}
                    disabled={enCours}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </Champ>
              <Champ label="Statut du compte">
                <Select
                  value={compteActif ? "actif" : "inactif"}
                  onValueChange={(v) => setCompteActif(v === "actif")}
                  disabled={enCours}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actif">Actif</SelectItem>
                    <SelectItem value="inactif">Désactivé</SelectItem>
                  </SelectContent>
                </Select>
              </Champ>
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Le mot de passe temporaire sera utilisé uniquement lors de la première connexion.
                L'employé devra ensuite définir son propre mot de passe.
              </p>
            </div>
          )}
        </section>

        <DialogFooter>
          {compteCree ? (
            <>
              <Button variant="outline" onClick={copierMotDePasse}>
                <Copy className="mr-2 h-4 w-4" /> Copier le mot de passe
              </Button>
              <Button onClick={() => onOpenChange(false)}>Terminer</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={enCours}>
                Annuler
              </Button>
              <Button onClick={soumettre} disabled={enCours}>
                {enCours && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {employe ? "Enregistrer" : "Ajouter l'employé"}
              </Button>
            </>
          )}
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}

function Champ({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
