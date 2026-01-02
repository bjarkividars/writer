"use client";

import TipTapEditor from "@/components/editor/TipTap/TipTapEditor";
import { Panel, Group, Separator, usePanelRef } from "react-resizable-panels";
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
import { ChevronsLeft, Equal } from "lucide-react";

export default function Workspace() {
  const chatPanelRef = usePanelRef();
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const { isInitialLoading } = useLoadingContext();
  const { editor, editorRootRef } = useEditorContext();
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
      setIsChatCollapsed(inPixels <= 1);
    },
    []
  );
  const handleSeparatorClick = useCallback(() => {
    if (!isChatCollapsed) return;
    chatPanelRef.current?.expand();
  }, [isChatCollapsed, chatPanelRef]);

  useEffect(() => {
    return () => {
      document.documentElement.style.removeProperty("--doc-panel-width");
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <SessionHydrator />
      <LoadingOverlay show={isInitialLoading} position="absolute" />
      <Group orientation="horizontal" className="mx-0 flex h-full w-full ">
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
          className="flex items-center justify-center chat-separator"
          data-chat-collapsed={isChatCollapsed ? "true" : "false"}
        >
          <button
            type="button"
            onClick={handleSeparatorClick}
            className="chat-separator-button"
            aria-label={
              isChatCollapsed ? "Expand chat panel" : "Resize chat panel"
            }
          >
            {isChatCollapsed ? (
              <ChevronsLeft className="w-4 h-4" />
            ) : (
              <Equal className="w-4 h-4 rotate-90" />
            )}
          </button>
        </Separator>

        <Panel
          defaultSize="30%"
          minSize="15%"
          maxSize="45%"
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
