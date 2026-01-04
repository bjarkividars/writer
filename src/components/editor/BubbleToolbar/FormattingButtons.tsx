"use client";

import { useLayoutEffect, useRef } from "react";
import { Bold, Italic, Underline, MoreVertical } from "lucide-react";
import { useEditorContext } from "@/components/editor/EditorContext";
import ToolbarButton from "@/components/editor/BubbleToolbar/ToolbarButton";
import TextFormat from "@/components/editor/BubbleToolbar/TextFormat";
import { Separator } from "@base-ui/react";
import { Button } from "@/components/Button";

type FormattingButtonsProps = {
  className?: string;
  isAiMode: boolean;
};

export default function FormattingButtons({
  className,
  isAiMode,
}: FormattingButtonsProps) {
  const { editor, activeMarks, exitAiMode } = useEditorContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const formatRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);

  const isBold = activeMarks.includes("bold");
  const isItalic = activeMarks.includes("italic");
  const isUnderline = activeMarks.includes("underline");

  // Measure both views and set CSS variables for animation
  useLayoutEffect(() => {
    const container = containerRef.current;
    const format = formatRef.current;
    const more = moreRef.current;
    if (!container || !format || !more) return;

    const updateWidths = () => {
      const formatWidth = format.scrollWidth;
      const moreWidth = more.offsetWidth;
      container.style.setProperty("--format-width", `${formatWidth}px`);
      container.style.setProperty("--more-width", `${moreWidth}px`);
    };

    updateWidths();

    const observer = new ResizeObserver(updateWidths);
    observer.observe(format);

    return () => observer.disconnect();
  }, []);

  if (!editor) return null;

  return (
    <div
      ref={containerRef}
      data-state={isAiMode ? "collapsed" : "open"}
      className={`relative overflow-hidden transition-[width] duration-200 ease-out w-(--format-width) data-[state=collapsed]:w-(--more-width) ${className || ""}`}
    >
      {/* Formatting buttons */}
      <div
        ref={formatRef}
        className="flex items-center gap-0.5 w-max transition-opacity duration-150 data-[hidden=true]:opacity-0 data-[hidden=true]:pointer-events-none"
        data-hidden={isAiMode}
      >
        <Separator
          orientation="vertical"
          className="h-4 w-px bg-border opacity-50"
        />
        <TextFormat editor={editor} />
        <ToolbarButton
          label="Bold"
          icon={<Bold className="h-4 w-4" />}
          active={isBold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="Italic"
          icon={<Italic className="h-4 w-4" />}
          active={isItalic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          label="Underline"
          icon={<Underline className="h-4 w-4" />}
          active={isUnderline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
      </div>

      {/* More button - stacked on top */}
      <div
        className="absolute inset-y-0 right-0 flex items-center transition-opacity duration-150 data-[hidden=true]:opacity-0 data-[hidden=true]:pointer-events-none"
        data-hidden={!isAiMode}
      >
        <Button
          ref={moreRef}
          type="button"
          onClick={() => exitAiMode()}
          onMouseDown={(e) => e.preventDefault()}
          className="btn-ghost btn-icon opacity-50 hover:opacity-100"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
