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
  const creerCompte = useServerFn(creerCompteEmploye);

  useEffect(() => {
    if (!open) return;
    setAcces(false);
    setEmailConnexion(employe?.emailConnexion ?? "");
    setMotDePasse("");
    setRoleCompte("vendeur");
    setCompteActif(true);
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
    if (!motDePasse) return;
    try {
      await navigator.clipboard.writeText(`${emailConnexion} / ${motDePasse}`);
      toast.success("Identifiants copiés dans le presse-papiers.");
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
      if (acces) {
        // Le compte est créé côté serveur : rôle, tenant, permissions et audit
        // sont déterminés par le backend, jamais par le frontend.
        const resultat = (await creerCompte({
          data: {
            nomComplet: values.nom.trim(),
            email: emailConnexion.trim(),
            motDePasse,
            telephone: values.telephone.trim() || undefined,
            role: roleCompte,
            magasinId: null,
            actif: compteActif,
          },
        })) as { userId: string };
        userId = resultat.userId;
      }

      const aEnregistrer: EmployeFormValues = {
        ...values,
        emailConnexion: acces ? emailConnexion.trim() : (values.emailConnexion ?? null),
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
        toast.success("Compte de connexion créé", {
          description: `${emailConnexion.trim()} — mot de passe temporaire à communiquer à l'employé.`,
          duration: 8000,
        });
      }
      onOpenChange(false);
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
          <Champ label="Email">
            <Input
              type="email"
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={soumettre}>{employe ? "Enregistrer" : "Ajouter l'employé"}</Button>
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
