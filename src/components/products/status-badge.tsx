import { cn } from "@/lib/utils";
import { STATUT_LABEL, type StatutProduit } from "@/lib/products/types";

const TONES: Record<StatutProduit, string> = {
  disponible: "border-success/30 bg-success/10 text-success",
  faible: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  rupture: "border-primary/30 bg-primary-soft text-primary",
  desactive: "border-border bg-muted text-muted-foreground",
};

export function StatusBadge({ statut, className }: { statut: StatutProduit; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        TONES[statut],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUT_LABEL[statut]}
    </span>
  );
}
