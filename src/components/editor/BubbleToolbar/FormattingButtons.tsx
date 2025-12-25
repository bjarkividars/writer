"use client";

import { Bold, Italic, Underline } from "lucide-react";
import { useEditorContext } from "@/components/editor/EditorContext";
import ToolbarButton from "@/components/editor/BubbleToolbar/ToolbarButton";

type FormattingButtonsProps = {
  className?: string;
};

export default function FormattingButtons({ className }: FormattingButtonsProps) {
  const { isBold, isItalic, isUnderline, toggleBold, toggleItalic, toggleUnderline } =
    useEditorContext();

  return (
    <div className={`flex items-center gap-0.5 ${className || ""}`}>
      <ToolbarButton
        label="Bold"
        icon={<Bold className="h-4 w-4" />}
        active={isBold}
        onClick={toggleBold}
      />
      <ToolbarButton
        label="Italic"
        icon={<Italic className="h-4 w-4" />}
        active={isItalic}
        onClick={toggleItalic}
      />
      <ToolbarButton
        label="Underline"
        icon={<Underline className="h-4 w-4" />}
        active={isUnderline}
        onClick={toggleUnderline}
      />
    </div>
  );
}

