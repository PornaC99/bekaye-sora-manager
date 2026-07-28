import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Download } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { MobileCard, MobilePage, MobileSection } from "@/components/mobile/shell";
import { MiniTrendChart } from "@/components/mobile/trend-chart";
import { serieFinanciere, type PlageFinance } from "@/lib/finance/analytics";
import { useFinances } from "@/lib/finance/use-finance";
import { formatFCFA } from "@/lib/products/types";
import { totalVente } from "@/lib/sales/types";
import { imprimerRapportDirecteur, ligne } from "@/lib/mobile/print";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mobile/rapports")({
  head: () => ({
    meta: [
      { title: "Rapports de direction — Bekaye Sora Mobile" },
      {
        name: "description",
        content: "Rapports journalier, hebdomadaire, mensuel et annuel exportables en PDF.",
      },
      { property: "og:title", content: "Rapports de direction — Bekaye Sora Mobile" },
      {
        property: "og:description",
        content: "Générez et partagez vos rapports d'activité depuis votre téléphone.",
      },
    ],
  }),
  component: RapportsMobile,
});

const PERIODES = [
  { value: "jour", label: "Journalier", plage: "jour" as PlageFinance, jours: 1 },
  { value: "semaine", label: "Hebdomadaire", plage: "7j" as PlageFinance, jours: 7 },
  { value: "mois", label: "Mensuel", plage: "30j" as PlageFinance, jours: 30 },
  { value: "annee", label: "Annuel", plage: "12m" as PlageFinance, jours: 365 },
] as const;

function RapportsMobile() {
  const finances = useFinances();
  const [periode, setPeriode] = useState<(typeof PERIODES)[number]>(PERIODES[0]);

  const debut = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - (periode.jours - 1));
    d.setHours(0, 0, 0, 0);
    return d;
  }, [periode]);

  const resume = useMemo(() => {
    const ventes = finances.ventes.filter(
      (v) => v.statut !== "annulee" && new Date(v.date) >= debut,
    );
    const depenses = finances.toutesDepenses.filter(
      (d) => d.statut !== "annulee" && new Date(d.date) >= debut,
    );
    const ca = ventes.reduce((t, v) => t + totalVente(v), 0);
    const cout = ventes.reduce(
      (t, v) =>
        t +
        v.lignes.reduce((s, l) => {
          const produit = finances.produits.find((p) => p.id === l.produitId);
          return s + (produit?.prixAchat ?? 0) * l.quantite;
        }, 0),
      0,
    );
    const totalDepenses = depenses.reduce((t, d) => t + d.montant, 0);
    return {
      nombreVentes: ventes.length,
      ca,
      cout,
      depenses: totalDepenses,
      benefice:
        ca -
        cout -
        depenses.filter((d) => d.source !== "achats").reduce((t, d) => t + d.montant, 0),
      panierMoyen: ventes.length ? ca / ventes.length : 0,
    };
  }, [finances, debut]);

  const serie = useMemo(
    () =>
      serieFinanciere({
        ventes: finances.ventes,
        produits: finances.produits,
        depenses: finances.toutesDepenses,
        plage: periode.plage,
      }),
    [finances, periode],
  );

  const exporter = () => {
    imprimerRapportDirecteur({
      titre: `Rapport ${periode.label.toLowerCase()}`,
      periode: `Du ${new Intl.DateTimeFormat("fr-FR").format(debut)} au ${new Intl.DateTimeFormat("fr-FR").format(new Date())}`,
      lignes: [
        { label: "Nombre de ventes", valeur: String(resume.nombreVentes) },
        ligne("Chiffre d'affaires", resume.ca),
        ligne("Coût des marchandises", resume.cout),
        ligne("Dépenses", resume.depenses),
        ligne("Bénéfice net", resume.benefice),
        ligne("Panier moyen", resume.panierMoyen),
      ],
      details: [
        {
          titre: "Trésorerie & stock",
          lignes: [
            ligne("Argent en caisse", finances.kpis.montantCaisse),
            ligne("Valeur du stock", finances.kpis.valeurStock),
            ligne("Créances clients", finances.kpis.creances),
            ligne("Dettes fournisseurs", finances.kpis.dettes),
          ],
        },
        {
          titre: "Produits les plus rentables",
          lignes: finances.rentabilites.slice(0, 5).map((p) => ligne(p.nom, p.benefice)),
        },
      ],
    });
    toast.success("Rapport prêt", { description: "Choisissez « Enregistrer au format PDF »." });
  };

  return (
    <MobilePage titre="Rapports" sousTitre="Journalier · Hebdo · Mensuel · Annuel">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {PERIODES.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriode(p)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              periode.value === p.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <MobileCard>
        <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          Période analysée
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">
          Du {new Intl.DateTimeFormat("fr-FR").format(debut)} à aujourd'hui
        </p>
      </MobileCard>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Chiffre d'affaires", valeur: formatFCFA(resume.ca) },
          { label: "Bénéfice net", valeur: formatFCFA(resume.benefice) },
          { label: "Dépenses", valeur: formatFCFA(resume.depenses) },
          { label: "Ventes", valeur: String(resume.nombreVentes) },
          { label: "Panier moyen", valeur: formatFCFA(resume.panierMoyen) },
          { label: "Coût marchandises", valeur: formatFCFA(resume.cout) },
        ].map((item) => (
          <MobileCard key={item.label} className="p-3">
            <p className="text-[11px] text-muted-foreground">{item.label}</p>
            <p className="mt-1 truncate font-display text-base font-semibold text-foreground">
              {item.valeur}
            </p>
          </MobileCard>
        ))}
      </div>

      <MobileSection titre="Courbe de la période">
        <MobileCard className="px-1 py-2">
          <MiniTrendChart data={serie} cle="ca" />
        </MobileCard>
      </MobileSection>

      <button
        type="button"
        onClick={exporter}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
      >
        <Download className="h-4 w-4" />
        Exporter en PDF
      </button>
    </MobilePage>
  );
}
