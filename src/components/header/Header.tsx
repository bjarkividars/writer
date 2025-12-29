"use client";

import { useState, useRef, useEffect } from "react";
import { useSessionContext } from "@/components/session/SessionContext";
import { renameSession } from "@/lib/api/client";
import { Download } from "lucide-react";
import { Tooltip } from "@base-ui/react";

export default function Header() {
  const { sessionId, title, setTitle } = useSessionContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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
        await renameSession(sessionId, trimmed);
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

  // Only show header when there's a saved session
  if (!sessionId) return null;

  return (
    <header className="h-14 flex items-center justify-between pr-6 pl-[calc(var(--doc-content-left)+var(--doc-inline-padding))] shrink-0">
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

      <button className="btn-secondary btn-sm flex items-center gap-2" disabled>
        <Download className="w-4 h-4" />
        Export
      </button>
    </header>
  );
}
