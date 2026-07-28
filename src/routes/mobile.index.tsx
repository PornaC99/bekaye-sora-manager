import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Boxes,
  ChevronRight,
  FileText,
  PackageX,
  PackageSearch,
  Plus,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";

import { MobileCard, MobileEmpty, MobilePage, MobileSection } from "@/components/mobile/shell";
import { ICONES_NOTIF, KpiTile } from "@/components/mobile/pieces";
import { MiniTrendChart } from "@/components/mobile/trend-chart";
import { PLAGES_FINANCE, serieFinanciere, type PlageFinance } from "@/lib/finance/analytics";
import { useFinances } from "@/lib/finance/use-finance";
import { formatFCFA, statutProduit } from "@/lib/products/types";
import { useProductsStore } from "@/lib/products/store";
import { totalVente } from "@/lib/sales/types";
import {
  depuis,
  useAlertesCritiques,
  useHorloge,
  useNotificationsMobile,
} from "@/lib/mobile/feed";
import { useMobileSession } from "@/lib/mobile/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mobile/")({
  head: () => ({
    meta: [
      { title: "Accueil Directeur — Bekaye Sora Mobile" },
      {
        name: "description",
        content:
          "Chiffre d'affaires, bénéfices, caisse, stock et dernières ventes en un coup d'œil.",
      },
      { property: "og:title", content: "Accueil Directeur — Bekaye Sora Mobile" },
      {
        property: "og:description",
        content: "Le pouls de Bekaye Sora en temps réel sur votre téléphone.",
      },
    ],
  }),
  component: AccueilMobile,
});

const RACCOURCIS = [
  { to: "/ventes", label: "Nouvelle vente", icon: Plus },
  { to: "/mobile/rapports", label: "Rapports", icon: FileText },
  { to: "/mobile/produits", label: "Stock", icon: Boxes },
  { to: "/mobile/employes", label: "Équipe", icon: Users },
  { to: "/mobile/finances", label: "Finances", icon: Receipt },
];

