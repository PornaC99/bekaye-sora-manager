import type { ReactNode } from "react";

import { AppSidebar, MobileSidebar } from "./app-sidebar";
import { TopBar } from "./top-bar";
import { ShellProvider } from "./shell-context";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ShellProvider>
      <div className="flex min-h-screen w-full bg-surface">
        <AppSidebar />
        <MobileSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        </div>
      </div>
    </ShellProvider>
  );
}
