import { Link } from "@tanstack/react-router";
import { Eye, History, MoreHorizontal, Pencil, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatFCFA } from "@/lib/products/types";
import { initialesFournisseur, type Fournisseur } from "@/lib/suppliers/types";
import { cn } from "@/lib/utils";

export function SupplierLogo({
  fournisseur,
  taille = 36,
}: {
  fournisseur: Fournisseur;
  taille?: number;
}) {
  return fournisseur.logo ? (
    <img
      src={fournisseur.logo}
      alt={fournisseur.nom}
      style={{ width: taille, height: taille }}
      className="rounded-xl object-cover"
    />
  ) : (
    <span
      style={{ width: taille, height: taille }}
      className="grid shrink-0 place-items-center rounded-xl bg-primary-soft text-xs font-semibold text-primary"
    >
      {initialesFournisseur(fournisseur.nom) || "?"}
    </span>
  );
}

export function StatutFournisseurBadge({ actif }: { actif: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        actif ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
      )}
    >
      {actif ? "Actif" : "Inactif"}
    </span>
  );
}

export function SuppliersTable({
  fournisseurs,
  nbProduits,
  totalAchats,
  onModifier,
  onSupprimer,
  onFavori,
}: {
  fournisseurs: Fournisseur[];
  nbProduits: (fournisseur: Fournisseur) => number;
  totalAchats: (fournisseur: Fournisseur) => number;
  onModifier: (fournisseur: Fournisseur) => void;
  onSupprimer: (fournisseur: Fournisseur) => void;
  onFavori: (fournisseur: Fournisseur) => void;
}) {
  if (!fournisseurs.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Aucun fournisseur ne correspond à votre recherche.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              <th className="px-4 py-3 text-left font-medium">Fournisseur</th>
              <th className="px-4 py-3 text-left font-medium">Téléphone</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Ville</th>
              <th className="px-4 py-3 text-right font-medium">Produits</th>
              <th className="px-4 py-3 text-right font-medium">Total achats</th>
              <th className="px-4 py-3 text-left font-medium">Statut</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fournisseurs.map((f) => (
              <tr key={f.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <SupplierLogo fournisseur={f} />
                    <div className="min-w-0">
                      <Link
                        to="/fournisseurs/$fournisseurId"
                        params={{ fournisseurId: f.id }}
                        className="flex items-center gap-1.5 truncate font-medium text-foreground hover:text-primary"
                      >
                        {f.nom}
                        {f.favori && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">{f.entreprise}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{f.telephone}</td>
                <td className="px-4 py-3 text-muted-foreground">{f.email || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{f.ville}</td>
                <td className="px-4 py-3 text-right tabular-nums">{nbProduits(f)}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">
                  {formatFCFA(totalAchats(f))}
                </td>
                <td className="px-4 py-3">
                  <StatutFournisseurBadge actif={f.actif} />
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`Actions ${f.nom}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to="/fournisseurs/$fournisseurId" params={{ fournisseurId: f.id }}>
                          <Eye className="mr-2 h-4 w-4" /> Voir
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onModifier(f)}>
                        <Pencil className="mr-2 h-4 w-4" /> Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          to="/fournisseurs/$fournisseurId"
                          params={{ fournisseurId: f.id }}
                          hash="historique"
                        >
                          <History className="mr-2 h-4 w-4" /> Historique
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onFavori(f)}>
                        <Star className="mr-2 h-4 w-4" />
                        {f.favori ? "Retirer des favoris" : "Ajouter aux favoris"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => onSupprimer(f)}
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
