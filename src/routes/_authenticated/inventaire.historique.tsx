import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";

import { PageHeader } from "@/components/layout/page";
import { InventoryHistoryTable } from "@/components/inventory/history-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInventairesStore } from "@/lib/inventory/store";
import { MAGASINS, RESPONSABLES } from "@/lib/inventory/types";

const TITLE = "Historique des inventaires";
const DESCRIPTION = "Retrouvez tous les comptages réalisés et consultez leurs résultats.";

export const Route = createFileRoute("/_authenticated/inventaire/historique")({
  head: () => ({
    meta: [
      { title: `${TITLE} — Bekaye Sora Business Manager` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `${TITLE} — Bekaye Sora Business Manager` },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: HistoriqueInventairesPage,
});

function HistoriqueInventairesPage() {
  const { inventaires } = useInventairesStore();
  const [recherche, setRecherche] = useState("");
  const [responsable, setResponsable] = useState("tous");
  const [magasin, setMagasin] = useState("tous");

  const resultats = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return inventaires
      .filter((i) => (responsable === "tous" ? true : i.responsable === responsable))
      .filter((i) => (magasin === "tous" ? true : i.magasin === magasin))
      .filter((i) =>
        q ? i.nom.toLowerCase().includes(q) || i.numero.toLowerCase().includes(q) : true,
      );
  }, [inventaires, recherche, responsable, magasin]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Inventaire" title={TITLE} description={DESCRIPTION} />

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Rechercher un inventaire…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
        <Select value={responsable} onValueChange={setResponsable}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="Responsable" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les responsables</SelectItem>
            {RESPONSABLES.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={magasin} onValueChange={setMagasin}>
          <SelectTrigger className="sm:w-60">
            <SelectValue placeholder="Magasin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les magasins</SelectItem>
            {MAGASINS.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <InventoryHistoryTable inventaires={resultats} />
    </div>
  );
}
