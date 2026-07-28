import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page";
import { SalesTable } from "@/components/sales/sales-table";
import { Input } from "@/components/ui/input";
import { formatFCFA } from "@/lib/products/types";
import { imprimerFacture, telechargerFacture } from "@/lib/sales/print";
import { annulerVente, useSalesStore } from "@/lib/sales/store";
import { libellePaiements, totalVente } from "@/lib/sales/types";

const DESCRIPTION = "Consultez, imprimez et gérez toutes les ventes réalisées.";

export const Route = createFileRoute("/ventes/historique")({
  head: () => ({
    meta: [
      { title: "Historique des ventes — Bekaye Sora Business Manager" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Historique des ventes — Bekaye Sora Business Manager" },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: HistoriqueVentes,
});

function HistoriqueVentes() {
  const { ventes } = useSalesStore();
  const [recherche, setRecherche] = useState("");

  const resultats = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return ventes
      .filter((v) =>
        q
          ? `${v.numero} ${v.client} ${v.vendeur} ${libellePaiements(v.paiements)} ${v.lignes
              .map((l) => `${l.nom} ${l.codeBarres}`)
              .join(" ")}`
              .toLowerCase()
              .includes(q)
          : true,
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [ventes, recherche]);

  const total = resultats
    .filter((v) => v.statut !== "annulee")
    .reduce((t, v) => t + totalVente(v), 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Commerce" title="Historique des ventes" description={DESCRIPTION} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher : numéro, client, vendeur, produit…"
            className="h-10 pl-9"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {resultats.length} vente(s) · Total {formatFCFA(total)}
        </p>
      </div>

      <SalesTable
        ventes={resultats}
        onVoir={(v) => void imprimerFacture(v)}
        onImprimer={(v) =>
          void imprimerFacture(v).then((ok) => {
            if (!ok) toast.error("Autorisez les fenêtres pop-up pour imprimer la facture.");
          })
        }
        onTelecharger={(v) =>
          void telechargerFacture(v).then(() => toast.success("Facture téléchargée."))
        }
        onAnnuler={(v) => {
          annulerVente(v.id);
          toast.success(`Vente ${v.numero} annulée`, {
            description: "Le stock et la caisse ont été mis à jour automatiquement.",
          });
        }}
      />
    </div>
  );
}
