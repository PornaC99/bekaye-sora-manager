import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Download, Plus, Trophy, UserCheck, Users, Wallet } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page";
import { EmployeeFormDialog } from "@/components/hr/employee-form-dialog";
import { EmployeesTable } from "@/components/hr/employees-table";
import { HrKpiCards } from "@/components/hr/kpi-cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculerKpisRh } from "@/lib/hr/analytics";
import { exporterCsv } from "@/lib/hr/print";
import { useHrStore } from "@/lib/hr/store";
import {
  DEPARTEMENTS,
  ROLES,
  ROLE_LABEL,
  STATUT_EMPLOYE_LABEL,
  type Employe,
} from "@/lib/hr/types";
import { formatFCFA } from "@/lib/products/types";
import { useSalesStore } from "@/lib/sales/store";

export const Route = createFileRoute("/employes/")({
  component: EquipePage,
});

function EquipePage() {
  const { employes, presences, conges, bulletins } = useHrStore();
  const { ventes } = useSalesStore();

  const [recherche, setRecherche] = useState("");
  const [departement, setDepartement] = useState("tous");
  const [role, setRole] = useState("tous");
  const [statut, setStatut] = useState("tous");
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [employeEdite, setEmployeEdite] = useState<Employe | null>(null);

  const kpis = useMemo(
    () => calculerKpisRh({ employes, presences, conges, bulletins, ventes }),
    [employes, presences, conges, bulletins, ventes],
  );

  const filtres = useMemo(
    () =>
      employes.filter((e) => {
        const texte = `${e.nom} ${e.matricule} ${e.fonction} ${e.telephone}`.toLowerCase();
        if (recherche && !texte.includes(recherche.toLowerCase())) return false;
        if (departement !== "tous" && e.departement !== departement) return false;
        if (role !== "tous" && e.role !== role) return false;
        if (statut !== "tous" && e.statut !== statut) return false;
        return true;
      }),
    [employes, recherche, departement, role, statut],
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Ressources humaines"
        title="Employés"
        description="Gérez votre équipe, les rôles et les accès à l'application."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                exporterCsv(
                  "employes.csv",
                  ["Matricule", "Nom", "Fonction", "Rôle", "Département", "Salaire", "Statut"],
                  filtres.map((e) => [
                    e.matricule,
                    e.nom,
                    e.fonction,
                    ROLE_LABEL[e.role],
                    e.departement,
                    e.salaireBase,
                    STATUT_EMPLOYE_LABEL[e.statut],
                  ]),
                );
                toast.success("Liste des employés exportée.");
              }}
            >
              <Download className="mr-2 h-4 w-4" /> Exporter
            </Button>
            <Button
              onClick={() => {
                setEmployeEdite(null);
                setDialogOuvert(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Nouvel employé
            </Button>
          </div>
        }
      />

      <HrKpiCards
        cartes={[
          {
            label: "Total employés",
            value: String(kpis.totalEmployes),
            hint: `${kpis.actifs} actifs`,
            icon: Users,
            tone: "primary",
          },
          {
            label: "Présents aujourd'hui",
            value: String(kpis.presentsAujourdhui),
            hint: `${kpis.retardsAujourdhui} retard(s)`,
            icon: UserCheck,
            tone: "success",
          },
          {
            label: "En congé",
            value: String(kpis.enConge),
            hint: "Absences approuvées",
            icon: CalendarDays,
            tone: "warning",
          },
          {
            label: "Masse salariale du mois",
            value: formatFCFA(kpis.masseSalariale),
            hint: `${formatFCFA(kpis.salairesEnAttente)} en attente`,
            icon: Wallet,
            tone: "muted",
          },
          {
            label: "Meilleur vendeur",
            value: kpis.meilleurVendeur,
            hint: "Chiffre d'affaires du mois",
            icon: Trophy,
            tone: "primary",
          },
        ]}
      />

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Rechercher un employé, un matricule…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="w-full sm:max-w-xs"
        />
        <Select value={departement} onValueChange={setDepartement}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Département" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les départements</SelectItem>
            {DEPARTEMENTS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les rôles</SelectItem>
            {ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statut} onValueChange={setStatut}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les statuts</SelectItem>
            {Object.entries(STATUT_EMPLOYE_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <EmployeesTable
        employes={filtres}
        onEdit={(employe) => {
          setEmployeEdite(employe);
          setDialogOuvert(true);
        }}
      />

      <EmployeeFormDialog
        open={dialogOuvert}
        onOpenChange={setDialogOuvert}
        employe={employeEdite}
      />
    </div>
  );
}
