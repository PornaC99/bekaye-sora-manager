import { Bell, Banknote, RotateCcw, Smartphone } from "lucide-react";

import { formatDateCourt, formatHeure } from "@/lib/products/types";
import type { NotificationVente } from "@/lib/sales/types";

const ICONES = {
  vente: Banknote,
  paiement: Smartphone,
  retour: RotateCcw,
  caisse: Bell,
} as const;

export function NotificationsFeed({
  notifications,
  limite = 6,
}: {
  notifications: NotificationVente[];
  limite?: number;
}) {
  if (notifications.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune notification pour le moment.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {notifications.slice(0, limite).map((notification) => {
        const Icone = ICONES[notification.type];
        return (
          <li
            key={notification.id}
            className="flex items-start gap-3 rounded-xl border border-border bg-background px-3 py-2.5"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
              <Icone className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{notification.titre}</p>
              <p className="truncate text-xs text-muted-foreground">{notification.message}</p>
            </div>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {formatDateCourt(notification.date)} · {formatHeure(notification.date)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
