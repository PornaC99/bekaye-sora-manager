import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/navigation";
import { LOGO_URL } from "@/lib/brand";

export function BrandMark({
  compact = false,
  className,
  taille = "md",
}: {
  compact?: boolean;
  className?: string;
  taille?: "md" | "lg";
}) {
  const dimension = taille === "lg" ? "h-14 w-14" : "h-10 w-10";

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-xl ring-1 ring-[var(--color-gold)]/40 shadow-[var(--shadow-glow)]",
          dimension,
        )}
      >
        <img
          src={LOGO_URL}
          alt="Logo Bekaye Sora Collection"
          className="h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold leading-tight text-foreground">
            {BRAND.name}
          </p>
          <p className="truncate text-[11px] uppercase tracking-[0.14em] text-[var(--color-gold)]">
            {BRAND.app}
          </p>
        </div>
      )}
    </div>
  );
}
