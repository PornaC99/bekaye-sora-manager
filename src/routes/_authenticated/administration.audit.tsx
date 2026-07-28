import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { AdminCard, Pastille } from "@/components/admin/pieces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { journaliser, useAdminStore } from "@/lib/admin/store";
import { LABEL_ACTION, formatDateHeure, type ActionAudit } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/administration/audit")({
  component: AuditPage,
});

const TONS: Record<ActionAudit, "succes" | "attention" | "danger" | "neutre"> = {
  connexion: "succes",
  deconnexion: "neutre",
  creation: "succes",
  modification: "attention",
  suppression: "danger",
  export: "neutre",
  connexion_echouee: "danger",
  acces_refuse: "danger",
};

function AuditPage() {
  const { audit } = useAdminStore();
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<"toutes" | ActionAudit>("toutes");

  const lignes = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return audit.filter((a) => {
      const okFiltre = filtre === "toutes" || a.action === filtre;
      const okRecherche =
        q === "" ||
        [a.utilisateur, a.module, a.details, a.ip, a.appareil].join(" ").toLowerCase().includes(q);
      return okFiltre && okRecherche;
    });
  }, [audit, filtre, recherche]);

  const exporter = () => {
    const entetes = ["Date", "Utilisateur", "Action", "Module", "Détails", "IP", "Appareil"];
    const csv = [
      entetes.join(";"),
      ...lignes.map((a) =>
        [
          formatDateHeure(a.date),
          a.utilisateur,
          LABEL_ACTION[a.action],
          a.module,
          a.details.replaceAll(";", ","),
          a.ip,
          a.appareil,
        ].join(";"),
      ),
    ].join("\n");

    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" }));
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `journal-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    lien.click();
    URL.revokeObjectURL(url);
    journaliser({ action: "export", module: "Journal d'audit", details: "Export CSV du journal." });
    toast.success("Journal exporté");
  };

  return (
    <AdminCard
      titre="Journal d'audit"
      description="Toutes les actions sensibles sont enregistrées automatiquement et conservées."
      actions={
        <Button variant="secondary" onClick={exporter}>
          <Download className="mr-1.5 h-4 w-4" /> Exporter
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          className="h-9 w-full sm:w-64"
          placeholder="Rechercher un utilisateur, un module…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
        <div className="flex flex-wrap gap-1">
          {(["toutes", ...Object.keys(LABEL_ACTION)] as ("toutes" | ActionAudit)[]).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setFiltre(a)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                filtre === a
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70",
              )}
            >
              {a === "toutes" ? "Toutes" : LABEL_ACTION[a as ActionAudit]}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="pb-2 pr-3 font-medium">Date & heure</th>
              <th className="pb-2 pr-3 font-medium">Utilisateur</th>
              <th className="pb-2 pr-3 font-medium">Action</th>
              <th className="pb-2 pr-3 font-medium">Module</th>
              <th className="pb-2 pr-3 font-medium">Détails</th>
              <th className="pb-2 pr-3 font-medium">Adresse IP</th>
              <th className="pb-2 font-medium">Appareil</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((a) => (
              <tr key={a.id} className="border-b border-border/60 last:border-0">
                <td className="whitespace-nowrap py-3 pr-3 text-muted-foreground">
                  {formatDateHeure(a.date)}
                </td>
                <td className="py-3 pr-3 font-medium text-foreground">{a.utilisateur}</td>
                <td className="py-3 pr-3">
                  <Pastille ton={TONS[a.action]}>{LABEL_ACTION[a.action]}</Pastille>
                </td>
                <td className="py-3 pr-3 text-muted-foreground">{a.module}</td>
                <td className="py-3 pr-3 text-muted-foreground">{a.details}</td>
                <td className="py-3 pr-3 text-muted-foreground">{a.ip}</td>
                <td className="py-3 text-muted-foreground">{a.appareil}</td>
              </tr>
            ))}
            {lignes.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  Aucune entrée ne correspond à votre recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminCard>
  );
}
