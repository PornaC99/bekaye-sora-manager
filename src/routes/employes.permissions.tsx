import { createFileRoute } from "@tanstack/react-router";

import { PermissionsMatrix } from "@/components/hr/permissions-matrix";
import { PageHeader } from "@/components/layout/page";
import { useHrStore } from "@/lib/hr/store";

export const Route = createFileRoute("/employes/permissions")({
  component: PermissionsPage,
});

function PermissionsPage() {
  const { permissionsRoles } = useHrStore();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Ressources humaines"
        title="Rôles et permissions"
        description="Définissez précisément ce que chaque rôle peut consulter et modifier."
      />
      <PermissionsMatrix permissionsRoles={permissionsRoles} />
    </div>
  );
}
