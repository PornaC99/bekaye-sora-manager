import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileSpreadsheet, Plus, Search } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import { PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExpenseFormDialog } from "@/components/finance/expense-form-dialog";
import { ExpensesPie } from "@/components/finance/expenses-pie";
import { ExpensesTable } from "@/components/finance/expenses-table";
import { exporterCsv, exporterExcel } from "@/lib/finance/print";
import {
  CATEGORIES_DEPENSE,
  SOURCE_DEPENSE_LABEL,
  STATUT_DEPENSE_LABEL,
  estCeMois,
  type Depense,
} from "@/lib/finance/types";
import { useFinances } from "@/lib/finance/use-finance";
import { useHrStore } from "@/lib/hr/store";
import { formatFCFA } from "@/lib/products/types";

export const Route = createFileRoute("/_authenticated/depenses/charges")({
  component: ChargesPage,
});

function ChargesPage() {
  const finances = useFinances();
  const { employes } = useHrStore();
  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState("toutes");
  const [statut, setStatut] = useState("tous");
  const [source, setSource] = useState("toutes");
  const [periode, setPeriode] = useState("mois");
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [enEdition, setEnEdition] = useState<Depense | null>(null);

  const filtrees = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return finances.toutesDepenses.filter((depense) => {
      if (periode === "mois" && !estCeMois(depense.date)) return false;
      if (categorie !== "toutes" && depense.categorie !== categorie) return false;
      if (statut !== "tous" && depense.statut !== statut) return false;
      if (source !== "toutes" && depense.source !== source) return false;
      if (
        terme &&
        !`${depense.description} ${depense.responsable}`.toLowerCase().includes(terme)
      )
        return false;
      return true;
    });
  }, [finances.toutesDepenses, recherche, categorie, statut, source, periode]);

  const total = filtrees
    .filter((d) => d.statut !== "annulee")
    .reduce((somme, d) => somme + d.montant, 0);

  const responsables = useMemo(() => {
    const noms = new Set(employes.map((e) => e.nom));
    finances.toutesDepenses.forEach((d) => noms.add(d.responsable));
    return [...noms].sort((a, b) => a.localeCompare(b, "fr"));
  }, [employes, finances.toutesDepenses]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Finances"
        title="Dépenses & charges"
        description="Enregistrez vos frais et suivez automatiquement les salaires payés et les achats fournisseurs."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => exporterCsv(filtrees)}>
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" onClick={() => exporterExcel(filtrees)}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button
              onClick={() => {
                setEnEdition(null);
                setDialogOuvert(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle dépense
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-4">
        <SectionCard
          title="Historique des dépenses"
          description={`${filtrees.length} ligne(s) · ${formatFCFA(total)}`}
          className="min-w-0"
          bodyClassName="px-0 pb-0 pt-0"
        >
          <div className="flex flex-wrap gap-2 border-b border-border px-5 py-4">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher une dépense…"
                className="pl-9"
              />
            </div>
            <Select value={periode} onValueChange={setPeriode}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mois">Ce mois-ci</SelectItem>
                <SelectItem value="tout">Tout l'historique</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categorie} onValueChange={setCategorie}>
              <SelectTrigger className="w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes les catégories</SelectItem>
                {CATEGORIES_DEPENSE.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statut} onValueChange={setStatut}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                {Object.entries(STATUT_DEPENSE_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes les sources</SelectItem>
                {Object.entries(SOURCE_DEPENSE_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ExpensesTable
            depenses={filtrees}
            onEdit={(depense) => {
              setEnEdition(depense);
              setDialogOuvert(true);
            }}
          />
        </SectionCard>

        <ExpensesPie repartition={finances.repartition} />
      </div>

      <ExpenseFormDialog
        open={dialogOuvert}
        onOpenChange={setDialogOuvert}
        depense={enEdition}
        responsables={responsables}
      />
    </div>
  );
}
