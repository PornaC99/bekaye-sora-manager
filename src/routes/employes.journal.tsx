import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { ActivityLog } from "@/components/hr/activity-log";
import { PageHeader } from "@/components/layout/page";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHrStore } from "@/lib/hr/store";
import { TYPE_ACTIVITE_LABEL } from "@/lib/hr/types";

export const Route = createFileRoute("/employes/journal")({
  component: JournalPage,
});

function JournalPage() {
  const { activites, employes } = useHrStore();
  const [recherche, setRecherche] = useState("");
  const [type, setType] = useState("tous");
  const [employeId, setEmployeId] = useState("tous");

  const filtrees = useMemo(
    () =>
      activites.filter((a) => {
        if (type !== "tous" && a.type !== type) return false;
        if (employeId !== "tous" && a.employeId !== employeId) return false;
        if (
          recherche &&
          !`${a.description} ${a.module} ${a.auteur}`.toLowerCase().includes(recherche.toLowerCase())
        )
          return false;
        return true;
      }),
    [activites, type, employeId, recherche],
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Ressources humaines"
        title="Journal d'activité"
        description="Qui a fait quoi, quand et dans quel module de l'application."
      />
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Rechercher une action…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="w-full sm:max-w-xs"
        />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Type d'action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Toutes les actions</SelectItem>
            {Object.entries(TYPE_ACTIVITE_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={employeId} onValueChange={setEmployeId}>
          <SelectTrigger className="w-[190px]">
            <SelectValue placeholder="Employé" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les employés</SelectItem>
            {employes.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ActivityLog activites={filtrees} />
    </div>
  );
}
