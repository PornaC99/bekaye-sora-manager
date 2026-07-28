import { Fragment } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { basculerPermissionRole, reinitialiserPermissions } from "@/lib/hr/store";
import { PERMISSIONS, ROLES, type Permission, type RoleEmploye } from "@/lib/hr/types";

export function PermissionsMatrix({
  permissionsRoles,
}: {
  permissionsRoles: Record<RoleEmploye, Permission[]>;
}) {
  const groupes = [...new Set(PERMISSIONS.map((p) => p.groupe))];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Rôles et permissions</h2>
          <p className="text-sm text-muted-foreground">
            Chaque rôle définit ce que l'employé peut voir et faire dans l'application.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            reinitialiserPermissions();
            toast.success("Matrice réinitialisée aux valeurs par défaut.");
          }}
        >
          <RotateCcw className="mr-2 h-4 w-4" /> Réinitialiser
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {ROLES.map((role) => (
          <div
            key={role.value}
            className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
          >
            <p className="font-medium text-foreground">{role.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{role.description}</p>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
              {permissionsRoles[role.value]?.length ?? 0} permissions
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/50 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Permission</th>
                {ROLES.map((role) => (
                  <th key={role.value} className="px-3 py-3 text-center font-medium">
                    {role.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupes.map((groupe) => (
                <Fragment key={groupe}>
                  <tr className="border-t border-border bg-muted/30">
                    <td
                      colSpan={ROLES.length + 1}
                      className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                    >
                      {groupe}
                    </td>
                  </tr>
                  {PERMISSIONS.filter((p) => p.groupe === groupe).map((permission) => (
                    <tr key={permission.value} className="border-t border-border">
                      <td className="px-4 py-2.5 text-foreground">{permission.label}</td>
                      {ROLES.map((role) => (
                        <td key={role.value} className="px-3 py-2.5 text-center">
                          <Checkbox
                            checked={permissionsRoles[role.value]?.includes(permission.value)}
                            onCheckedChange={() =>
                              basculerPermissionRole(role.value, permission.value)
                            }
                            aria-label={`${permission.label} — ${role.label}`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
