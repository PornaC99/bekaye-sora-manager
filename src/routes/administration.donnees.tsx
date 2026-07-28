import { createFileRoute } from "@tanstack/react-router";
import { Download, FileSpreadsheet, FileText, Upload } from "lucide-react";
import { toast } from "sonner";

import { AdminCard } from "@/components/admin/pieces";
import { Button } from "@/components/ui/button";
import { journaliser } from "@/lib/admin/store";

export const Route = createFileRoute("/administration/donnees")({
  component: DonneesPage,
});

const JEUX = [
  { cle: "produits", label: "Produits", description: "Catalogue, prix, codes-barres et stocks." },
  { cle: "clients", label: "Clients", description: "Fichier client, points de fidélité." },
  { cle: "fournisseurs", label: "Fournisseurs", description: "Partenaires et conditions d'achat." },
  { cle: "employes", label: "Employés", description: "Équipe, rôles et rémunérations." },
  { cle: "stocks", label: "Stocks", description: "Quantités, lots et dates de péremption." },
] as const;

function DonneesPage() {
  const importer = (label: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,.xlsx,.xls";
    input.onchange = () => {
      const fichier = input.files?.[0];
      if (!fichier) return;
      journaliser({
        action: "creation",
        module: "Import / Export",
        details: `Import ${label} depuis « ${fichier.name} ».`,
      });
      toast.success(`Fichier « ${fichier.name} » prêt à être importé (${label})`);
    };
    input.click();
  };

  const exporter = (label: string, format: "Excel" | "CSV" | "PDF") => {
    journaliser({
      action: "export",
      module: "Import / Export",
      details: `Export ${label} au format ${format}.`,
    });
    toast.success(`Export ${label} — ${format} lancé`);
  };

  return (
    <div className="flex flex-col gap-5">
      <AdminCard
        titre="Importer des données"
        description="Reprenez vos données existantes au format CSV ou Excel."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {JEUX.map((j) => (
            <article key={j.cle} className="rounded-2xl border border-border bg-background p-4">
              <p className="text-sm font-semibold text-foreground">{j.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{j.description}</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => importer(j.label)}>
                <Upload className="mr-1.5 h-4 w-4" /> Importer un fichier
              </Button>
            </article>
          ))}
        </div>
      </AdminCard>

      <AdminCard
        titre="Exporter des données"
        description="Téléchargez vos données dans le format de votre choix."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Jeu de données</th>
                <th className="pb-2 text-right font-medium">Formats</th>
              </tr>
            </thead>
            <tbody>
              {JEUX.map((j) => (
                <tr key={j.cle} className="border-b border-border/60 last:border-0">
                  <td className="py-3 pr-3">
                    <p className="font-medium text-foreground">{j.label}</p>
                    <p className="text-xs text-muted-foreground">{j.description}</p>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => exporter(j.label, "Excel")}>
                        <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Excel
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => exporter(j.label, "CSV")}>
                        <Download className="mr-1.5 h-4 w-4" /> CSV
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => exporter(j.label, "PDF")}>
                        <FileText className="mr-1.5 h-4 w-4" /> PDF
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}
