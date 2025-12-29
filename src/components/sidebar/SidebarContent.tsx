import {
  ScrollAreaRoot,
  ScrollAreaViewport,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
} from "@/components/ScrollArea";
import SessionListItem from "./SessionListItem";
import type { SessionSummary } from "@/lib/api/contracts";

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
    <ScrollAreaRoot className="flex-1 w-[280px]">
      <ScrollAreaViewport className="w-[280px]">
        <ScrollAreaContent className="w-[280px]">
          <div className="pb-2 w-[280px]">
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
