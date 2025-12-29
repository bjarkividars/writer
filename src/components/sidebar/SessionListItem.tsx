"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSidebarContext } from "./SidebarContext";
import { formatRelativeTime } from "@/lib/utils/time";
import SessionItemMenu from "./SessionItemMenu";
import DeleteSessionDialog from "./DeleteSessionDialog";
import RenameSessionDialog from "./RenameSessionDialog";
import { deleteSession, renameSession } from "@/lib/api/client";
import type { SessionSummary } from "@/lib/api/contracts";

type SessionListItemProps = {
  session: SessionSummary;
};

export default function SessionListItem({ session }: SessionListItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { close, refreshSessions } = useSidebarContext();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);

  const isActive = pathname === `/${session.id}`;
  const displayTitle = session.title || "Untitled";
  const relativeTime = formatRelativeTime(session.updatedAt);

  const handleClick = () => {
    router.push(`/${session.id}`);

    // Close sidebar on mobile after navigation
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      close();
    }
  };

  const handleRename = () => {
    setRenameDialogOpen(true);
  };

  const handleRenameConfirm = async (newTitle: string) => {
    try {
      await renameSession(session.id, newTitle);
      await refreshSessions();
    } catch (error) {
      console.error("Failed to rename session:", error);
    }
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteSession(session.id);
      await refreshSessions();

      // If deleting the current session, redirect to home
      if (isActive) {
        router.push("/");
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  return (
    <div
      className={`
        w-[280px] group relative
        transition-colors
        border-l-2
        ${
          isActive
            ? "border-accent bg-hover"
            : "border-transparent hover:bg-hover/50"
        }
      `}
    >
      <button
        onClick={handleClick}
        className="w-full text-left px-4 py-2.5 pr-10"
      >
        <div className="text-sm font-medium text-foreground truncate">
          {displayTitle}
        </div>
        <div className="text-xs text-foreground-muted mt-0.5 truncate">
          {relativeTime}
        </div>
      </button>

      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <SessionItemMenu onRename={handleRename} onDelete={handleDelete} />
      </div>

      <DeleteSessionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        sessionTitle={session.title}
        onConfirm={handleDeleteConfirm}
      />

      <RenameSessionDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        currentTitle={session.title}
        onConfirm={handleRenameConfirm}
      />
    </div>
  );
}
