import {
  AlertTriangle,
  Banknote,
  Boxes,
  CreditCard,
  Package,
  RotateCcw,
  ShoppingBag,
  Truck,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { IconeNotif, PrioriteNotif } from "@/lib/mobile/feed";
import { cn } from "@/lib/utils";

export const ICONES_NOTIF: Record<IconeNotif, LucideIcon> = {
  vente: ShoppingBag,
  paiement: CreditCard,
  retour: RotateCcw,
  caisse: Wallet,
  stock: Boxes,
  produit: Package,
  employe: Users,
  client: UserRound,
  fournisseur: Truck,
  depense: Banknote,
  alerte: AlertTriangle,
};

export const CLASSES_PRIORITE: Record<PrioriteNotif, string> = {
  critique: "bg-destructive/10 text-destructive",
  haute: "bg-amber-500/10 text-amber-600",
  normale: "bg-primary-soft text-primary",
};

export const LABEL_PRIORITE: Record<PrioriteNotif, string> = {
  critique: "Critique",
  haute: "Important",
  normale: "Info",
};

export type TonKpi = "primary" | "success" | "warning" | "danger" | "muted";

const TONS: Record<TonKpi, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-amber-500/10 text-amber-600",
  danger: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

export function KpiTile({
  label,
  valeur,
  hint,
  icon: Icon,
  ton = "muted",
}: {
  label: string;
  valeur: string;
  hint?: string;
  icon: LucideIcon;
  ton?: TonKpi;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-3 shadow-[var(--shadow-card)] transition-transform active:scale-[0.98]">
      <span className={cn("grid h-8 w-8 place-items-center rounded-lg", TONS[ton])}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-2 truncate font-display text-base font-semibold text-foreground">{valeur}</p>
      <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{label}</p>
      {hint && <p className="mt-0.5 text-[10px] text-muted-foreground/80">{hint}</p>}
    </div>
  );
}
