import { ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function ProductThumb({
  src,
  alt,
  className,
  iconClassName,
}: {
  src: string | null;
  alt: string;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-muted/50",
        className,
      )}
    >
      {src ? (
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <ImageIcon className={cn("h-4 w-4 text-muted-foreground", iconClassName)} />
      )}
    </div>
  );
}
