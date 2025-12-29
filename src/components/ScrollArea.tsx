"use client";

import { forwardRef } from "react";
import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";

const rootBaseClasses = "relative";
const topFadeClasses =
  "before:content-[''] before:block before:absolute before:left-0 before:right-0 before:top-0 before:h-6 before:pointer-events-none before:rounded-md before:transition-opacity before:duration-100 before:ease-out before:opacity-0 before:bg-[linear-gradient(to_bottom,var(--color-background),transparent)] before:z-10 data-[overflow-y-start]:before:opacity-100";
const bottomFadeClasses =
  "after:content-[''] after:block after:absolute after:left-0 after:right-0 after:bottom-0 after:h-6 after:pointer-events-none after:rounded-md after:transition-opacity after:duration-100 after:ease-out after:opacity-0 after:bg-[linear-gradient(to_top,var(--color-background),transparent)] after:z-10 data-[overflow-y-end]:after:opacity-100";
const viewportBaseClasses = "relative z-0 overflow-y-auto";

const scrollbarClasses =
  "flex justify-center rounded-full transition-opacity opacity-0 pointer-events-auto data-[orientation=vertical]:w-1 data-[orientation=horizontal]:h-1 data-[orientation=vertical]:m-2 data-[orientation=horizontal]:m-2 hover:opacity-100 data-[scrolling]:opacity-100 data-[scrolling]:duration-0";
const thumbClasses =
  "w-full rounded-full bg-foreground/25 hover:bg-foreground/40";

const mergeClasses = (...classes: Array<string | undefined>) =>
  classes.filter(Boolean).join(" ");

type RootProps = Omit<
  React.ComponentPropsWithoutRef<typeof BaseScrollArea.Root>,
  "className"
> & {
  className?: string;
  showTopFade?: boolean;
  showBottomFade?: boolean;
};

export const ScrollAreaRoot = forwardRef<
  React.ComponentRef<typeof BaseScrollArea.Root>,
  RootProps
>(
  (
    {
      className,
      showTopFade = true,
      showBottomFade = true,
      ...props
    },
    ref
  ) => (
    <BaseScrollArea.Root
      ref={ref}
      className={mergeClasses(
        rootBaseClasses,
        showTopFade ? topFadeClasses : undefined,
        showBottomFade ? bottomFadeClasses : undefined,
        className
      )}
      {...props}
    />
  )
);

ScrollAreaRoot.displayName = "ScrollAreaRoot";
type ContentProps = Omit<
  React.ComponentPropsWithoutRef<typeof BaseScrollArea.Content>,
  "className"
> & {
  className?: string;
};

export const ScrollAreaContent = forwardRef<
  React.ComponentRef<typeof BaseScrollArea.Content>,
  ContentProps
>(({ className, ...props }, ref) => (
  <BaseScrollArea.Content
    ref={ref}
    className={mergeClasses("h-full min-h-full w-full", className)}
    {...props}
  />
));

ScrollAreaContent.displayName = "ScrollAreaContent";

type ScrollbarProps = Omit<
  React.ComponentPropsWithoutRef<typeof BaseScrollArea.Scrollbar>,
  "className"
> & {
  className?: string;
};

type ThumbProps = Omit<
  React.ComponentPropsWithoutRef<typeof BaseScrollArea.Thumb>,
  "className"
> & {
  className?: string;
};

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
    className={mergeClasses(viewportBaseClasses, className)}
    {...props}
  />
));

ScrollAreaViewport.displayName = "ScrollAreaViewport";

export const ScrollAreaScrollbar = forwardRef<
  React.ComponentRef<typeof BaseScrollArea.Scrollbar>,
  ScrollbarProps
>(({ className, ...props }, ref) => (
  <BaseScrollArea.Scrollbar
    ref={ref}
    className={mergeClasses(scrollbarClasses, className)}
    {...props}
  />
));

ScrollAreaScrollbar.displayName = "ScrollAreaScrollbar";

export const ScrollAreaThumb = forwardRef<
  React.ComponentRef<typeof BaseScrollArea.Thumb>,
  ThumbProps
>(({ className, ...props }, ref) => (
  <BaseScrollArea.Thumb
    ref={ref}
    className={mergeClasses(thumbClasses, className)}
    {...props}
  />
));

ScrollAreaThumb.displayName = "ScrollAreaThumb";
