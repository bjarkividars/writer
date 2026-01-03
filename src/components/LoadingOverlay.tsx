"use client";

type LoadingOverlayProps = {
  show: boolean;
  position?: "fixed" | "absolute";
  className?: string;
};

export default function LoadingOverlay({
  show,
  position = "fixed",
  className,
}: LoadingOverlayProps) {
  if (!show) return null;

  const positionClass = position === "absolute" ? "absolute" : "fixed";

  return (
    <div
      className={[
        positionClass,
        "inset-0 bg-background z-100 flex items-center justify-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-col items-center gap-4">
        <img src="/pencil.gif" alt="" className="w-16 h-16 dark:invert dark:brightness-82 dark:contrast-125" />
        <p className="text-sm text-foreground-muted">
          Setting up your workspace
        </p>
      </div>
    </div>
  );
}
