"use client";

import TipTapEditor from "@/components/editor/TipTap/TipTapEditor";
import { Panel, Group, Separator } from "react-resizable-panels";
import Chat from "./chat/Chat";
import { useEditor } from "@tiptap/react";
import { useRef } from "react";
import { editorExtensions } from "@/editor/extensions";
import { EditorProvider } from "@/components/editor/EditorContext";
import { ChatProvider } from "@/components/chat/ChatContext";

export default function Workspace() {
  const editorRootRef = useRef<HTMLDivElement>(null);
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

  return (
    <ChatProvider>
      <EditorProvider editor={editor} editorRootRef={editorRootRef}>
        <Group orientation="horizontal" className="mx-0 flex h-full w-full">
          <Panel>
            <div className="h-full overflow-y-auto">
              <div className="mx-auto min-h-full w-full max-w-[8.5in]">
                <TipTapEditor editor={editor} editorRootRef={editorRootRef} />
              </div>
            </div>
          </Panel>

          <Separator />

          <Panel
            defaultSize="30%"
            minSize="15%"
            maxSize="45%"
            collapsible
            collapsedSize="0%"
          >
            <div className="h-full relative overflow-y-auto bg-muted">
              <Chat />
            </div>
          </Panel>
        </Group>
      </EditorProvider>
    </ChatProvider>
  );
}
