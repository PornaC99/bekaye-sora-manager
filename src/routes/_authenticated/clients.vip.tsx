import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Crown, Repeat, ShoppingBag } from "lucide-react";

import { ClientAvatar } from "@/components/clients/clients-table";
import { PageHeader } from "@/components/layout/page";
import { frequenceAchat, meilleursClients } from "@/lib/clients/analytics";
import { useClientsStore } from "@/lib/clients/store";
import { infoNiveau, niveauFidelite, panierMoyen } from "@/lib/clients/types";
import { formatDateCourt, formatFCFA } from "@/lib/products/types";
import { cn } from "@/lib/utils";

const TITLE = "Clients VIP";
const DESCRIPTION = "Les 20 meilleurs clients de Bekaye Sora et leurs habitudes d'achat.";

export const Route = createFileRoute("/_authenticated/clients/vip")({
  head: () => ({
    meta: [
      { title: `${TITLE} — Bekaye Sora Business Manager` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `${TITLE} — Bekaye Sora Business Manager` },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: VipPage,
});

function VipPage() {
  const { clients, achats } = useClientsStore();
  const top = useMemo(() => meilleursClients(clients, 20), [clients]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Fidélité" title={TITLE} description={DESCRIPTION} />

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 text-right font-medium">Montant dépensé</th>
                <th className="px-4 py-3 text-right font-medium">Commandes</th>
                <th className="px-4 py-3 text-right font-medium">Panier moyen</th>
                <th className="px-4 py-3 font-medium">Fréquence d'achat</th>
                <th className="px-4 py-3 font-medium">Dernier achat</th>
                <th className="px-4 py-3 font-medium">Niveau</th>
              </tr>
            </thead>
            <tbody>
              {top.map((client, index) => {
                const niveau = infoNiveau(niveauFidelite(client.points));
                const frequence = frequenceAchat(achats.filter((a) => a.clientId === client.id));
                return (
                  <tr key={client.id} className="border-b border-border/70 last:border-0">
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "grid h-7 w-7 place-items-center rounded-lg text-xs font-semibold",
                          index < 3
                            ? "bg-primary-soft text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {index < 3 ? <Crown className="h-3.5 w-3.5" /> : index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to="/clients/$clientId"
                        params={{ clientId: client.id }}
                        className="flex items-center gap-3"
                      >
                        <ClientAvatar client={client} taille={32} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-foreground">
                            {client.nom}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {client.ville}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {formatFCFA(client.totalDepense)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <ShoppingBag className="h-3.5 w-3.5" /> {client.nombreAchats}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {formatFCFA(panierMoyen(client))}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Repeat className="h-3.5 w-3.5" />
                        {frequence ? `tous les ${Math.round(frequence)} jours` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateCourt(client.dernierAchat)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                          niveau.classe,
                        )}
                      >
                        {niveau.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
