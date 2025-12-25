import Editor from "@/components/Editor";
import { Panel, Group, Separator } from "react-resizable-panels";

export default function Workspace() {
  return (
    <Group
      orientation="horizontal"
      className="mx-auto flex h-full w-full max-w-6xl"
    >
      <Panel>
        <div className="h-full overflow-y-auto">
          <div className="mx-auto min-h-full w-full max-w-[8.5in]">
            <Editor />
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
        <div className="h-full overflow-y-auto bg-muted" />
      </Panel>
    </Group>
  );
}
