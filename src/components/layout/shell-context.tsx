import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type ShellContextValue = {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  collapsed: boolean;
  toggleCollapsed: () => void;
};

const ShellContext = createContext<ShellContextValue | null>(null);

export function ShellProvider({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const value = useMemo(
    () => ({
      mobileOpen,
      setMobileOpen,
      collapsed,
      toggleCollapsed: () => setCollapsed((v) => !v),
    }),
    [mobileOpen, collapsed],
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell doit être utilisé dans ShellProvider");
  return ctx;
}
