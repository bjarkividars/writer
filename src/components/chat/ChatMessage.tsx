"use client";

import type { ReactNode } from "react";

type ChatMessageProps = {
  children: ReactNode;
};

export function ModelMessage({ children }: ChatMessageProps) {
  return (
    <div className="self-start max-w-[80%] text-sm text-foreground">
      {children}
    </div>
  );
}

export function UserMessage({ children }: ChatMessageProps) {
  return (
    <div className="self-end max-w-[80%] rounded-lg bg-background/85 px-3 py-2 text-sm text-foreground">
      {children}
    </div>
  );
}
