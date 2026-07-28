import { Link } from "@tanstack/react-router";
import { MoreHorizontal, Pencil, Power, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatFCFA } from "@/lib/products/types";
import { changerStatutEmploye, reinitialiserMotDePasse, supprimerEmploye } from "@/lib/hr/store";
import {
  ROLE_LABEL,
  STATUT_EMPLOYE_CLASSE,
  STATUT_EMPLOYE_LABEL,
  type Employe,
} from "@/lib/hr/types";
import { cn } from "@/lib/utils";
import { EmployeeAvatar } from "./employee-avatar";

export function EmployeesTable({
  employes,
  onEdit,
}: {
  employes: Employe[];
  onEdit: (employe: Employe) => void;
}) {
  if (!employes.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Aucun employé ne correspond à votre recherche.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-muted/50 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Employé</th>
              <th className="px-4 py-3 text-left font-medium">Fonction</th>
              <th className="px-4 py-3 text-left font-medium">Rôle</th>
              <th className="px-4 py-3 text-left font-medium">Département</th>
              <th className="px-4 py-3 text-right font-medium">Salaire de base</th>
              <th className="px-4 py-3 text-left font-medium">Statut</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employes.map((employe) => (
              <tr key={employe.id} className="border-t border-border transition hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Link
                    to="/employes/$employeId"
                    params={{ employeId: employe.id }}
                    className="flex items-center gap-3"
                  >
                    <EmployeeAvatar employe={employe} taille="sm" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">
                        {employe.nom}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {employe.matricule}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{employe.fonction}</td>
                <td className="px-4 py-3 text-muted-foreground">{ROLE_LABEL[employe.role]}</td>
                <td className="px-4 py-3 text-muted-foreground">{employe.departement}</td>
                <td className="px-4 py-3 text-right font-medium text-foreground">
                  {formatFCFA(employe.salaireBase)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      STATUT_EMPLOYE_CLASSE[employe.statut],
                    )}
                  >
                    {STATUT_EMPLOYE_LABEL[employe.statut]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onSelect={() => onEdit(employe)}>
                        <Pencil className="mr-2 h-4 w-4" /> Modifier la fiche
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          const mdp = reinitialiserMotDePasse(employe.id);
                          toast.success("Mot de passe réinitialisé", {
                            description: `Mot de passe temporaire : ${mdp}`,
                          });
                        }}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" /> Réinitialiser le mot de passe
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          const suivant = employe.statut === "actif" ? "suspendu" : "actif";
                          changerStatutEmploye(employe.id, suivant);
                          toast.success(
                            suivant === "actif" ? "Compte réactivé" : "Compte suspendu",
                          );
                        }}
                      >
                        <Power className="mr-2 h-4 w-4" />
                        {employe.statut === "actif" ? "Suspendre le compte" : "Réactiver le compte"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={() => {
                          supprimerEmploye(employe.id);
                          toast.success(`${employe.nom} a été supprimé.`);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
