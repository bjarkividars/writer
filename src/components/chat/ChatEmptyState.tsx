"use client";

export default function ChatEmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center text-center">
      <div className="flex max-w-sm flex-col items-center gap-2 px-6">
        <h2 className="text-lg font-semibold text-foreground">Ask for help</h2>
        <p className="text-sm text-muted-foreground">
          Get suggestions, edits, or explanations as you work.
        </p>
      </div>
    </div>
  );
}
