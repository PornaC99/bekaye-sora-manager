import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { cn } from "@/lib/utils";
import { infoNiveau, niveauFidelite, prochainNiveau, type Client } from "@/lib/clients/types";
import { BRAND } from "@/lib/navigation";

/** Carte de fidélité numérique du client (nom, numéro, QR code, points, niveau). */
export function LoyaltyCard({ client }: { client: Client }) {
  const [qr, setQr] = useState<string | null>(null);
  const niveau = infoNiveau(niveauFidelite(client.points));
  const suivant = prochainNiveau(client.points);

  useEffect(() => {
    let annule = false;
    QRCode.toDataURL(`${client.numero}|${client.nom}|${client.points}`, {
      margin: 1,
      width: 160,
    })
      .then((url) => !annule && setQr(url))
      .catch(() => setQr(null));
    return () => {
      annule = true;
    };
  }, [client.numero, client.nom, client.points]);

  const progression = suivant
    ? Math.min(100, Math.round((client.points / suivant.seuil) * 100))
    : 100;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-foreground to-foreground/85 p-5 text-background shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] opacity-70">
            {BRAND.name} · Carte fidélité
          </p>
          <p className="mt-2 truncate font-display text-xl font-semibold">{client.nom}</p>
          <p className="text-xs opacity-80">{client.numero}</p>
          <div className="mt-4 flex items-center gap-2">
            <span
              className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", niveau.classe)}
            >
              Niveau {niveau.label}
            </span>
            <span className="text-sm font-semibold">{client.points} points</span>
          </div>
        </div>
        <div className="shrink-0 rounded-xl bg-background p-2">
          {qr ? (
            <img src={qr} alt={`QR code ${client.numero}`} className="h-20 w-20" />
          ) : (
            <div className="h-20 w-20 animate-pulse rounded bg-muted" />
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/25">
          <div className="h-full rounded-full bg-primary" style={{ width: `${progression}%` }} />
        </div>
        <p className="mt-2 text-xs opacity-80">
          {suivant
            ? `Encore ${suivant.seuil - client.points} points pour atteindre le niveau ${suivant.label}.`
            : "Niveau maximum atteint — merci pour votre fidélité !"}
        </p>
      </div>
    </div>
  );
}
