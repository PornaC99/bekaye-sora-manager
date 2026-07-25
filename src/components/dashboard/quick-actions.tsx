import { Link } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  Banknote,
  FileText,
  PackagePlus,
  ShoppingCart,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import { SectionCard } from "./section-card";

const actions: { label: string; to: string; icon: LucideIcon }[] = [
  { label: "Nouvelle vente", to: "/ventes", icon: ShoppingCart },
  { label: "Ajouter un produit", to: "/produits", icon: PackagePlus },
  { label: "Nouvelle entrée de stock", to: "/entrees-stock", icon: ArrowDownToLine },
  { label: "Nouvel employé", to: "/employes", icon: UserPlus },
  { label: "Voir les rapports", to: "/rapports", icon: FileText },
  { label: "Ouvrir la caisse", to: "/caisse", icon: Banknote },
];

export function QuickActions() {
  return (
    <SectionCard title="Accès rapide" description="Les actions les plus courantes">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            to={action.to}
            className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary-soft/60 hover:shadow-[var(--shadow-soft)]"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary transition-transform duration-200 group-hover:scale-105">
              <action.icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
            </span>
            <span className="min-w-0 text-sm font-medium text-foreground">{action.label}</span>
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}
