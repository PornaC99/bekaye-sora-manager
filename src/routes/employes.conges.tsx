import { createFileRoute } from "@tanstack/react-router";

import { LeavesPanel } from "@/components/hr/leaves-panel";
import { PageHeader } from "@/components/layout/page";
import { useHrStore } from "@/lib/hr/store";

export const Route = createFileRoute("/employes/conges")({
  component: CongesPage,
});

function CongesPage() {
  const { employes, conges } = useHrStore();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Ressources humaines"
        title="Congés et absences"
        description="Demandes de congé, validations et historique complet."
      />
      <LeavesPanel employes={employes} conges={conges} />
    </div>
  );
}
