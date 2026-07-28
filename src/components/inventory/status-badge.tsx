import { cn } from "@/lib/utils";
import { STATUT_ECART_LABEL, type StatutEcart } from "@/lib/inventory/types";

const TONS: Record<StatutEcart, string> = {
  conforme: "border-success/30 bg-success/10 text-success",
  mineur: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  important: "border-primary/30 bg-primary-soft text-primary",
};

const PASTILLES: Record<StatutEcart, string> = {
  conforme: "bg-success",
  mineur: "bg-amber-500",
  important: "bg-primary",
};

export function EcartBadge({ statut }: { statut: StatutEcart }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        TONS[statut],
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", PASTILLES[statut])} />
      {STATUT_ECART_LABEL[statut]}
    </span>
  );
}
