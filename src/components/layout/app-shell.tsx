import type { ReactNode } from "react";

import { AppSidebar, MobileSidebar } from "./app-sidebar";
import { MobileTabBar } from "./mobile-tabbar";
import { TopBar } from "./top-bar";
import { ShellProvider } from "./shell-context";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ShellProvider>
      <div className="flex min-h-[100dvh] w-full bg-surface">
        <AppSidebar />
        <MobileSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="safe-x flex-1 px-3 py-4 pb-[calc(72px+env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-8 lg:pb-8">
            {children}
          </main>
        </div>
        <MobileTabBar />
      </div>
    </ShellProvider>
  );
}
