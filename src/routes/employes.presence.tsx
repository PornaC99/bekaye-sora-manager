import { createFileRoute } from "@tanstack/react-router";

import { AttendancePanel } from "@/components/hr/attendance-panel";
import { PageHeader } from "@/components/layout/page";
import { useHrStore } from "@/lib/hr/store";

export const Route = createFileRoute("/employes/presence")({
  component: PresencePage,
});

function PresencePage() {
  const { employes, presences } = useHrStore();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Ressources humaines"
        title="Présence et pointage"
        description="Suivez les arrivées, les départs, les retards et les absences de l'équipe."
      />
      <AttendancePanel employes={employes} presences={presences} />
    </div>
  );
}
