import { Link } from "@tanstack/react-router";
import { Copy, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Produit } from "@/lib/products/types";

export type ProductActions = {
  onEdit: (produit: Produit) => void;
  onDuplicate: (produit: Produit) => void;
  onDelete: (produit: Produit) => void;
};

export function ProductRowActions({
  produit,
  actions,
}: {
  produit: Produit;
  actions: ProductActions;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions du produit">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link to="/produits/$produitId" params={{ produitId: produit.id }}>
            <Eye className="h-4 w-4" />
            Voir
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => actions.onEdit(produit)}>
          <Pencil className="h-4 w-4" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => actions.onDuplicate(produit)}>
          <Copy className="h-4 w-4" />
          Dupliquer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => actions.onDelete(produit)}
          className="text-primary focus:text-primary"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
