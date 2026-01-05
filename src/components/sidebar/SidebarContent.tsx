import {
  ScrollAreaRoot,
  ScrollAreaViewport,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
} from "@/components/ScrollArea";
import SessionListItem from "./SessionListItem";
import type { SessionSummary } from "@/lib/orpc/types";

type SidebarContentProps = {
  sessions: SessionSummary[];
  loading: boolean;
};

export default function SidebarContent({
  sessions,
  loading,
}: SidebarContentProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-sm text-foreground-muted">Loading sessions...</div>
      </div>
    );
  }

  return (
    <ScrollAreaRoot className="flex-1 min-h-0 w-full [--scroll-fade-color:var(--color-surface)]">
      <ScrollAreaViewport className="h-full min-h-0 w-full">
        <ScrollAreaContent className="h-auto min-h-0 w-full">
          <div className="pb-2 w-full">
            {sessions.map((session) => (
              <SessionListItem key={session.id} session={session} />
            ))}
          </div>
        </ScrollAreaContent>
      </ScrollAreaViewport>
      <ScrollAreaScrollbar>
        <ScrollAreaThumb />
      </ScrollAreaScrollbar>
    </ScrollAreaRoot>
  );
}
