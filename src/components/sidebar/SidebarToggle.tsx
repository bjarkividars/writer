"use client";

import { PanelLeft, PanelLeftClose } from "lucide-react";
import { useSidebarContext } from "./SidebarContext";

export default function SidebarToggle() {
  const { isOpen, open, close, hasSessions, loading } = useSidebarContext();

  // Don't show toggle if no sessions
  if (!loading && !hasSessions) {
    return null;
  }

  return (
    <button
      onClick={isOpen ? close : open}
      className={`
        cursor-pointer fixed top-[15px] left-[244px] z-51 h-7 w-7 flex items-center justify-center rounded
        bg-background text-foreground-muted hover:text-foreground hover:bg-hover
        border transition-all duration-200
        ${isOpen ? "border-border" : "border-transparent"}
      `}
      style={{
        transform: isOpen ? "translateX(0)" : "translateX(-236px)",
      }}
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
    >
      {isOpen ? (
        <PanelLeftClose className="w-3.5 h-3.5" />
      ) : (
        <PanelLeft className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
