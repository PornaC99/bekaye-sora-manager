import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import {
  Boxes,
  CalendarCheck,
  CheckCircle2,
  Coins,
  FileSpreadsheet,
  Plus,
  Printer,
  QrCode,
  ScanLine,
  Search,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page";
import { AdjustStockDialog } from "@/components/inventory/adjust-dialog";
import { CountCards, CountTable } from "@/components/inventory/count-views";
import { NewInventoryDialog } from "@/components/inventory/new-inventory-dialog";
import { ResultsSummary } from "@/components/inventory/results-summary";
import { InventorySummaryCards } from "@/components/inventory/summary-cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  exporterInventaireExcel,
  exporterInventairePdf,
  imprimerInventaire,
} from "@/lib/inventory/print";
import {
  ajusterStockDepuisInventaire,
  creerInventaire,
  saisirStockPhysique,
  terminerInventaire,
  useInventairesStore,
} from "@/lib/inventory/store";
import {
  lignesEnEcart,
  lignesVerifiees,
  progression,
  statutLigne,
  valeurEcartTotal,
  valeurStockTheorique,
  type Inventaire,
} from "@/lib/inventory/types";
import { formatDateCourt, formatFCFA } from "@/lib/products/types";

const TITLE = "Inventaire";
const DESCRIPTION =
  "Vérifiez facilement si votre stock physique correspond au stock enregistré dans le système.";

