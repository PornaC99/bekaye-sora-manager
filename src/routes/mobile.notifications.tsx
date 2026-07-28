import { createFileRoute } from "@tanstack/react-router";
import { CheckCheck } from "lucide-react";

import { MobileCard, MobileEmpty, MobilePage, MobileSection } from "@/components/mobile/shell";
import { CLASSES_PRIORITE, ICONES_NOTIF, LABEL_PRIORITE } from "@/components/mobile/pieces";
import { depuis, useHorloge, useNotificationsMobile } from "@/lib/mobile/feed";
import { marquerLue, marquerToutLu } from "@/lib/mobile/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mobile/notifications")({
  head: () => ({
    meta: [
      { title: "Centre de notifications — Bekaye Sora Mobile" },
      {
        name: "description",
        content: "Toutes les alertes de l'entreprise : ventes, stock, caisse, équipe et finances.",
      },
      { property: "og:title", content: "Centre de notifications — Bekaye Sora Mobile" },
      {
        property: "og:description",
        content: "Priorité, heure et statut lu/non lu pour chaque événement de l'entreprise.",
      },
    ],
  }),
  component: NotificationsMobile,
});

function NotificationsMobile() {
  const notifications = useNotificationsMobile();
  const maintenant = useHorloge(30000);
  const nonLues = notifications.filter((n) => !n.lue);

  return (
    <MobilePage
      titre="Notifications"
      sousTitre={`${nonLues.length} non lue(s) · ${notifications.length} au total`}
    >
      <button
        type="button"
        onClick={() => marquerToutLu(notifications.map((n) => n.id))}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-xs font-medium text-foreground transition-transform active:scale-[0.98]"
      >
        <CheckCheck className="h-4 w-4 text-primary" />
        Tout marquer comme lu
      </button>

      <MobileSection titre="Flux des événements">
        {notifications.length === 0 ? (
          <MobileEmpty message="Aucune notification pour le moment." />
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const Icone = ICONES_NOTIF[n.icone];
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => marquerLue(n.id)}
                  className="w-full text-left"
                >
                  <MobileCard
                    className={cn(
                      "p-3 transition-colors",
                      !n.lue && "border-primary/30 bg-primary-soft/30",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                          CLASSES_PRIORITE[n.priorite],
                        )}
                      >
                        <Icone className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {n.titre}
                          </p>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {depuis(n.date, maintenant)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {n.message}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              CLASSES_PRIORITE[n.priorite],
                            )}
                          >
                            {LABEL_PRIORITE[n.priorite]}
                          </span>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                            {n.module}
                          </span>
                          {!n.lue && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                              Non lu
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </MobileCard>
                </button>
              );
            })}
          </div>
        )}
      </MobileSection>
    </MobilePage>
  );
}
