import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { CalendarClock, Heart, Sparkles, Trophy, Wallet } from "lucide-react";

import { LoyaltyCard } from "@/components/clients/loyalty-card";
import { ClientsKpiCards } from "@/components/clients/kpi-cards";
import { PageHeader } from "@/components/layout/page";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { analyseClient } from "@/lib/clients/analytics";
import { useClientsStore } from "@/lib/clients/store";
import { infoNiveau, STATUT_CLIENT_LABEL } from "@/lib/clients/types";
import { formatFCFA } from "@/lib/products/types";

const TITLE = "Analyse client";
const DESCRIPTION = "Comprenez en un coup d'œil les habitudes d'achat de chaque client.";

export const Route = createFileRoute("/_authenticated/clients/analyse")({
  validateSearch: (search: Record<string, unknown>) => ({
    client: typeof search.client === "string" ? search.client : undefined,
  }),
  head: () => ({
    meta: [
      { title: `${TITLE} — Bekaye Sora Business Manager` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `${TITLE} — Bekaye Sora Business Manager` },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: AnalyseClientPage,
});

function AnalyseClientPage() {
  const { client: clientRecherche } = Route.useSearch();
  const { clients, achats } = useClientsStore();
  const [selection, setSelection] = useState<string | undefined>(clientRecherche);

  const clientId = selection ?? clientRecherche ?? clients[0]?.id;
  const client = clients.find((c) => c.id === clientId) ?? clients[0] ?? null;
  const achatsClient = useMemo(
    () => (client ? achats.filter((a) => a.clientId === client.id) : []),
    [achats, client],
  );
  const analyse = useMemo(
    () => (client ? analyseClient(client, achatsClient) : null),
    [client, achatsClient],
  );

  if (!client || !analyse) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Ajoutez un client pour afficher son analyse.
      </div>
    );
  }

  const niveau = infoNiveau(analyse.niveau);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Bonus premium"
        title={TITLE}
        description={DESCRIPTION}
        actions={
          <Select value={client.id} onValueChange={setSelection}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Choisir un client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <LoyaltyCard client={client} />

        <ClientsKpiCards
          cartes={[
            {
              label: "Montant moyen par achat",
              value: formatFCFA(analyse.panierMoyen),
              hint: `${client.nombreAchats} achats au total`,
              icon: Wallet,
              tone: "primary",
            },
            {
              label: "Fréquence d'achat",
              value: analyse.frequence
                ? `${Math.round(analyse.frequence)} jours`
                : "Pas encore mesurable",
              hint: "Intervalle moyen entre deux achats",
              icon: CalendarClock,
              tone: "muted",
            },
            {
              label: "Niveau de fidélité",
              value: `${niveau.label} · ${client.points} pts`,
              hint: `Statut : ${STATUT_CLIENT_LABEL[analyse.statut]}`,
              icon: Trophy,
              tone: "success",
            },
          ]}
        />
      </div>

      <section className="rounded-2xl border border-primary/25 bg-primary-soft/40 p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Recommandation intelligente</h2>
        </div>
        <p className="mt-2 text-sm text-foreground">{analyse.recommandation}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold text-foreground">Évolution des dépenses</h2>
          <p className="text-xs text-muted-foreground">6 derniers mois</p>
          <div className="mt-4 h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyse.evolution}>
                <defs>
                  <linearGradient id="depenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="mois" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  formatter={(value) => [formatFCFA(Number(value)), "Dépenses"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }}
                />
                <Area
                  type="monotone"
                  dataKey="montant"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#depenses)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Produits préférés</h2>
          </div>
          <ul className="mt-3 space-y-2">
            {analyse.preferes.map((p) => (
              <li
                key={p.produitId}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2"
              >
                <span className="min-w-0 truncate text-sm text-foreground">{p.nom}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {p.quantite} unités · {formatFCFA(p.montant)}
                </span>
              </li>
            ))}
            {analyse.preferes.length === 0 && (
              <li className="text-sm text-muted-foreground">Aucun achat enregistré.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