function AccueilMobile() {
  const { session } = useMobileSession();
  const maintenant = useHorloge(1000);
  const finances = useFinances();
  const { produits } = useProductsStore();
  const notifications = useNotificationsMobile();
  const alertes = useAlertesCritiques();
  const [plage, setPlage] = useState<PlageFinance>("7j");

  const serie = useMemo(
    () =>
      serieFinanciere({
        ventes: finances.ventes,
        produits: finances.produits,
        depenses: finances.toutesDepenses,
        plage,
      }),
    [finances.ventes, finances.produits, finances.toutesDepenses, plage],
  );

  const ventesJour = finances.ventes.filter(
    (v) =>
      v.statut !== "annulee" &&
      new Date(v.date).toDateString() === new Date().toDateString(),
  );
  const dernieres = [...finances.ventes]
    .filter((v) => v.statut !== "annulee")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const ruptures = produits.filter((p) => statutProduit(p) === "rupture").length;
  const faibles = produits.filter((p) => statutProduit(p) === "faible").length;

  const entete = (
    <header className="rounded-b-3xl bg-primary px-5 pb-6 pt-6 text-primary-foreground">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <p className="text-xs text-primary-foreground/80">
            {maintenant
              ? new Intl.DateTimeFormat("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                }).format(maintenant)
              : "—"}
          </p>
          <h1 className="truncate font-display text-xl font-semibold">
            Bonjour {session?.nom ?? "Directeur"}
          </h1>
          <p className="mt-0.5 text-xs text-primary-foreground/80">
            {maintenant
              ? new Intl.DateTimeFormat("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }).format(maintenant)
              : "—"}{" "}
            · Synchronisé en direct
          </p>
        </div>
        <Link
          to="/mobile/parametres"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-foreground/15 font-display text-base font-semibold"
          aria-label="Profil du directeur"
        >
          {(session?.nom ?? "BS")
            .split(" ")
            .map((m) => m[0])
            .join("")
            .slice(0, 2)}
        </Link>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-primary-foreground/12 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.12em] text-primary-foreground/75">
            CA du jour
          </p>
          <p className="truncate font-display text-lg font-semibold">
            {formatFCFA(finances.kpis.caJour)}
          </p>
        </div>
        <div className="rounded-2xl bg-primary-foreground/12 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.12em] text-primary-foreground/75">
            Bénéfice du jour
          </p>
          <p className="truncate font-display text-lg font-semibold">
            {formatFCFA(finances.kpis.beneficeJour)}
          </p>
        </div>
      </div>
    </header>
  );

  return (
    <MobilePage entete={entete}>
      {alertes.length > 0 && (
        <Link
          to="/mobile/alertes"
          className="flex items-center gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 transition-transform active:scale-[0.98]"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-foreground">
              {alertes.length} alerte(s) critique(s)
            </span>
            <span className="block truncate text-xs text-muted-foreground">{alertes[0].titre}</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      )}

      <MobileSection titre="Indicateurs clés">
        <div className="grid grid-cols-2 gap-3">
          <KpiTile
            label="CA du mois"
            valeur={formatFCFA(finances.kpis.caMois)}
            icon={TrendingUp}
            ton="primary"
          />
          <KpiTile
            label="Bénéfice du mois"
            valeur={formatFCFA(finances.kpis.beneficeMois)}
            hint={`Marge ${finances.kpis.margeNette} %`}
            icon={Banknote}
            ton="success"
          />
          <KpiTile
            label="Argent en caisse"
            valeur={formatFCFA(finances.kpis.montantCaisse)}
            icon={Wallet}
            ton="primary"
          />
          <KpiTile
            label="Valeur du stock"
            valeur={formatFCFA(finances.kpis.valeurStock)}
            icon={Boxes}
            ton="muted"
          />
          <KpiTile
            label="Ventes aujourd'hui"
            valeur={String(ventesJour.length)}
            hint={formatFCFA(ventesJour.reduce((t, v) => t + totalVente(v), 0))}
            icon={ShoppingBag}
            ton="primary"
          />
          <KpiTile
            label="Produits en rupture"
            valeur={String(ruptures)}
            icon={PackageX}
            ton={ruptures ? "danger" : "success"}
          />
          <KpiTile
            label="Stock faible"
            valeur={String(faibles)}
            icon={PackageSearch}
            ton={faibles ? "warning" : "success"}
          />
          <KpiTile
            label="Dépenses du mois"
            valeur={formatFCFA(finances.kpis.depensesMois)}
            icon={Receipt}
            ton="warning"
          />
        </div>
      </MobileSection>

      <MobileSection titre="Évolution des ventes">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {PLAGES_FINANCE.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPlage(p.value)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                plage === p.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <MobileCard className="px-1 py-2">
          <MiniTrendChart data={serie} cle="ca" />
        </MobileCard>
      </MobileSection>

      <MobileSection titre="Évolution des bénéfices">
        <MobileCard className="px-1 py-2">
          <MiniTrendChart data={serie} cle="benefice" couleur="var(--success)" />
        </MobileCard>
      </MobileSection>

      <MobileSection
        titre="Dernières ventes"
        action={
          <Link
            to="/mobile/direct"
            className="flex items-center gap-1 text-xs font-medium text-primary"
          >
            Tout voir <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      >
        {dernieres.length === 0 ? (
          <MobileEmpty message="Aucune vente enregistrée." />
        ) : (
          <div className="space-y-2">
            {dernieres.map((vente) => (
              <MobileCard key={vente.id} className="p-3">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {vente.lignes[0]?.nom ?? vente.numero}
                      {vente.lignes.length > 1 && ` +${vente.lignes.length - 1}`}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(vente.date))}{" "}
                      · {vente.vendeur}
                    </p>
                  </div>
                  <p className="shrink-0 font-display text-sm font-semibold text-foreground">
                    {formatFCFA(totalVente(vente))}
                  </p>
                </div>
              </MobileCard>
            ))}
          </div>
        )}
      </MobileSection>

      <MobileSection titre="Accès rapide">
        <div className="grid grid-cols-3 gap-3">
          {RACCOURCIS.map((r) => (
            <Link
              key={r.label}
              to={r.to}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border/70 bg-card px-2 py-3 text-center text-[11px] font-medium text-foreground transition-transform active:scale-95"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-primary">
                <r.icon className="h-4 w-4" />
              </span>
              {r.label}
            </Link>
          ))}
        </div>
      </MobileSection>

      <MobileSection
        titre="Notifications en temps réel"
        action={
          <Link
            to="/mobile/notifications"
            className="flex items-center gap-1 text-xs font-medium text-primary"
          >
            Centre <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      >
        {notifications.length === 0 ? (
          <MobileEmpty message="Aucune notification." />
        ) : (
          <div className="space-y-2">
            {notifications.slice(0, 5).map((n) => {
              const Icone = ICONES_NOTIF[n.icone];
              return (
                <MobileCard key={n.id} className="p-3">
                  <div className="flex items-start gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                      <Icone className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{n.titre}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {depuis(n.date, maintenant)}
                    </span>
                  </div>
                </MobileCard>
              );
            })}
          </div>
        )}
      </MobileSection>
    </MobilePage>
  );
}
