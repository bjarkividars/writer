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
import { Button } from "@/components/Button";

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
    ({
      inPixels,
      asPercentage,
    }: {
      inPixels: number;
      asPercentage: number;
    }) => {
      if (!Number.isFinite(inPixels)) return;
      const collapsed =
        chatPanelRef.current?.isCollapsed() ??
        (inPixels <= 1 || asPercentage <= 1);
      setChatCollapsed(collapsed);
    },
    [chatPanelRef, setChatCollapsed]
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
      <Group
        orientation={groupOrientation}
        className="mx-0 flex h-full w-full "
      >
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
          className="chat-separator"
          data-chat-collapsed={isChatCollapsed ? "true" : "false"}
        >
          {(!isMobile || isChatCollapsed) && (
            <Button
              type="button"
              onClick={handleSeparatorClick}
              className="chat-separator-button"
              aria-label={
                isChatCollapsed ? "Expand chat panel" : "Resize chat panel"
              }
            >
              {isChatCollapsed ? (
                isMobile ? (
                  <ChevronsUp className="w-3 h-3" />
                ) : (
                  <ChevronsLeft className="w-4 h-4" />
                )
              ) : (
                <Equal className="w-4 h-4 rotate-90" />
              )}
            </Button>
          )}
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
