import { Link } from "@tanstack/react-router";
import { Eye, History, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateCourt, formatFCFA } from "@/lib/products/types";
import { cn } from "@/lib/utils";
import {
  infoNiveau,
  initiales,
  niveauFidelite,
  statutClient,
  STATUT_CLIENT_CLASSE,
  STATUT_CLIENT_LABEL,
  type Client,
} from "@/lib/clients/types";

export function ClientAvatar({ client, taille = 36 }: { client: Client; taille?: number }) {
  return client.photo ? (
    <img
      src={client.photo}
      alt={client.nom}
      style={{ width: taille, height: taille }}
      className="rounded-full object-cover"
    />
  ) : (
    <span
      style={{ width: taille, height: taille }}
      className="grid shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary"
    >
      {initiales(client.nom) || "?"}
    </span>
  );
}

export function StatutClientBadge({ client }: { client: Client }) {
  const statut = statutClient(client);
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        STATUT_CLIENT_CLASSE[statut],
      )}
    >
      {STATUT_CLIENT_LABEL[statut]}
    </span>
  );
}

export function ClientsTable({
  clients,
  onModifier,
  onSupprimer,
}: {
  clients: Client[];
  onModifier: (client: Client) => void;
  onSupprimer: (client: Client) => void;
}) {
  if (!clients.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-sm font-medium text-foreground">Aucun client trouvé</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Modifiez votre recherche ou ajoutez un nouveau client.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Téléphone</th>
              <th className="px-4 py-3 font-medium">Ville</th>
              <th className="px-4 py-3 font-medium">Dernier achat</th>
              <th className="px-4 py-3 text-right font-medium">Total dépensé</th>
              <th className="px-4 py-3 text-right font-medium">Points</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => {
              const niveau = infoNiveau(niveauFidelite(client.points));
              return (
                <tr key={client.id} className="border-b border-border/70 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      to="/clients/$clientId"
                      params={{ clientId: client.id }}
                      className="flex items-center gap-3"
                    >
                      <ClientAvatar client={client} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-foreground">
                          {client.nom}
                        </span>
                        <span className="block text-xs text-muted-foreground">{client.numero}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{client.telephone}</td>
                  <td className="px-4 py-3 text-muted-foreground">{client.ville}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateCourt(client.dernierAchat)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">
                    {formatFCFA(client.totalDepense)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                        niveau.classe,
                      )}
                    >
                      {client.points} pts · {niveau.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatutClientBadge client={client} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem asChild>
                            <Link to="/clients/$clientId" params={{ clientId: client.id }}>
                              <Eye className="mr-2 h-4 w-4" /> Voir la fiche
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onModifier(client)}>
                            <Pencil className="mr-2 h-4 w-4" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              to="/clients/$clientId"
                              params={{ clientId: client.id }}
                              hash="historique"
                            >
                              <History className="mr-2 h-4 w-4" /> Historique
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => onSupprimer(client)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
