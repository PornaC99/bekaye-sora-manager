import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MapPin, TrendingUp, UserRoundX, Users } from "lucide-react";

import { ClientAvatar } from "@/components/clients/clients-table";
import { ClientsKpiCards } from "@/components/clients/kpi-cards";
import { PageHeader } from "@/components/layout/page";
import {
  kpisClients,
  meilleursClients,
  nouveauxParMois,
  repartitionSexe,
  repartitionVilles,
} from "@/lib/clients/analytics";
import { useClientsStore } from "@/lib/clients/store";
import { estInactif, SEXE_LABEL, type Sexe } from "@/lib/clients/types";
import { formatDateCourt, formatFCFA } from "@/lib/products/types";

const TITLE = "Statistiques clients";
const DESCRIPTION = "Comprendre d'où viennent vos clients et lesquels sont les plus rentables.";

const COULEURS = ["#e11d48", "#64748b", "#d97706", "#0ea5e9", "#16a34a", "#a855f7"];

export const Route = createFileRoute("/clients/statistiques")({
  head: () => ({
    meta: [
      { title: `${TITLE} — Bekaye Sora Business Manager` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `${TITLE} — Bekaye Sora Business Manager` },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: StatistiquesClients,
});

function StatistiquesClients() {
  const { clients } = useClientsStore();

  const kpis = useMemo(() => kpisClients(clients), [clients]);
  const villes = useMemo(() => repartitionVilles(clients).slice(0, 6), [clients]);
  const sexes = useMemo(() => {
    const map = repartitionSexe(clients);
    return [...map.entries()].map(([sexe, total]) => ({
      nom: SEXE_LABEL[sexe as Sexe] ?? "Non précisé",
      total,
    }));
  }, [clients]);
  const nouveaux = useMemo(() => nouveauxParMois(clients), [clients]);
  const perdus = useMemo(
    () => clients.filter(estInactif).sort((a, b) => b.totalDepense - a.totalDepense).slice(0, 6),
    [clients],
  );
  const rentables = useMemo(() => meilleursClients(clients, 6), [clients]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Analyse" title={TITLE} description={DESCRIPTION} />

      <ClientsKpiCards
        cartes={[
          { label: "Total clients", value: String(kpis.total), icon: Users, tone: "primary" },
          {
            label: "Nouveaux ce mois",
            value: String(kpis.nouveaux),
            icon: TrendingUp,
            tone: "success",
          },
          {
            label: "Clients perdus",
            value: String(kpis.inactifs),
            hint: "Inactifs depuis plus de 90 jours",
            icon: UserRoundX,
            tone: "warning",
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Carte titre="Répartition par ville" description="Où se trouvent vos clients">
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={villes}>
                <XAxis dataKey="ville" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  formatter={(value) => [`${value} clients`, "Total"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }}
                />
                <Bar dataKey="total" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Carte>

        <Carte titre="Répartition par sexe" description="Uniquement si l'information est renseignée">
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sexes}
                  dataKey="total"
                  nameKey="nom"
                  innerRadius={54}
                  outerRadius={84}
                  paddingAngle={3}
                  stroke="var(--card)"
                  strokeWidth={2}
                >
                  {sexes.map((entry, index) => (
                    <Cell key={entry.nom} fill={COULEURS[index % COULEURS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} clients`, String(name)]}
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Carte>

        <Carte titre="Nouveaux clients" description="Évolution sur les 6 derniers mois">
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={nouveaux}>
                <XAxis dataKey="mois" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  formatter={(value) => [`${value} nouveaux`, "Clients"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }}
                />
                <Bar dataKey="total" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Carte>

        <Carte titre="Clients les plus rentables" description="Classement par chiffre d'affaires">
          <ul className="space-y-2">
            {rentables.map((client) => (
              <li
                key={client.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <ClientAvatar client={client} taille={30} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-foreground">{client.nom}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {client.ville}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 text-sm font-medium text-foreground">
                  {formatFCFA(client.totalDepense)}
                </span>
              </li>
            ))}
          </ul>
        </Carte>
      </div>

      <Carte titre="Clients perdus" description="À relancer en priorité">
        <ul className="grid gap-2 sm:grid-cols-2">
          {perdus.map((client) => (
            <li
              key={client.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm text-foreground">{client.nom}</span>
                <span className="text-xs text-muted-foreground">
                  Dernier achat : {formatDateCourt(client.dernierAchat)}
                </span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatFCFA(client.totalDepense)}
              </span>
            </li>
          ))}
          {perdus.length === 0 && (
            <li className="text-sm text-muted-foreground">Aucun client perdu, bravo !</li>
          )}
        </ul>
      </Carte>
    </div>
  );
}

function Carte({
  titre,
  description,
  children,
}: {
  titre: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <h2 className="text-sm font-semibold text-foreground">{titre}</h2>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}
