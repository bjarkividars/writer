"use client";

import Sidebar from "@/components/sidebar/Sidebar";
import SidebarToggle from "@/components/sidebar/SidebarToggle";
import Header from "@/components/header/Header";
import { SessionProvider } from "@/components/session/SessionContext";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="h-screen w-full bg-background">
        <SidebarToggle />
        <div className="h-full flex">
          <Sidebar />
          <div className="flex-1 flex flex-col shadow-doc-left relative z-10">
            <Header />
            <main className="flex-1 overflow-hidden">{children}</main>
          </div>
        </div>
      </div>
    </SessionProvider>
  );
}
