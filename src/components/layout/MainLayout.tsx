import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? <BottomNav /> : <Sidebar />}
      <main className={isMobile ? "min-h-screen pb-24" : "ml-64 min-h-screen"}>
        <div className={isMobile ? "p-4" : "p-8"}>{children}</div>
      </main>
    </div>
  );
}
