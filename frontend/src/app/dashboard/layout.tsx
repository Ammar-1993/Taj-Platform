import React from "react";
import { Sidebar, AuthGuard, DecorativeBackground, MobileHeader } from "@/components/layout";
import { SidebarProvider } from "@/context/SidebarContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="flex min-h-screen bg-slate-50/50 relative overflow-hidden" dir="rtl">
          <DecorativeBackground />
        
        {/* Sidebar for Desktop */}
        <div className="hidden md:block sticky top-0 h-screen z-20">
            <Sidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen z-10 w-full overflow-x-hidden">
          {/* Mobile Header */}
          <MobileHeader />

          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent relative">
            {children}
          </main>
        </div>
      </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
