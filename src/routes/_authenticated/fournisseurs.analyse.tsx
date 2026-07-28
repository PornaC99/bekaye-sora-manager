import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Timer, TrendingUp, Truck } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page";
import { SuppliersKpiCards } from "@/components/suppliers/kpi-cards";
import { SupplierLogo } from "@/components/suppliers/suppliers-table";
import { Button } from "@/components/ui/button";
import { formatFCFA } from "@/lib/products/types";
import {
  analyseFournisseurs,
  kpisFournisseurs,
  produitsLesPlusAchetes,
} from "@/lib/suppliers/analytics";
import { exporterFournisseursCSV } from "@/lib/suppliers/print";
import { useSuppliersStore } from "@/lib/suppliers/store";

const TITLE = "Analyse fournisseurs";
const DESCRIPTION =
  "Classement des partenaires par montant d'achat, délai moyen et fiabilité de livraison.";

export const Route = createFileRoute("/_authenticated/fournisseurs/analyse")({
  head: () => ({
    meta: [
      { title: `${TITLE} — Bekaye Sora Business Manager` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `${TITLE} — Bekaye Sora Business Manager` },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: AnalysePage,
});

function AnalysePage() {
  const { fournisseurs, commandes } = useSuppliersStore();

  const analyses = useMemo(
    () => analyseFournisseurs(fournisseurs, commandes).filter((a) => a.nombreCommandes > 0),
    [fournisseurs, commandes],
  );
  const kpis = useMemo(() => kpisFournisseurs(fournisseurs, commandes), [fournisseurs, commandes]);
  const topProduits = useMemo(() => produitsLesPlusAchetes(commandes), [commandes]);

  const montantMax = Math.max(1, ...analyses.map((a) => a.montant));
  const delais = analyses.map((a) => a.delaiMoyen).filter((d): d is number => d !== null);
  const delaiGlobal = delais.length ? delais.reduce((a, b) => a + b, 0) / delais.length : null;
  const totalAchats = analyses.reduce((acc, a) => acc + a.montant, 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Approvisionnement"
        title={TITLE}
        description={DESCRIPTION}
        actions={
          <Button
            variant="outline"
            onClick={() => {
              exporterFournisseursCSV(
                analyses.map((a) => a.fournisseur),
                (id) => analyses.find((a) => a.fournisseur.id === id)?.montant ?? 0,
              );
              toast.success("Analyse exportée");
            }}
          >
            <Download className="mr-1.5 h-4 w-4" /> Exporter
          </Button>
        }
      />

      <SuppliersKpiCards
        cartes={[
          { label: "Achats cumulés", value: formatFCFA(totalAchats), hint: `${commandes.length} commande(s)`, icon: TrendingUp, tone: "primary" },
          { label: "Délai moyen global", value: delaiGlobal !== null ? `${delaiGlobal.toFixed(1)} j` : "—", hint: "Entre commande et réception", icon: Timer, tone: "warning" },
          { label: "Fournisseur principal", value: kpis.principal?.nom ?? "—", hint: formatFCFA(kpis.montantPrincipal), icon: Truck, tone: "success" },
        ]}
      />

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-base font-semibold text-foreground">
            Top fournisseurs
          </h2>
          <p className="text-xs text-muted-foreground">
            Montant total, nombre de commandes, délai moyen et respect des délais.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                <th className="px-5 py-3 text-left font-medium">Fournisseur</th>
                <th className="px-5 py-3 text-right font-medium">Commandes</th>
                <th className="px-5 py-3 text-right font-medium">Quantités</th>
                <th className="px-5 py-3 text-right font-medium">Montant total</th>
                <th className="px-5 py-3 text-right font-medium">Délai moyen</th>
                <th className="px-5 py-3 text-right font-medium">Respect des délais</th>
                <th className="px-5 py-3 text-left font-medium">Part des achats</th>
              </tr>
            </thead>
            <tbody>
              {analyses.map((a) => (
                <tr key={a.fournisseur.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3">
                    <Link
                      to="/fournisseurs/$fournisseurId"
                      params={{ fournisseurId: a.fournisseur.id }}
                      className="flex items-center gap-3"
                    >
                      <SupplierLogo fournisseur={a.fournisseur} taille={32} />
                      <span>
                        <span className="block font-medium text-foreground">
                          {a.fournisseur.nom}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {a.fournisseur.ville}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{a.nombreCommandes}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{a.quantite}</td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums">
                    {formatFCFA(a.montant)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {a.delaiMoyen !== null ? `${a.delaiMoyen.toFixed(1)} j` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {a.tauxRespect !== null ? `${Math.round(a.tauxRespect)} %` : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="h-2 w-full min-w-[80px] overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(a.montant / montantMax) * 100}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {!analyses.length && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                    Aucune commande enregistrée pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-base font-semibold text-foreground">
          Produits les plus achetés
        </h2>
        <p className="text-xs text-muted-foreground">
          Volumes commandés auprès de l'ensemble de vos fournisseurs.
        </p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {topProduits.map((p, index) => (
            <div
              key={p.produitId}
              className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-xs font-semibold text-primary">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{p.nom}</p>
                <p className="text-xs text-muted-foreground">{p.quantite} unité(s) commandées</p>
              </div>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {formatFCFA(p.montant)}
              </span>
            </div>
          ))}
          {!topProduits.length && (
            <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground md:col-span-2">
              Aucun produit commandé pour le moment.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
