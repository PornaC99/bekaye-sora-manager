import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/hooks/use-theme";

/** Bascule clair / sombre, mémorisée dans le navigateur. */
export function ThemeToggle() {
  const { theme, basculer } = useTheme();
  const sombre = theme === "sombre";

  return (
    <button
      type="button"
      onClick={basculer}
      aria-label={sombre ? "Activer le mode clair" : "Activer le mode sombre"}
      title={sombre ? "Mode clair" : "Mode sombre"}
      className="grid h-9 w-9 place-items-center rounded-lg border border-border text-foreground transition-colors hover:bg-muted"
    >
      {sombre ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
