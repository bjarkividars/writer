"use client";

import { ChevronDown } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { Menu } from "@base-ui/react";
import { useEditorContext } from "@/components/editor/EditorContext";
import { Button } from "@/components/Button";

type TextFormatValue =
  | "paragraph"
  | "heading-1"
  | "heading-2"
  | "heading-3"
  | "bullet-list"
  | "ordered-list";

type TextFormatOption = {
  value: TextFormatValue;
  label: string;
  section: "text" | "list";
};

type TextFormatProps = {
  editor: Editor;
};

const formatOptions: TextFormatOption[] = [
  { value: "paragraph", label: "Text", section: "text" },
  { value: "heading-1", label: "Heading 1", section: "text" },
  { value: "heading-2", label: "Heading 2", section: "text" },
  { value: "heading-3", label: "Heading 3", section: "text" },
  { value: "bullet-list", label: "Bulleted list", section: "list" },
  { value: "ordered-list", label: "Numbered list", section: "list" },
];

const formatLabels: Record<TextFormatValue, string> = {
  paragraph: "Text",
  "heading-1": "Heading 1",
  "heading-2": "Heading 2",
  "heading-3": "Heading 3",
  "bullet-list": "Bulleted list",
  "ordered-list": "Numbered list",
};

export default function TextFormat({ editor }: TextFormatProps) {
  const { textFormat } = useEditorContext();
  const currentLabel = formatLabels[textFormat] ?? "Text";

  const applyFormat = (value: TextFormatValue) => {
    // Important: chain() is immutable until .run()
    const chain = editor.chain().focus();

    switch (value) {
      case "paragraph":
        chain.setParagraph().run();
        break;
      case "heading-1":
        chain.setHeading({ level: 1 }).run();
        break;
      case "heading-2":
        chain.setHeading({ level: 2 }).run();
        break;
      case "heading-3":
        chain.setHeading({ level: 3 }).run();
        break;
      case "bullet-list":
        chain.toggleBulletList().run();
        break;
      case "ordered-list":
        chain.toggleOrderedList().run();
        break;
      default:
        break;
    }
  };

  return (
    <Menu.Root>
      <Menu.Trigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            onMouseDown={(event) => {
              // Prevent collapsing the editor selection
              event.preventDefault();
              props.onMouseDown?.(event);
            }}
            className="flex h-7 items-center gap-1 rounded px-2 text-xs font-medium text-foreground/70 transition-colors hover:bg-hover hover:text-foreground data-pressed:bg-hover data-pressed:text-foreground cursor-pointer"
          >
            <span className="max-w-36 truncate">{currentLabel}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        )}
      />

      <Menu.Portal>
        <Menu.Positioner side="bottom" align="start" sideOffset={6}>
          <Menu.Popup className="min-w-44 rounded-md border border-border bg-background p-1 shadow-sm">
            <Menu.RadioGroup value={textFormat} onValueChange={applyFormat}>
              {formatOptions.map((option, index) => {
                const showSeparator =
                  index > 0 &&
                  option.section !== formatOptions[index - 1].section;

                return (
                  <div key={option.value}>
                    {showSeparator && (
                      <Menu.Separator className="my-1 h-px bg-border" />
                    )}

                    <Menu.RadioItem
                      value={option.value}
                      onMouseDown={(event) => {
                        event.preventDefault();
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-foreground outline-none hover:bg-hover data-highlighted:bg-hover data-checked:font-medium cursor-pointer"
                    >

                      <span className="flex-1">{option.label}</span>
                    </Menu.RadioItem>
                  </div>
                );
              })}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
