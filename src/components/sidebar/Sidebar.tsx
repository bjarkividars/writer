"use client";

import { useEffect } from "react";
import { useSidebarContext } from "./SidebarContext";
import SidebarHeader from "./SidebarHeader";
import SidebarContent from "./SidebarContent";

export default function Sidebar() {
  const { isOpen, close, sessions, loading, hasSessions } = useSidebarContext();

  // Close sidebar on Escape key (mobile)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && window.innerWidth < 1024) {
        close();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, close]);

  // Don't render sidebar if no sessions
  if (!loading && !hasSessions) {
    return null;
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 lg:hidden z-40"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative
          inset-y-0 left-0
          bg-surface
          transition-all duration-200 ease-in-out
          z-50 lg:z-auto
          ${
            isOpen
              ? "w-[280px] translate-x-0"
              : "w-0 -translate-x-full lg:translate-x-0"
          }
        `}
        aria-label="Sessions sidebar"
      >
        <div className="h-full flex flex-col overflow-hidden">
          <SidebarHeader />
          <SidebarContent sessions={sessions} loading={loading} />
        </div>
      </aside>
    </>
  );
}
