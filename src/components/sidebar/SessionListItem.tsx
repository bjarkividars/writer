"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useSidebarContext } from "./SidebarContext";
import { formatRelativeTime } from "@/lib/utils/time";
import SessionItemMenu from "./SessionItemMenu";
import DeleteSessionDialog from "./DeleteSessionDialog";
import RenameSessionDialog from "./RenameSessionDialog";
import {
  useDeleteSessionMutation,
  useUpdateSessionMutation,
} from "@/hooks/orpc/useSessionMutations";
import type { SessionSummary } from "@/lib/orpc/types";
import { useSessionContext } from "@/components/session/SessionContext";

type SessionListItemProps = {
  session: SessionSummary;
};

export default function SessionListItem({ session }: SessionListItemProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { close } = useSidebarContext();
  const { sessionId, setTitle } = useSessionContext();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const renameMutation = useUpdateSessionMutation();
  const deleteMutation = useDeleteSessionMutation();

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
      await renameMutation.mutateAsync({ sessionId: session.id, title: newTitle });
      if (sessionId === session.id) {
        setTitle(newTitle);
      }
    } catch (error) {
      console.error("Failed to rename session:", error);
    }
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync({ sessionId: session.id });

      // If deleting the current session, redirect to home
      if (isActive) {
        router.push("/");
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  return (
    <div className="group relative py-0.5 w-full">
      <Link
        href={`/${session.id}`}
        onClick={handleLinkClick}
        className={`
          block px-4 py-2.5 pr-10 max-w-full
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
