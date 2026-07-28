import { useMemo, useState } from "react";
import { Banknote, Receipt, ShoppingCart, Wallet } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page";
import { SectionCard } from "@/components/dashboard/section-card";
import { CartPanel, type PanierEtat } from "@/components/sales/cart-panel";
import { NotificationsFeed } from "@/components/sales/notifications-feed";
import { PaymentDialog } from "@/components/sales/payment-dialog";
import { SummaryCards } from "@/components/stock-entries/summary-cards";
import { PosCatalog } from "@/components/sales/pos-catalog";
import { useProductsStore } from "@/lib/products/store";
import { formatFCFA, formatHeure } from "@/lib/products/types";
import type { Produit } from "@/lib/products/types";
import { VENDEURS } from "@/lib/sales/demo-data";
import { imprimerFacture } from "@/lib/sales/print";
import { enregistrerVente, useSalesStore } from "@/lib/sales/store";
import { memeJourVente, montantEspeces, totalVente, type Paiement } from "@/lib/sales/types";

const TITLE = "Ventes";
const DESCRIPTION = "Enregistrez rapidement toutes les ventes.";

export const Route = createFileRoute("/_authenticated/ventes/")({
  head: () => ({
    meta: [
      { title: "Ventes & Caisse — Bekaye Sora Business Manager" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Ventes & Caisse — Bekaye Sora Business Manager" },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: PointDeVente,
});

const PANIER_VIDE: PanierEtat = {
  lignes: [],
  remise: 0,
  tvaActive: false,
  client: "",
  telephoneClient: "",
  vendeur: VENDEURS[0],
};

function PointDeVente() {
  const { produits } = useProductsStore();
  const { ventes, notifications } = useSalesStore();
  const [panier, setPanier] = useState<PanierEtat>(PANIER_VIDE);
  const [paiementOuvert, setPaiementOuvert] = useState(false);

  const totaux = useMemo(() => {
    const sousTotal = panier.lignes.reduce((t, l) => t + l.prixUnitaire * l.quantite, 0);
    const base = Math.max(0, sousTotal - panier.remise);
    const tva = panier.tvaActive ? Math.round(base * 0.18) : 0;
    return { sousTotal, tva, total: base + tva };
  }, [panier]);

  const ajouter = (produit: Produit) => {
    setPanier((etat) => {
      const existante = etat.lignes.find((l) => l.produitId === produit.id);
      if (existante) {
        if (existante.quantite >= produit.stock) {
          toast.warning("Stock insuffisant", {
            description: `${produit.nom} : ${produit.stock} unité(s) disponible(s).`,
          });
          return etat;
        }
        return {
          ...etat,
          lignes: etat.lignes.map((l) =>
            l.id === existante.id ? { ...l, quantite: l.quantite + 1 } : l,
          ),
        };
      }
      return {
        ...etat,
        lignes: [
          ...etat.lignes,
          {
            id: `L-${produit.id}`,
            produitId: produit.id,
            nom: produit.nom,
            codeBarres: produit.codeBarres,
            prixUnitaire: produit.prixVente,
            quantite: 1,
          },
        ],
      };
    });
  };

  const changerQuantite = (ligneId: string, quantite: number) => {
    setPanier((etat) => ({
      ...etat,
      lignes: etat.lignes
        .map((l) => (l.id === ligneId ? { ...l, quantite: Math.max(0, quantite) } : l))
        .filter((l) => l.quantite > 0),
    }));
  };

  const valider = (paiements: Paiement[], montantRecu: number) => {
    const vente = enregistrerVente({
      date: new Date().toISOString(),
      client: panier.client || "Client comptoir",
      telephoneClient: panier.telephoneClient,
      vendeur: panier.vendeur,
      lignes: panier.lignes,
      remise: panier.remise,
      tauxTva: panier.tvaActive ? 18 : 0,
      paiements,
      montantRecu,
      observation: "",
    });

    setPaiementOuvert(false);
    setPanier({ ...PANIER_VIDE, vendeur: panier.vendeur });

    toast.success(`Vente ${vente.numero} enregistrée`, {
      description: `${formatFCFA(totalVente(vente))} · Monnaie à rendre : ${formatFCFA(
        Math.max(0, montantRecu - totalVente(vente)),
      )}`,
      action: { label: "Imprimer", onClick: () => void imprimerFacture(vente) },
    });

    // Notification temps réel du directeur (fonctionnalité Premium).
    const resume = vente.lignes
      .map((l) => `${l.nom} × ${l.quantite}`)
      .slice(0, 2)
      .join(", ");
    setTimeout(() => {
      toast("📲 Alerte directeur — Nouvelle vente", {
        description: `${resume} · ${formatFCFA(totalVente(vente))} · Vendeur : ${vente.vendeur} · ${formatHeure(vente.date)}`,
      });
    }, 900);
  };

  const ventesDuJour = ventes.filter((v) => v.statut !== "annulee" && memeJourVente(v.date));
  const caJour = ventesDuJour.reduce((t, v) => t + totalVente(v), 0);
  const especesJour = ventesDuJour.reduce((t, v) => t + montantEspeces(v.paiements), 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Commerce" title={TITLE} description={DESCRIPTION} />

      <SummaryCards
        cartes={[
          {
            label: "Ventes du jour",
            value: String(ventesDuJour.length),
            icon: ShoppingCart,
            tone: "primary",
          },
          { label: "Chiffre d'affaires", value: formatFCFA(caJour), icon: Receipt },
          { label: "Encaissé en espèces", value: formatFCFA(especesJour), icon: Banknote },
          {
            label: "Panier moyen",
            value: formatFCFA(ventesDuJour.length ? caJour / ventesDuJour.length : 0),
            icon: Wallet,
          },
          {
            label: "Articles vendus",
            value: String(
              ventesDuJour.reduce((t, v) => t + v.lignes.reduce((s, l) => s + l.quantite, 0), 0),
            ),
            icon: ShoppingCart,
          },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <PosCatalog produits={produits} onAdd={ajouter} />
        <CartPanel
          etat={panier}
          totaux={totaux}
          vendeurs={VENDEURS}
          onQuantite={changerQuantite}
          onRetirer={(id) =>
            setPanier((etat) => ({ ...etat, lignes: etat.lignes.filter((l) => l.id !== id) }))
          }
          onVider={() => setPanier({ ...PANIER_VIDE, vendeur: panier.vendeur })}
          onChange={(patch) => setPanier((etat) => ({ ...etat, ...patch }))}
          onValider={() => setPaiementOuvert(true)}
        />
      </div>

      <SectionCard title="Notifications" description="Dernières opérations du point de vente">
        <NotificationsFeed notifications={notifications} />
      </SectionCard>

      <PaymentDialog
        open={paiementOuvert}
        onOpenChange={setPaiementOuvert}
        total={totaux.total}
        onConfirm={valider}
      />
    </div>
  );
}
