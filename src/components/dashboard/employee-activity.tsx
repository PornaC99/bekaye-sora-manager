import { Link } from "@tanstack/react-router";

import { employeeActivity, formatFCFA } from "@/lib/dashboard-data";
import { SectionCard } from "./section-card";

export function EmployeeActivityList() {
  return (
    <SectionCard
      title="Activité des employés aujourd'hui"
      description="Ventes réalisées par membre de l'équipe"
      action={
        <Link
          to="/employes"
          className="text-xs font-semibold text-primary transition-opacity hover:opacity-70"
        >
          Équipe
        </Link>
      }
    >
      <ul className="flex flex-col gap-3">
        {employeeActivity.map((emp) => (
          <li
            key={emp.id}
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:border-primary/25 hover:bg-muted/40"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
              {emp.initiales}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{emp.nom}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {emp.ventes} ventes · {emp.derniereActivite}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-foreground">
              {formatFCFA(emp.montant)}
            </span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
