"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export default function SidebarHeader() {
  const router = useRouter();

  const handleNewSession = () => {
    router.push("/");
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 mt-1 border-b border-border shrink-0">
      <h2 className="text-sm font-medium text-foreground ml-8">Recent</h2>
      <button
        onClick={handleNewSession}
        className="btn-ghost btn-icon"
        aria-label="New session"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
