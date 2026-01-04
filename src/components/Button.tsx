"use client";

import { forwardRef } from "react";
import { Button as BaseButton, Tooltip } from "@base-ui/react";

type TooltipPositionerProps = React.ComponentPropsWithoutRef<
  typeof Tooltip.Positioner
>;

export type ButtonProps = React.ComponentPropsWithoutRef<typeof BaseButton> & {
  tooltip?: React.ReactNode;
  tooltipSide?: TooltipPositionerProps["side"];
  tooltipAlign?: TooltipPositionerProps["align"];
  tooltipSideOffset?: TooltipPositionerProps["sideOffset"];
  tooltipClassName?: string;
  tooltipOpen?: boolean;
  onTooltipOpenChange?: (open: boolean) => void;
};

const defaultTooltipClassName =
  "rounded bg-foreground px-2 py-1 text-xs font-medium text-background shadow-md";

const composeEventHandlers =
  <E,>(
    handler: ((event: E) => void) | undefined,
    triggerHandler: ((event: E) => void) | undefined
  ) =>
  (event: E) => {
    triggerHandler?.(event);
    handler?.(event);
  };

const mergeRefs =
  <T,>(...refs: Array<React.Ref<T> | undefined>) =>
  (node: T | null) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === "function") {
        ref(node);
      } else {
        (ref as React.MutableRefObject<T | null>).current = node;
      }
    });
  };

export const Button = forwardRef<
  React.ComponentRef<typeof BaseButton>,
  ButtonProps
>(
  (
    {
      tooltip,
      tooltipSide = "top",
      tooltipAlign = "center",
      tooltipSideOffset = 6,
      tooltipClassName,
      tooltipOpen,
      onTooltipOpenChange,
      ...props
    },
    ref
  ) => {
    const { ref: propsRef, ...restProps } =
      props as React.ComponentPropsWithoutRef<"button"> & {
        ref?: React.Ref<HTMLButtonElement>;
      };

    if (!tooltip) {
      return <BaseButton ref={mergeRefs(ref, propsRef)} {...restProps} />;
    }

    const tooltipRootProps: React.ComponentPropsWithoutRef<typeof Tooltip.Root> =
      {};
    if (tooltipOpen !== undefined) {
      tooltipRootProps.open = tooltipOpen;
    }
    if (onTooltipOpenChange) {
      tooltipRootProps.onOpenChange = onTooltipOpenChange;
    }

    return (
      <Tooltip.Root {...tooltipRootProps}>
        <Tooltip.Trigger
          render={(triggerProps) => {
            const { ref: triggerRef, ...restTriggerProps } =
              triggerProps as React.ComponentPropsWithoutRef<"button"> & {
                ref?: React.Ref<HTMLButtonElement>;
              };
            const mergedProps = {
              ...restTriggerProps,
              ...restProps,
              onClick: composeEventHandlers(
                restProps.onClick,
                restTriggerProps.onClick
              ),
              onMouseDown: composeEventHandlers(
                restProps.onMouseDown,
                restTriggerProps.onMouseDown
              ),
              onMouseUp: composeEventHandlers(
                restProps.onMouseUp,
                restTriggerProps.onMouseUp
              ),
              onPointerDown: composeEventHandlers(
                restProps.onPointerDown,
                restTriggerProps.onPointerDown
              ),
              onPointerUp: composeEventHandlers(
                restProps.onPointerUp,
                restTriggerProps.onPointerUp
              ),
              onPointerOver: composeEventHandlers(
                restProps.onPointerOver,
                restTriggerProps.onPointerOver
              ),
              onPointerOut: composeEventHandlers(
                restProps.onPointerOut,
                restTriggerProps.onPointerOut
              ),
              onPointerCancel: composeEventHandlers(
                restProps.onPointerCancel,
                restTriggerProps.onPointerCancel
              ),
              onPointerMove: composeEventHandlers(
                restProps.onPointerMove,
                restTriggerProps.onPointerMove
              ),
              onPointerEnter: composeEventHandlers(
                restProps.onPointerEnter,
                restTriggerProps.onPointerEnter
              ),
              onPointerLeave: composeEventHandlers(
                restProps.onPointerLeave,
                restTriggerProps.onPointerLeave
              ),
              onMouseEnter: composeEventHandlers(
                restProps.onMouseEnter,
                restTriggerProps.onMouseEnter
              ),
              onMouseLeave: composeEventHandlers(
                restProps.onMouseLeave,
                restTriggerProps.onMouseLeave
              ),
              onMouseMove: composeEventHandlers(
                restProps.onMouseMove,
                restTriggerProps.onMouseMove
              ),
              onTouchStart: composeEventHandlers(
                restProps.onTouchStart,
                restTriggerProps.onTouchStart
              ),
              onTouchEnd: composeEventHandlers(
                restProps.onTouchEnd,
                restTriggerProps.onTouchEnd
              ),
              onFocus: composeEventHandlers(
                restProps.onFocus,
                restTriggerProps.onFocus
              ),
              onBlur: composeEventHandlers(
                restProps.onBlur,
                restTriggerProps.onBlur
              ),
              onKeyDown: composeEventHandlers(
                restProps.onKeyDown,
                restTriggerProps.onKeyDown
              ),
              onKeyUp: composeEventHandlers(
                restProps.onKeyUp,
                restTriggerProps.onKeyUp
              ),
            };

            return (
              <BaseButton
                {...mergedProps}
                ref={mergeRefs(ref, triggerRef, propsRef)}
              />
            );
          }}
        />
        <Tooltip.Portal>
          <Tooltip.Positioner
            side={tooltipSide}
            align={tooltipAlign}
            sideOffset={tooltipSideOffset}
          >
            <Tooltip.Popup
              className={`${defaultTooltipClassName} ${tooltipClassName || ""}`}
            >
              {tooltip}
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    );
  }
);

Button.displayName = "Button";
