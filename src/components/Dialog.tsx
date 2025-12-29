"use client";

import { forwardRef } from "react";
import { Dialog as BaseDialog } from "@base-ui/react";

export const DialogRoot = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogTitle = BaseDialog.Title;
export const DialogDescription = BaseDialog.Description;
export const DialogClose = BaseDialog.Close;
export const DialogPortal = BaseDialog.Portal;

export const DialogBackdrop = forwardRef<
  React.ComponentRef<typeof BaseDialog.Backdrop>,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Backdrop>
>((props, ref) => (
  <BaseDialog.Backdrop
    ref={ref}
    className="fixed inset-0 bg-black/50 transition-all duration-150 data-state-ending:opacity-0 data-state-starting:opacity-0"
    {...props}
  />
));

DialogBackdrop.displayName = "DialogBackdrop";

type DialogPopupProps = Omit<
  React.ComponentPropsWithoutRef<typeof BaseDialog.Popup>,
  "className"
> & {
  className?: string;
};

export const DialogPopup = forwardRef<
  React.ComponentRef<typeof BaseDialog.Popup>,
  DialogPopupProps
>(({ className, ...props }, ref) => (
  <BaseDialog.Popup
    ref={ref}
    className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background border border-border rounded-lg shadow-lg p-6 transition-all duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 ${className || ""}`}
    {...props}
  />
));

DialogPopup.displayName = "DialogPopup";
