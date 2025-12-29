"use client";

type LoadingOverlayProps = {
  show: boolean;
};

export default function LoadingOverlay({ show }: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <img src="/pencil.gif" alt="" className="w-16 h-16" />
        <p className="text-sm text-foreground-muted">Setting up your workspace</p>
      </div>
    </div>
  );
}
