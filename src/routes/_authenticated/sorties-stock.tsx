import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, Download, Layers, Plus, TrendingDown } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page";
import { ExitFormDialog } from "@/components/stock-exits/exit-form-dialog";
import { ExitsTable } from "@/components/stock-exits/exits-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermissions } from "@/hooks/use-permissions";
import { LABEL_MOTIF, listerMagasins, listerSorties, MOTIFS_SORTIE } from "@/lib/db/sorties";
import { formatFCFA } from "@/lib/products/types";

const TITLE = "Sorties de stock";
const DESCRIPTION = "Suivez les sorties, pertes, transferts et retours de produits en temps réel.";

export const Route = createFileRoute("/_authenticated/sorties-stock")({
  head: () => ({
    meta: [
      { title: `${TITLE} — Bekaye Sora Business Manager` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `${TITLE} — Bekaye Sora Business Manager` },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Page,
});

function Page() {
  const { peut } = usePermissions();
  const [recherche, setRecherche] = useState("");
  const [motif, setMotif] = useState("tous");
  const [magasinId, setMagasinId] = useState("tous");
  const [du, setDu] = useState("");
  const [au, setAu] = useState("");
  const [dialogOuvert, setDialogOuvert] = useState(false);

  const { data: magasins = [] } = useQuery({ queryKey: ["magasins"], queryFn: listerMagasins });
  const { data: sorties = [], isLoading } = useQuery({
    queryKey: ["sorties", { recherche, motif, magasinId, du, au }],
    queryFn: () => listerSorties({ recherche, motif, magasinId, du, au }),
  });

  const kpis = useMemo(() => {
    const total = sorties.reduce((acc, s) => acc + s.quantite, 0);
    const valeur = sorties.reduce((acc, s) => acc + s.valeurTotale, 0);
    const pertes = sorties
      .filter((s) => ["perte", "casse", "peremption"].includes(s.motif))
      .reduce((acc, s) => acc + s.valeurTotale, 0);
    return { operations: sorties.length, total, valeur, pertes };
  }, [sorties]);

  const exporter = () => {
    const lignes = [
      ["Numéro", "Date", "Produit", "Quantité", "Motif", "Lot", "Référence", "Valeur"],
      ...sorties.map((s) => [
        s.numero,
        new Date(s.date).toLocaleString("fr-FR"),
        s.produit,
        s.quantite,
        LABEL_MOTIF[s.motif] ?? s.motif,
        s.lot,
        s.reference,
        s.valeurTotale,
      ]),
    ];
    const csv = lignes.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "sorties-stock.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Sorties exportées.");
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Stock"
        title={TITLE}
        description={DESCRIPTION}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exporter} disabled={sorties.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Exporter
            </Button>
            {peut("stock.exit") && (
              <Button onClick={() => setDialogOuvert(true)}>
                <Plus className="mr-2 h-4 w-4" /> Nouvelle sortie
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Opérations" value={String(kpis.operations)} icon={Layers} />
        <Kpi label="Unités sorties" value={String(kpis.total)} icon={ArrowDownRight} />
        <Kpi label="Valeur des sorties" value={formatFCFA(kpis.valeur)} icon={TrendingDown} />
        <Kpi label="Pertes & casses" value={formatFCFA(kpis.pertes)} icon={TrendingDown} accent />
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Rechercher un numéro, un produit…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="w-full sm:max-w-xs"
        />
        <Select value={motif} onValueChange={setMotif}>
          <SelectTrigger className="w-[190px]">
            <SelectValue placeholder="Motif" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les motifs</SelectItem>
            {MOTIFS_SORTIE.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={magasinId} onValueChange={setMagasinId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Magasin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les magasins</SelectItem>
            {magasins.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={du}
          onChange={(e) => setDu(e.target.value)}
          className="w-[160px]"
          aria-label="Date de début"
        />
        <Input
          type="date"
          value={au}
          onChange={(e) => setAu(e.target.value)}
          className="w-[160px]"
          aria-label="Date de fin"
        />
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Chargement des sorties…
        </div>
      ) : (
        <ExitsTable sorties={sorties} />
      )}

      <ExitFormDialog open={dialogOuvert} onOpenChange={setDialogOuvert} />
    </div>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof Layers;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <span
        className={`grid h-10 w-10 place-items-center rounded-xl ${
          accent ? "bg-destructive/10 text-destructive" : "bg-primary-soft text-primary"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-lg font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
