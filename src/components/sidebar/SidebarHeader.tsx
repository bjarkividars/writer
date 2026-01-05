"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/Button";
import { useSessionContext } from "@/components/session/SessionContext";

export default function SidebarHeader() {
  const router = useRouter();
  const { resetSession } = useSessionContext();

  const handleNewSession = () => {
    resetSession();
    router.push("/");
  };

  return (
    <div className="flex items-center gap-1.5 px-3 py-3 mt-[3px] shrink-0 w-full">
      <Button
        onClick={handleNewSession}
        className="flex-1 flex items-center justify-center gap-1.5 px-2.5 h-7 rounded bg-background text-foreground text-sm font-medium border border-border hover:bg-hover transition-colors cursor-pointer"
        aria-label="New session"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>New Document</span>
      </Button>

      {/* Space reserved for toggle button */}
      <div className="w-7 h-7" />
    </div>
  );
}
