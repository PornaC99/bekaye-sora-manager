import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bot, PackagePlus, Sparkles, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page";
import { SuppliersKpiCards } from "@/components/suppliers/kpi-cards";
import { OrderFormDialog } from "@/components/suppliers/order-form-dialog";
import { ReplenishmentCards } from "@/components/suppliers/replenishment-panel";
import { Button } from "@/components/ui/button";
import { useProductsStore } from "@/lib/products/store";
import { formatFCFA } from "@/lib/products/types";
import { suggestionsApprovisionnement, type SuggestionAppro } from "@/lib/suppliers/analytics";
import { ajouterCommande, nomFournisseur, useSuppliersStore } from "@/lib/suppliers/store";
import type { LigneCommande } from "@/lib/suppliers/types";
import { cn } from "@/lib/utils";

const TITLE = "Assistant d'approvisionnement";
const DESCRIPTION =
  "Analyse des ventes sur 30, 60 et 90 jours pour recommander les quantités à commander.";

export const Route = createFileRoute("/fournisseurs/approvisionnement")({
  head: () => ({
    meta: [
      { title: `${TITLE} — Bekaye Sora Business Manager` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `${TITLE} — Bekaye Sora Business Manager` },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: AssistantPage,
});

const COUVERTURES = [30, 45, 60, 90];

function AssistantPage() {
  const { produits, ventes } = useProductsStore();
  const { fournisseurs, commandes } = useSuppliersStore();

  const [couverture, setCouverture] = useState(45);
  const [formOuvert, setFormOuvert] = useState(false);
  const [preselection, setPreselection] = useState<{
    fournisseurId?: string;
    lignes: LigneCommande[];
  } | null>(null);

  const suggestions = useMemo(
    () =>
      suggestionsApprovisionnement(produits, ventes, fournisseurs, commandes, couverture).filter(
        (s) => s.quantiteRecommandee > 0,
      ),
    [produits, ventes, fournisseurs, commandes, couverture],
  );

  const hautes = suggestions.filter((s) => s.priorite === "haute");
  const budget = suggestions.reduce((acc, s) => acc + s.montantEstime, 0);

  function commanderUne(s: SuggestionAppro) {
    setPreselection({
      fournisseurId: s.fournisseur?.id,
      lignes: [
        {
          produitId: s.produit.id,
          nom: s.produit.nom,
          quantite: s.quantiteRecommandee,
          prixAchat: s.produit.prixAchat,
          remise: 0,
        },
      ],
    });
    setFormOuvert(true);
  }

  function commanderTout() {
    if (!suggestions.length) return;
    const cible = hautes.length ? hautes : suggestions;
    const fournisseurId = cible[0]?.fournisseur?.id;
    setPreselection({
      fournisseurId,
      lignes: cible
        .filter((s) => !fournisseurId || s.fournisseur?.id === fournisseurId)
        .map((s) => ({
          produitId: s.produit.id,
          nom: s.produit.nom,
          quantite: s.quantiteRecommandee,
          prixAchat: s.produit.prixAchat,
          remise: 0,
        })),
    });
    setFormOuvert(true);
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Bonus premium"
        title={TITLE}
        description={DESCRIPTION}
        actions={
          <Button onClick={commanderTout} disabled={!suggestions.length}>
            <PackagePlus className="mr-1.5 h-4 w-4" /> Générer une commande
          </Button>
        }
      />

      <SuppliersKpiCards
        cartes={[
          { label: "Produits à réapprovisionner", value: String(suggestions.length), hint: `Couverture visée : ${couverture} jours`, icon: Sparkles, tone: "primary" },
          { label: "Priorité haute", value: String(hautes.length), hint: "Rupture imminente ou avérée", icon: TriangleAlert, tone: hautes.length ? "danger" : "success" },
          { label: "Budget estimé", value: formatFCFA(budget), hint: "Sur la base des prix d'achat actuels", icon: Bot, tone: "warning" },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
        <span className="text-sm text-muted-foreground">Couverture de stock souhaitée :</span>
        {COUVERTURES.map((j) => (
          <button
            key={j}
            type="button"
            onClick={() => setCouverture(j)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              couverture === j
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {j} jours
          </button>
        ))}
      </div>

      <ReplenishmentCards suggestions={suggestions} onCommander={commanderUne} />

      <OrderFormDialog
        open={formOuvert}
        onOpenChange={(o) => {
          setFormOuvert(o);
          if (!o) setPreselection(null);
        }}
        fournisseurs={fournisseurs}
        produits={produits}
        responsable="Bekaye Sora"
        fournisseurParDefaut={preselection?.fournisseurId}
        lignesInitiales={preselection?.lignes}
        onSubmit={(values) => {
          const creee = ajouterCommande(values);
          toast.success("Commande générée par l'assistant", {
            description: `${creee.numero} · ${nomFournisseur(creee.fournisseurId)}`,
          });
          setPreselection(null);
        }}
      />
    </div>
  );
}
