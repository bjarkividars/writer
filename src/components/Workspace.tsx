import TipTapEditor from "@/components/editor/TipTap/TipTapEditor";
import { Panel, Group, Separator } from "react-resizable-panels";
import Chat from "./chat/Chat";

export default function Workspace() {
  return (
    <Group orientation="horizontal" className="mx-0 flex h-full w-full">
      <Panel>
        <div className="h-full overflow-y-auto">
          <div className="mx-auto min-h-full w-full max-w-[8.5in]">
            <TipTapEditor />
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
  );
}
