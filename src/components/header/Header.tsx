"use client";

import { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import { useSessionContext } from "@/components/session/SessionContext";
import { useEditorContext } from "@/components/editor/EditorContext";
import { useUpdateSessionMutation } from "@/hooks/orpc/useSessionMutations";
import { Download, ChevronDown, FileDown, Clipboard } from "lucide-react";
import { Menu, Tooltip } from "@base-ui/react";
import { tiptapToMarkdown } from "@/lib/editor/markdown";

export default function Header() {
  const { sessionId, title, setTitle } = useSessionContext();
  const { editor, isEditorEmpty } = useEditorContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const renameMutation = useUpdateSessionMutation();

  const displayTitle = title || "Untitled";

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditValue(title || "");
    setIsEditing(true);
  };

  const handleSave = async () => {
    const trimmed = editValue.trim();
    if (!trimmed || !sessionId) {
      setIsEditing(false);
      return;
    }

    if (trimmed !== title) {
      try {
        await renameMutation.mutateAsync({
          sessionId,
          title: trimmed,
        });
        setTitle(trimmed);
      } catch (error) {
        console.error("Failed to rename session", error);
      }
    }

    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  const show = sessionId !== null;
  const canExport = !!editor && !isEditorEmpty;

  const getExportMarkdown = () => {
    if (!editor) return "";
    return tiptapToMarkdown(editor.getJSON());
  };

  const getExportFilename = (extension: string) => {
    const base = (title ?? "document").trim() || "document";
    const safe = base
      .replace(/[^a-z0-9-_]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
    return `${safe || "document"}.${extension}`;
  };

  const handleCopyMarkdown = async () => {
    const markdown = getExportMarkdown();
    if (!markdown.trim()) return;

    await navigator.clipboard.writeText(markdown);
  };

  const handleDownloadPdf = () => {
    const markdown = getExportMarkdown();
    if (!markdown.trim()) return;

    const doc = new jsPDF({
      unit: "pt",
      format: "letter",
    });
    const margin = 48;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = pageWidth - margin * 2;
    const lineHeight = 16;
    const lines = doc.splitTextToSize(markdown, maxWidth);

    let y = margin;
    lines.forEach((line: string) => {
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    });

    doc.save(getExportFilename("pdf"));
  };

  return (
    <header
      className={`h-14 flex items-center justify-between pr-6 pl-[calc(var(--doc-content-left)+var(--doc-inline-padding))] shrink-0 ${show ? "opacity-100" : "opacity-0"} transition-opacity duration-200`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="text-lg font-medium text-foreground bg-transparent outline-none px-1 -mx-1 min-w-0 flex-1"
            placeholder="Untitled"
          />
        ) : (
          <Tooltip.Root>
            <Tooltip.Trigger
              render={(props) => (
                <button
                  {...props}
                  onClick={(e) => {
                    handleStartEdit();
                    props.onClick?.(e);
                  }}
                  className="text-lg font-medium text-foreground hover:text-foreground/80 transition-colors text-left truncate cursor-pointer"
                  disabled={!sessionId}
                >
                  {displayTitle}
                </button>
              )}
            />
            <Tooltip.Portal>
              <Tooltip.Positioner sideOffset={4}>
                <Tooltip.Popup className="rounded bg-foreground px-2 py-1 text-xs font-medium text-background shadow-md">
                  Click to edit
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        )}
      </div>

      <Menu.Root>
        <Menu.Trigger
          render={(props) => (
            <button
              {...props}
              className="btn-secondary btn-sm flex items-center gap-2"
              disabled={!canExport}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
        />
        <Menu.Portal>
          <Menu.Positioner side="bottom" align="end" sideOffset={6}>
            <Menu.Popup className="min-w-44 rounded-md border border-border bg-background p-1 shadow-sm">
              <Menu.Item
                onClick={handleDownloadPdf}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-foreground outline-none hover:bg-hover data-highlighted:bg-hover cursor-pointer data-disabled:cursor-default data-disabled:opacity-50"
                disabled={!canExport}
              >
                <FileDown className="h-4 w-4" />
                Download PDF
              </Menu.Item>
              <Menu.Item
                onClick={() => {
                  handleCopyMarkdown().catch((error) => {
                    console.error("Failed to copy markdown", error);
                  });
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-foreground outline-none hover:bg-hover data-highlighted:bg-hover cursor-pointer data-disabled:cursor-default data-disabled:opacity-50"
                disabled={!canExport}
              >
                <Clipboard className="h-4 w-4" />
                Copy Markdown
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </header>
  );
}
