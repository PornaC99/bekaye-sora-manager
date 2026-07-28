import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { enregistrerPresence } from "@/lib/hr/store";
import {
  STATUT_PRESENCE_CLASSE,
  STATUT_PRESENCE_LABEL,
  formatDuree,
  minutesEntre,
  type Employe,
  type Presence,
  type StatutPresence,
} from "@/lib/hr/types";
import { cn } from "@/lib/utils";
import { EmployeeAvatar } from "./employee-avatar";

export function AttendancePanel({
  employes,
  presences,
}: {
  employes: Employe[];
  presences: Presence[];
}) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const lignes = useMemo(
    () =>
      employes.map((employe) => ({
        employe,
        presence: presences.find((p) => p.employeId === employe.id && p.date === date) ?? null,
      })),
    [employes, presences, date],
  );

  function pointer(employe: Employe, presence: Presence | null, champ: "arrivee" | "depart") {
    const heure = new Date().toTimeString().slice(0, 5);
    enregistrerPresence({
      employeId: employe.id,
      date,
      arrivee: champ === "arrivee" ? heure : (presence?.arrivee ?? null),
      depart: champ === "depart" ? heure : (presence?.depart ?? null),
      retardMinutes: presence?.retardMinutes ?? 0,
      statut: presence?.statut === "conge" ? "conge" : "present",
      methode: "manuel",
    });
    toast.success(`${champ === "arrivee" ? "Arrivée" : "Départ"} enregistré à ${heure}.`);
  }

  function changerStatut(employe: Employe, presence: Presence | null, statut: StatutPresence) {
    enregistrerPresence({
      employeId: employe.id,
      date,
      arrivee: statut === "absent" || statut === "conge" ? null : (presence?.arrivee ?? null),
      depart: statut === "absent" || statut === "conge" ? null : (presence?.depart ?? null),
      retardMinutes: statut === "retard" ? (presence?.retardMinutes || 15) : 0,
      statut,
      methode: "manuel",
    });
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Présence et pointage</h2>
          <p className="text-sm text-muted-foreground">
            Pointage manuel disponible. Code PIN, QR code et biométrie sont prévus dans une
            prochaine version.
          </p>
        </div>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-auto"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-muted/50 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Employé</th>
                <th className="px-4 py-3 text-left font-medium">Arrivée</th>
                <th className="px-4 py-3 text-left font-medium">Départ</th>
                <th className="px-4 py-3 text-left font-medium">Durée</th>
                <th className="px-4 py-3 text-left font-medium">Statut</th>
                <th className="px-4 py-3 text-right font-medium">Pointage</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map(({ employe, presence }) => (
                <tr key={employe.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <EmployeeAvatar employe={employe} taille="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{employe.nom}</p>
                        <p className="text-xs text-muted-foreground">{employe.fonction}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{presence?.arrivee ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{presence?.depart ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDuree(minutesEntre(presence?.arrivee ?? null, presence?.depart ?? null))}
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={presence?.statut ?? "absent"}
                      onValueChange={(v) => changerStatut(employe, presence, v as StatutPresence)}
                    >
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUT_PRESENCE_LABEL).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => pointer(employe, presence, "arrivee")}
                      >
                        Arrivée
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => pointer(employe, presence, "depart")}
                      >
                        Départ
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(STATUT_PRESENCE_LABEL) as StatutPresence[]).map((statut) => (
          <span
            key={statut}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold",
              STATUT_PRESENCE_CLASSE[statut],
            )}
          >
            {STATUT_PRESENCE_LABEL[statut]} ·{" "}
            {presences.filter((p) => p.date === date && p.statut === statut).length}
          </span>
        ))}
      </div>
    </section>
  );
}