export const Route = createFileRoute("/inventaire/")({
  head: () => ({
    meta: [
      { title: `${TITLE} intelligent — Bekaye Sora Business Manager` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `${TITLE} intelligent — Bekaye Sora Business Manager` },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: InventairePage,
});

function InventairePage() {
  const { inventaires } = useInventairesStore();
  const navigate = useNavigate();
  const [nouveau, setNouveau] = useState(false);
  const [ajustement, setAjustement] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<"tous" | "comptes" | "restants" | "ecarts">("tous");

  const courant: Inventaire | null =
    inventaires.find((i) => i.statut === "en_cours") ?? inventaires[0] ?? null;

  const dernier = inventaires.find((i) => i.statut !== "en_cours") ?? null;

  const lignes = useMemo(() => {
    if (!courant) return [];
    const q = recherche.trim().toLowerCase();
    return courant.lignes
      .filter((l) =>
        q ? l.nom.toLowerCase().includes(q) || l.codeBarres.includes(q) : true,
      )
      .filter((l) =>
        filtre === "comptes"
          ? l.stockPhysique !== null
          : filtre === "restants"
            ? l.stockPhysique === null
            : filtre === "ecarts"
              ? l.stockPhysique !== null && statutLigne(l) !== "conforme"
              : true,
      );
  }, [courant, recherche, filtre]);

  if (!courant) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader eyebrow="Stock" title={TITLE} description={DESCRIPTION} />
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            Aucun inventaire pour le moment. Démarrez votre premier comptage.
          </p>
          <Button className="mt-4" onClick={() => setNouveau(true)}>
            <Plus className="mr-2 h-4 w-4" /> Démarrer un nouvel inventaire
          </Button>
        </div>
        <NewInventoryDialog
          open={nouveau}
          onOpenChange={setNouveau}
          onSubmit={(values) => {
            const inv = creerInventaire(values);
            toast.success("Inventaire démarré", { description: inv.numero });
          }}
        />
      </div>
    );
  }

  const verifiees = lignesVerifiees(courant);
  const ecarts = lignesEnEcart(courant);
  const lectureSeule = courant.statut === "ajuste";

  const cartes = [
    {
      label: "Produits au total",
      value: String(courant.lignes.length),
      hint: `${progression(courant)} % comptés`,
      icon: Boxes,
    },
    {
      label: "Produits conformes",
      value: String(verifiees.length - ecarts.length),
      hint: "Stock physique = stock système",
      icon: CheckCircle2,
      tone: "success" as const,
    },
    {
      label: "Produits avec écart",
      value: String(ecarts.length),
      hint: "À vérifier avant ajustement",
      icon: TriangleAlert,
      tone: "warning" as const,
    },
    {
      label: "Valeur totale du stock",
      value: formatFCFA(valeurStockTheorique(courant)),
      hint: "Au prix d'achat",
      icon: Wallet,
    },
    {
      label: "Valeur des écarts",
      value: formatFCFA(valeurEcartTotal(courant)),
      hint: "Pertes et surplus cumulés",
      icon: Coins,
      tone: "primary" as const,
    },
    {
      label: "Dernier inventaire",
      value: dernier ? formatDateCourt(dernier.date) : "—",
      hint: dernier ? dernier.responsable : "Aucun inventaire clôturé",
      icon: CalendarCheck,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Stock"
        title={TITLE}
        description={DESCRIPTION}
        actions={
          <Button onClick={() => setNouveau(true)}>
            <Plus className="mr-2 h-4 w-4" /> Démarrer un nouvel inventaire
          </Button>
        }
      />

      <InventorySummaryCards cartes={cartes} />

      <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-display text-base font-semibold text-foreground">{courant.nom}</p>
            <p className="text-xs text-muted-foreground">
              {courant.numero} · {courant.magasin} · Responsable : {courant.responsable}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast("Scanner bientôt disponible", {
                  description:
                    "Compatible douchette code-barres, caméra du téléphone et QR Code.",
                })
              }
            >
              <ScanLine className="mr-2 h-4 w-4" /> Scanner
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast("QR Code bientôt disponible", {
                  description: "Chaque produit pourra être identifié par QR Code.",
                })
              }
            >
              <QrCode className="mr-2 h-4 w-4" /> QR Code
            </Button>
            <Button variant="outline" size="sm" onClick={() => exporterInventaireExcel(courant)}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!exporterInventairePdf(courant)) {
                  toast.error("Autorisez les fenêtres pop-up pour générer le PDF.");
                }
              }}
            >
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!imprimerInventaire(courant)) {
                  toast.error("Autorisez les fenêtres pop-up pour imprimer le rapport.");
                }
              }}
            >
              <Printer className="mr-2 h-4 w-4" /> Imprimer
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Rechercher un produit ou un code-barres…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>
          <Select value={filtre} onValueChange={(v) => setFiltre(v as typeof filtre)}>
            <SelectTrigger className="sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les produits</SelectItem>
              <SelectItem value="comptes">Déjà comptés</SelectItem>
              <SelectItem value="restants">Restant à compter</SelectItem>
              <SelectItem value="ecarts">Avec écart</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <CountTable
        lignes={lignes}
        lectureSeule={lectureSeule}
        onSaisir={(ligneId, valeur) => saisirStockPhysique(courant.id, ligneId, valeur)}
      />
      <CountCards
        lignes={lignes}
        lectureSeule={lectureSeule}
        onSaisir={(ligneId, valeur) => saisirStockPhysique(courant.id, ligneId, valeur)}
      />

      <ResultsSummary inventaire={courant} />

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            terminerInventaire(courant.id);
            toast.success("Inventaire terminé avec succès.", {
              description: `${verifiees.length} produits contrôlés · ${ecarts.length} écart(s).`,
            });
            if (ecarts.some((l) => statutLigne(l) === "important")) {
              toast.warning("Écart important détecté", {
                description: "Vérifiez les produits signalés en rouge avant d'ajuster le stock.",
              });
            }
          }}
        >
          Terminer le comptage
        </Button>
        <Button
          disabled={verifiees.length === 0 || lectureSeule}
          onClick={() => setAjustement(true)}
        >
          Ajuster le stock
        </Button>
        <Button variant="ghost" onClick={() => navigate({ to: "/inventaire/historique" })}>
          Voir l'historique
        </Button>
      </div>

      <NewInventoryDialog
        open={nouveau}
        onOpenChange={setNouveau}
        onSubmit={(values) => {
          const inv = creerInventaire(values);
          toast.success("Inventaire démarré", { description: inv.numero });
        }}
      />

      <AdjustStockDialog
        open={ajustement}
        onOpenChange={setAjustement}
        nombreEcarts={ecarts.length}
        onConfirm={() => {
          const corrections = ajusterStockDepuisInventaire(courant.id);
          setAjustement(false);
          toast.success("Stock ajusté automatiquement.", {
            description: `${corrections} produit(s) corrigé(s) dans le catalogue et l'historique des mouvements.`,
          });
        }}
      />
    </div>
  );
}
