import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/navigation";

export function BrandMark({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary shadow-[var(--shadow-glow)]">
        <span className="font-display text-sm font-bold tracking-tight text-primary-foreground">
          501
        </span>
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold leading-tight text-foreground">
            {BRAND.name}
          </p>
          <p className="truncate text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {BRAND.app}
          </p>
        </div>
      )}
    </div>
  );
}
