"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
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
  const pathname = usePathname();
  const router = useRouter();
  const { close, refreshSessions } = useSidebarContext();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);

  const isActive = pathname === `/${session.id}`;
  const displayTitle = session.title || "Untitled";
  const relativeTime = formatRelativeTime(session.updatedAt);

  const handleLinkClick = () => {
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
    <div className="group relative py-0.5">
      <Link
        href={`/${session.id}`}
        onClick={handleLinkClick}
        className={`
          block w-full px-5 py-2.5 pr-10 
          transition-all duration-200 ease-out
          ${isActive ? "bg-hover" : "hover:bg-hover/60"}
        `}
      >
        <div
          className={`text-sm truncate transition-colors ${isActive ? "font-semibold text-foreground" : "font-medium text-foreground"}`}
        >
          {displayTitle}
        </div>
        <div className="text-xs text-foreground-secondary mt-0.5 truncate">
          {relativeTime}
        </div>
      </Link>

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
