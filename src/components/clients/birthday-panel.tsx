import { Cake, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ClientAvatar } from "./clients-table";
import type { Client } from "@/lib/clients/types";

/** Anniversaires du jour avec envoi de message de vœux. */
export function BirthdayPanel({
  clients,
  onEnvoyer,
}: {
  clients: Client[];
  onEnvoyer: (client: Client) => void;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary">
          <Cake className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Anniversaires du jour</h2>
          <p className="text-xs text-muted-foreground">
            Un petit mot fait toujours plaisir à vos clients.
          </p>
        </div>
      </div>

      {clients.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Aucun anniversaire aujourd'hui.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {clients.map((client) => (
            <li
              key={client.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-3">
                <ClientAvatar client={client} taille={32} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{client.nom}</p>
                  <p className="text-xs text-muted-foreground">{client.telephone}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => onEnvoyer(client)}>
                <Send className="mr-2 h-4 w-4" /> Vœux
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
