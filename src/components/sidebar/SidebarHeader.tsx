"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export default function SidebarHeader({ isOpen }: { isOpen: boolean }) {
  const router = useRouter();

  const handleNewSession = () => {
    router.push("/");
  };

  return (
    <div className="flex items-center justify-start px-4 py-3 mt-1 shrink-0">
      <button
        onClick={handleNewSession}
        className="btn-secondary w-[200px] flex items-center justify-start gap-2 px-2 py-2 rounded-md"
        aria-label="New session"
      >
        <Plus
          className={`w-4 h-4 ${isOpen ? "opacity-100" : "opacity-0"} transition-opacity duration-200 ease-in-out`}
        />
        New Document
      </button>
    </div>
  );
}
