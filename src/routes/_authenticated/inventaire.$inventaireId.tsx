import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileSpreadsheet, Printer } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page";
import { SectionCard } from "@/components/dashboard/section-card";
import { AdjustStockDialog } from "@/components/inventory/adjust-dialog";
import { CountCards, CountTable } from "@/components/inventory/count-views";
import { InventoryStatusBadge } from "@/components/inventory/history-table";
import { ResultsSummary } from "@/components/inventory/results-summary";
import { Button } from "@/components/ui/button";
import {
  exporterInventaireExcel,
  exporterInventairePdf,
  imprimerInventaire,
} from "@/lib/inventory/print";
import {
  ajusterStockDepuisInventaire,
  useInventaire,
  saisirStockPhysique,
} from "@/lib/inventory/store";
import { lignesEnEcart, lignesVerifiees } from "@/lib/inventory/types";
import { formatDate, formatHeure } from "@/lib/products/types";

export const Route = createFileRoute("/_authenticated/inventaire/$inventaireId")({
  head: () => ({
    meta: [
      { title: "Détail de l'inventaire — Bekaye Sora Business Manager" },
      {
        name: "description",
        content:
          "Consultez les produits contrôlés, les écarts et les commentaires d'un inventaire.",
      },
      { property: "og:title", content: "Détail de l'inventaire — Bekaye Sora Business Manager" },
      {
        property: "og:description",
        content:
          "Consultez les produits contrôlés, les écarts et les commentaires d'un inventaire.",
      },
    ],
  }),
  component: DetailInventairePage,
});

function DetailInventairePage() {
  const { inventaireId } = Route.useParams();
  const inventaire = useInventaire(inventaireId);
  const [ajustement, setAjustement] = useState(false);

  if (!inventaire) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          eyebrow="Inventaire"
          title="Inventaire introuvable"
          description="Cet inventaire n'existe plus ou a été supprimé."
        />
        <Button asChild variant="outline" className="w-fit">
          <Link to="/inventaire/historique">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour à l'historique
          </Link>
        </Button>
      </div>
    );
  }

  const ecarts = lignesEnEcart(inventaire);
  const lectureSeule = inventaire.statut === "ajuste";

  return (
    <div className="flex flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to="/inventaire/historique">
          <ArrowLeft className="mr-2 h-4 w-4" /> Historique des inventaires
        </Link>
      </Button>

      <PageHeader
        eyebrow={inventaire.numero}
        title={inventaire.nom}
        description={`${inventaire.magasin} · ${formatDate(inventaire.date)} à ${formatHeure(inventaire.date)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => exporterInventaireExcel(inventaire)}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!exporterInventairePdf(inventaire)) {
                  toast.error("Autorisez les fenêtres pop-up pour générer le PDF.");
                }
              }}
            >
              PDF
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!imprimerInventaire(inventaire)) {
                  toast.error("Autorisez les fenêtres pop-up pour imprimer le rapport.");
                }
              }}
            >
              <Printer className="mr-2 h-4 w-4" /> Imprimer
            </Button>
          </div>
        }
      />

      <SectionCard
        title="Informations générales"
        description="Contexte du comptage"
        action={<InventoryStatusBadge statut={inventaire.statut} />}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Responsable", value: inventaire.responsable },
            { label: "Magasin", value: inventaire.magasin },
            {
              label: "Produits contrôlés",
              value: `${lignesVerifiees(inventaire).length} / ${inventaire.lignes.length}`,
            },
            { label: "Produits en écart", value: String(ecarts.length) },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
        {inventaire.observation && (
          <p className="mt-4 rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Commentaires : </span>
            {inventaire.observation}
          </p>
        )}
      </SectionCard>

      <ResultsSummary inventaire={inventaire} />

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-base font-semibold text-foreground">Produits contrôlés</h2>
        <CountTable
          lignes={inventaire.lignes}
          lectureSeule={lectureSeule}
          onSaisir={(ligneId, valeur) => saisirStockPhysique(inventaire.id, ligneId, valeur)}
        />
        <CountCards
          lignes={inventaire.lignes}
          lectureSeule={lectureSeule}
          onSaisir={(ligneId, valeur) => saisirStockPhysique(inventaire.id, ligneId, valeur)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Historique des modifications" description="Traçabilité complète">
          <ol className="flex flex-col gap-3">
            {inventaire.historique.map((event) => (
              <li key={event.id} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div>
                  <p className="text-sm text-foreground">{event.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(event.date)} à {formatHeure(event.date)} · {event.utilisateur}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </SectionCard>

        <SectionCard title="Signature du responsable" description="Validation du comptage">
          <div className="flex h-full flex-col justify-between gap-6">
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
              <p className="font-display text-lg font-semibold text-foreground">
                {inventaire.signature || inventaire.responsable}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Signé le {formatDate(inventaire.date)}
              </p>
            </div>
            <Button
              className="w-full"
              disabled={lectureSeule || lignesVerifiees(inventaire).length === 0}
              onClick={() => setAjustement(true)}
            >
              Ajuster le stock
            </Button>
          </div>
        </SectionCard>
      </div>

      <AdjustStockDialog
        open={ajustement}
        onOpenChange={setAjustement}
        nombreEcarts={ecarts.length}
        onConfirm={() => {
          const corrections = ajusterStockDepuisInventaire(inventaire.id);
          setAjustement(false);
          toast.success("Stock ajusté automatiquement.", {
            description: `${corrections} produit(s) corrigé(s) dans le catalogue et l'historique des mouvements.`,
          });
        }}
      />
    </div>
  );
}
