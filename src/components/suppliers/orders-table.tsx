import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Eye,
  MoreHorizontal,
  Pencil,
  Printer,
  Send,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateCourt, formatFCFA } from "@/lib/products/types";
import {
  commandeEnRetard,
  montantCommande,
  STATUT_COMMANDE_CLASSE,
  STATUT_COMMANDE_LABEL,
  type CommandeAchat,
} from "@/lib/suppliers/types";
import { cn } from "@/lib/utils";

export function StatutCommandeBadge({ commande }: { commande: CommandeAchat }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className={cn(
          "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
          STATUT_COMMANDE_CLASSE[commande.statut],
        )}
      >
        {STATUT_COMMANDE_LABEL[commande.statut]}
      </span>
      {commandeEnRetard(commande) && (
        <span className="inline-flex rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
          En retard
        </span>
      )}
    </div>
  );
}

export function OrdersTable({
  commandes,
  nomFournisseur,
  onModifier,
  onSupprimer,
  onImprimer,
  onEnvoyer,
  onReceptionner,
}: {
  commandes: CommandeAchat[];
  nomFournisseur: (id: string) => string;
  onModifier: (commande: CommandeAchat) => void;
  onSupprimer: (commande: CommandeAchat) => void;
  onImprimer: (commande: CommandeAchat) => void;
  onEnvoyer: (commande: CommandeAchat) => void;
  onReceptionner: (commande: CommandeAchat) => void;
}) {
  if (!commandes.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Aucune commande ne correspond à votre recherche.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              <th className="px-4 py-3 text-left font-medium">Numéro</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Fournisseur</th>
              <th className="px-4 py-3 text-left font-medium">Livraison prévue</th>
              <th className="px-4 py-3 text-right font-medium">Montant</th>
              <th className="px-4 py-3 text-left font-medium">Statut</th>
              <th className="px-4 py-3 text-left font-medium">Responsable</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {commandes.map((c) => (
              <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Link
                    to="/fournisseurs/commandes/$commandeId"
                    params={{ commandeId: c.id }}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {c.numero}
                  </Link>
                  <p className="text-xs text-muted-foreground">{c.lignes.length} produit(s)</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDateCourt(c.date)}</td>
                <td className="px-4 py-3">{nomFournisseur(c.fournisseurId)}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDateCourt(c.dateLivraisonPrevue)}
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">
                  {formatFCFA(montantCommande(c))}
                </td>
                <td className="px-4 py-3">
                  <StatutCommandeBadge commande={c} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.responsable}</td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`Actions ${c.numero}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to="/fournisseurs/commandes/$commandeId" params={{ commandeId: c.id }}>
                          <Eye className="mr-2 h-4 w-4" /> Voir
                        </Link>
                      </DropdownMenuItem>
                      {c.statut === "brouillon" && (
                        <DropdownMenuItem onSelect={() => onEnvoyer(c)}>
                          <Send className="mr-2 h-4 w-4" /> Envoyer au fournisseur
                        </DropdownMenuItem>
                      )}
                      {c.statut !== "recue" && c.statut !== "annulee" && (
                        <DropdownMenuItem onSelect={() => onReceptionner(c)}>
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Réceptionner
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onSelect={() => onModifier(c)}>
                        <Pencil className="mr-2 h-4 w-4" /> Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onImprimer(c)}>
                        <Printer className="mr-2 h-4 w-4" /> Imprimer le bon
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => onSupprimer(c)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
