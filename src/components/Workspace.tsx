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
import { useEditor } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { editorExtensions } from "@/editor/extensions";
import { EditorProvider } from "@/components/editor/EditorContext";
import { ChatProvider } from "@/components/chat/ChatContext";
import { SessionHydrator } from "@/components/session/SessionHydrator";
import EditorEmptyState from "@/components/editor/EditorEmptyState";
import { LoadingProvider } from "@/components/LoadingProvider";
import { ChevronsLeft, Equal } from "lucide-react";

export default function Workspace() {
  const editorRootRef = useRef<HTMLDivElement>(null);
  const chatPanelRef = usePanelRef();
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: editorExtensions,
    content: "",
    editorProps: {
      attributes: {
        class: "min-h-full w-full outline-none text-base leading-7",
      },
    },
  });
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
    <ChatProvider>
      <EditorProvider editor={editor} editorRootRef={editorRootRef}>
        <SessionHydrator />
        <LoadingProvider>
          <Group orientation="horizontal" className="mx-0 flex h-full w-full">
            <Panel className="h-full" onResize={handleDocumentPanelResize}>
              <ScrollAreaRoot
                className="relative h-full min-h-full"
                showBottomFade={false}
              >
                <ScrollAreaViewport className="h-full min-h-full">
                  <ScrollAreaContent className="relative min-h-full">
                    <EditorEmptyState />
                    <div className="mx-auto min-h-full w-full max-w-[8.5in]">
                      <TipTapEditor
                        editor={editor}
                        editorRootRef={editorRootRef}
                      />
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
              <ScrollAreaRoot
                className="relative h-full min-h-full"
                showBottomFade={false}
              >
                <ScrollAreaViewport className="h-full min-h-full">
                  <ScrollAreaContent className="relative min-h-full">
                    <Chat />
                  </ScrollAreaContent>
                </ScrollAreaViewport>
                <ScrollAreaScrollbar>
                  <ScrollAreaThumb />
                </ScrollAreaScrollbar>
              </ScrollAreaRoot>
            </Panel>
          </Group>
        </LoadingProvider>
      </EditorProvider>
    </ChatProvider>
  );
}
