import { cn } from "@/lib/utils";
import { initiales, type Employe } from "@/lib/hr/types";

export function EmployeeAvatar({
  employe,
  taille = "md",
  className,
}: {
  employe: Pick<Employe, "nom" | "photo">;
  taille?: "sm" | "md" | "lg";
  className?: string;
}) {
  const tailles = {
    sm: "h-8 w-8 text-[11px]",
    md: "h-10 w-10 text-xs",
    lg: "h-16 w-16 text-lg",
  } as const;

  if (employe.photo) {
    return (
      <img
        src={employe.photo}
        alt={employe.nom}
        className={cn("shrink-0 rounded-full object-cover", tailles[taille], className)}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-primary-soft font-semibold text-primary",
        tailles[taille],
        className,
      )}
    >
      {initiales(employe.nom)}
    </span>
  );
}
