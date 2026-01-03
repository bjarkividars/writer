"use client";

import TipTapEditor from "@/components/editor/TipTap/TipTapEditor";
import { Panel, Group, Separator } from "react-resizable-panels";
import {
  ScrollAreaRoot,
  ScrollAreaViewport,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
} from "@/components/ScrollArea";
import Chat from "./chat/Chat";
import { useCallback, useEffect, useState } from "react";
import { useEditorContext } from "@/components/editor/EditorContext";
import { SessionHydrator } from "@/components/session/SessionHydrator";
import EditorEmptyState from "@/components/editor/EditorEmptyState";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useLoadingContext } from "@/components/LoadingProvider";
import { ChevronsLeft, ChevronsUp, Equal } from "lucide-react";
import { useChatPanelContext } from "@/components/chat/ChatPanelContext";

type WorkspaceProps = {
  initialIsMobile?: boolean;
};

export default function Workspace({ initialIsMobile = false }: WorkspaceProps) {
  const {
    panelRef: chatPanelRef,
    isChatCollapsed,
    setChatCollapsed,
    openChatPanel,
  } = useChatPanelContext();
  const [isMobile, setIsMobile] = useState(initialIsMobile);
  const { isInitialLoading } = useLoadingContext();
  const { editor, editorRootRef } = useEditorContext();
  const groupOrientation = isMobile ? "vertical" : "horizontal";
  const chatDefaultSize = isMobile ? "40%" : "30%";
  const chatMaxSize = isMobile ? "80%" : "45%";
  const handleDocumentPanelResize = useCallback(
    ({ inPixels }: { inPixels: number }) => {
      if (!Number.isFinite(inPixels)) return;
      document.documentElement.style.setProperty(
        "--doc-panel-width",
        `${inPixels}px`
      );
    },
    []
  );
  const handleChatPanelResize = useCallback(
    ({ inPixels }: { inPixels: number }) => {
      if (!Number.isFinite(inPixels)) return;
      setChatCollapsed(inPixels <= 1);
    },
    [setChatCollapsed]
  );
  const handleSeparatorClick = useCallback(() => {
    if (!isChatCollapsed) return;
    openChatPanel();
  }, [isChatCollapsed, openChatPanel]);

  useEffect(() => {
    return () => {
      document.documentElement.style.removeProperty("--doc-panel-width");
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 767px)");
    const handleChange = () => setIsMobile(media.matches);
    handleChange();

    if (media.addEventListener) {
      media.addEventListener("change", handleChange);
      return () => media.removeEventListener("change", handleChange);
    }

    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);

  return (
    <div className="relative h-full w-full">
      <SessionHydrator />
      <LoadingOverlay show={isInitialLoading} position="absolute" />
      <Group orientation={groupOrientation} className="mx-0 flex h-full w-full ">
        <Panel className="h-full" onResize={handleDocumentPanelResize}>
          <ScrollAreaRoot
            className="relative h-full min-h-full"
            showBottomFade={false}
          >
            <ScrollAreaViewport className="h-full min-h-full">
              <ScrollAreaContent className="relative min-h-full">
                <EditorEmptyState />
                <div className="mx-auto min-h-full w-full max-w-[8.5in]">
                  <TipTapEditor editor={editor} editorRootRef={editorRootRef} />
                </div>
              </ScrollAreaContent>
            </ScrollAreaViewport>
            <ScrollAreaScrollbar>
              <ScrollAreaThumb />
            </ScrollAreaScrollbar>
          </ScrollAreaRoot>
        </Panel>

        <Separator
          className={`flex items-center justify-center chat-separator ${
            isMobile ? "bg-muted/40" : ""
          }`}
          data-chat-collapsed={isChatCollapsed ? "true" : "false"}
        >
          <button
            type="button"
            onClick={handleSeparatorClick}
            className={`chat-separator-button flex items-center justify-center transition-colors ${
              isMobile
                ? "h-6 w-12 rounded-full bg-muted/60 text-muted-foreground"
                : "h-7 w-7 rounded-md text-muted-foreground hover:bg-hover"
            }`}
            aria-label={
              isChatCollapsed ? "Expand chat panel" : "Resize chat panel"
            }
          >
            {isChatCollapsed ? (
              isMobile ? (
                <ChevronsUp className="w-4 h-4" />
              ) : (
                <ChevronsLeft className="w-4 h-4" />
              )
            ) : isMobile ? null : (
              <Equal className="w-4 h-4 rotate-90" />
            )}
          </button>
        </Separator>

        <Panel
          defaultSize={chatDefaultSize}
          minSize="15%"
          maxSize={chatMaxSize}
          collapsible
          collapsedSize="0%"
          className="h-full"
          onResize={handleChatPanelResize}
          panelRef={chatPanelRef}
        >
          <Chat />
        </Panel>
      </Group>
    </div>
  );
}
