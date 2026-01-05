"use client";

import { useEffect } from "react";
import { useSidebarContext } from "./SidebarContext";
import SidebarHeader from "./SidebarHeader";
import SidebarContent from "./SidebarContent";
import SidebarThemeToggle from "./SidebarThemeToggle";

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
          overflow-hidden
          ${
            isOpen
              ? "w-(--sidebar-width) translate-x-0"
              : "w-0 -translate-x-full lg:translate-x-0"
          }
        `}
        aria-label="Sessions sidebar"
      >
        <div className="h-full w-(--sidebar-width) min-h-0 flex flex-col">
          <SidebarHeader />
          <SidebarContent sessions={sessions} loading={loading} />
          <div className="flex flex-col pt-4 pb-1">
            <div className="px-4 text-xs text-foreground-muted w-full">
              View the source code on{" "}
              <a
                href="https://github.com/bjarkividars/writer"
                target="_blank"
                rel="noreferrer"
                className="text-foreground hover:text-foreground/80 transition-colors"
              >
                GitHub
              </a>
            </div>
            <div className="px-4 py-2 text-xs text-foreground-muted w-full">
              Check out my other projects{" "}
              <a
                href="https://bjarki.me"
                target="_blank"
                rel="noreferrer"
                className="text-foreground hover:text-foreground/80 transition-colors"
              >
                bjarki.me
              </a>
            </div>
          </div>
          <SidebarThemeToggle />
        </div>
      </aside>
    </>
  );
}
