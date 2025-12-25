"use client";

import { forwardRef } from "react";
import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";

const fadeViewportClasses =
  "overflow-y-auto before:[--scroll-area-overflow-y-start:inherit] after:[--scroll-area-overflow-y-end:inherit] before:content-[''] after:content-[''] before:block after:block before:absolute after:absolute before:left-0 after:left-0 before:w-full after:w-full before:pointer-events-none after:pointer-events-none before:rounded-md after:rounded-md before:transition-[height] after:transition-[height] before:duration-100 after:duration-100 before:ease-out after:ease-out before:top-0 after:bottom-0 before:bg-[linear-gradient(to_bottom,hsl(var(--bg)),transparent)] after:bg-[linear-gradient(to_top,hsl(var(--bg)),transparent)] before:[height:min(24px,var(--scroll-area-overflow-y-start))] after:[height:min(24px,var(--scroll-area-overflow-y-end,24px))]";

const mergeClasses = (...classes: Array<string | undefined>) =>
  classes.filter(Boolean).join(" ");

export const ScrollAreaRoot = BaseScrollArea.Root;
export const ScrollAreaContent = BaseScrollArea.Content;
export const ScrollAreaScrollbar = BaseScrollArea.Scrollbar;
export const ScrollAreaThumb = BaseScrollArea.Thumb;

type ViewportProps = Omit<
  React.ComponentPropsWithoutRef<typeof BaseScrollArea.Viewport>,
  "className"
> & {
  className?: string;
};

export const ScrollAreaViewport = forwardRef<
  React.ComponentRef<typeof BaseScrollArea.Viewport>,
  ViewportProps
>(({ className, ...props }, ref) => (
  <BaseScrollArea.Viewport
    ref={ref}
    className={mergeClasses(fadeViewportClasses, className)}
    {...props}
  />
));

ScrollAreaViewport.displayName = "ScrollAreaViewport";
