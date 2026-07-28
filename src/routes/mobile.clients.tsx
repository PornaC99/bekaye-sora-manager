import { createFileRoute } from "@tanstack/react-router";
import { Crown, Gift, Phone } from "lucide-react";
import { useMemo } from "react";

import { MobileCard, MobileEmpty, MobilePage, MobileSection } from "@/components/mobile/shell";
import { useClientsStore } from "@/lib/clients/store";
import { formatFCFA } from "@/lib/products/types";

export const Route = createFileRoute("/mobile/clients")({
  head: () => ({
    meta: [
      { title: "Clients VIP — Bekaye Sora Mobile" },
      {
        name: "description",
        content: "Les clientes et clients les plus fidèles de Bekaye Sora et leurs points de fidélité.",
      },
      { property: "og:title", content: "Clients VIP — Bekaye Sora Mobile" },
      {
        property: "og:description",
        content: "Repérez vos meilleurs clients et leurs habitudes d'achat.",
      },
    ],
  }),
  component: ClientsMobile,
});

function ClientsMobile() {
  const { clients } = useClientsStore();

  const vip = useMemo(
    () => [...clients].sort((a, b) => b.totalDepense - a.totalDepense).slice(0, 15),
    [clients],
  );

  const total = vip.reduce((t, c) => t + c.totalDepense, 0);

  return (
    <MobilePage titre="Clients VIP" sousTitre={`${vip.length} client(s) prioritaire(s)`}>
      <MobileCard className="border-primary/25 bg-primary-soft/40">
        <p className="text-[11px] uppercase tracking-[0.12em] text-primary">
          Chiffre d'affaires VIP cumulé
        </p>
        <p className="mt-1 font-display text-xl font-semibold text-foreground">
          {formatFCFA(total)}
        </p>
      </MobileCard>

      <MobileSection titre="Classement">
        {vip.length === 0 ? (
          <MobileEmpty message="Aucun client enregistré." />
        ) : (
          <div className="space-y-2">
            {vip.map((client, index) => (
              <MobileCard key={client.id} className="p-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted font-display text-sm font-semibold text-foreground">
                    {index === 0 ? <Crown className="h-4 w-4 text-primary" /> : index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{client.nom}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /> {client.telephone || "—"} · {client.ville}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-primary">
                      <Gift className="h-3 w-3" /> {client.points} points ·{" "}
                      {client.nombreAchats} achat(s)
                    </p>
                  </div>
                  <p className="shrink-0 font-display text-sm font-semibold text-foreground">
                    {formatFCFA(client.totalDepense)}
                  </p>
                </div>
              </MobileCard>
            ))}
          </div>
        )}
      </MobileSection>
    </MobilePage>
  );
}
