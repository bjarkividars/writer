"use client";

import { PanelLeft, PanelLeftClose } from "lucide-react";
import { useSidebarContext } from "./SidebarContext";

export default function SidebarToggle() {
  const { isOpen, toggle, hasSessions, loading } = useSidebarContext();

  // Don't show toggle if no sessions
  if (!loading && !hasSessions) {
    return null;
  }

  return (
    <button
      onClick={toggle}
      className={`fixed top-4 left-2 xl:left-4 z-40  btn-ghost btn-icon ${isOpen && "translate-x-[232px]"} transition-transform duration-200 ease-in-out`}
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
    >
      {isOpen ? (
        <PanelLeftClose className="w-5 h-5" />
      ) : (
        <PanelLeft className="w-5 h-5" />
      )}
    </button>
  );
}
