"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export default function SidebarHeader({ isOpen }: { isOpen: boolean }) {
  const router = useRouter();

  const handleNewSession = () => {
    router.push("/");
  };

  return (
    <div className="flex items-center justify-end px-4 py-3 mt-1 shrink-0">
      <button
        onClick={handleNewSession}
        className="btn-ghost btn-icon"
        aria-label="New session"
      >
        <Plus
          className={`w-4 h-4 ${isOpen ? "opacity-100" : "opacity-0"} transition-opacity duration-200 ease-in-out`}
        />
      </button>
    </div>
  );
}
