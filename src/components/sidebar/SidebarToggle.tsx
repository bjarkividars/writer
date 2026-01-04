"use client";

import { useEffect, useRef } from "react";
import { Tooltip } from "@base-ui/react";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { useSidebarContext } from "./SidebarContext";
import {
  useOnboardingTip,
  useOnboardingTips,
} from "@/components/onboarding/OnboardingContext";
import { useSessionContext } from "@/components/session/SessionContext";

export default function SidebarToggle() {
  const { isOpen, open, close, hasSessions } = useSidebarContext();
  const { sessionId } = useSessionContext();
  const { trackEvent } = useOnboardingTips();
  const { tip, isActive, dismiss, hasShown } = useOnboardingTip(
    "sidebar-manage-docs"
  );
  const showTip = isActive;
  const tipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!sessionId || hasShown || isActive) return;
    if (tipTimerRef.current) {
      clearTimeout(tipTimerRef.current);
    }
    tipTimerRef.current = setTimeout(() => {
      trackEvent("session-first-save");
    }, 2500);

    return () => {
      if (tipTimerRef.current) {
        clearTimeout(tipTimerRef.current);
      }
    };
  }, [sessionId, hasShown, isActive, trackEvent]);

  useEffect(() => {
    if (showTip && isOpen) {
      dismiss();
    }
  }, [showTip, isOpen, dismiss]);

  // Don't show toggle if no sessions
  if (!hasSessions && !showTip) {
    return null;
  }

  const handleToggle = () => {
    if (showTip) {
      dismiss();
    }
    if (isOpen) {
      close();
    } else {
      open();
    }
  };

  return (
    <Tooltip.Root open={showTip} onOpenChange={() => {}}>
      <Tooltip.Trigger
        render={(props) => (
          <button
            {...props}
            onClick={(event) => {
              handleToggle();
              props.onClick?.(event);
            }}
            className={`
              cursor-pointer fixed top-[15px] left-[244px] z-51 h-7 w-7 flex items-center justify-center rounded
              bg-background text-foreground-muted hover:text-foreground hover:bg-hover
              border transition-all duration-200
              ${isOpen ? "border-border" : "border-transparent"}
            `}
            style={{
              transform: isOpen ? "translateX(0)" : "translateX(-236px)",
            }}
            aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isOpen ? (
              <PanelLeftClose className="w-3.5 h-3.5" />
            ) : (
              <PanelLeft className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      />
      <Tooltip.Portal>
        <Tooltip.Positioner side="bottom" align="center" sideOffset={8}>
          <Tooltip.Popup className="max-w-[220px] rounded bg-foreground px-3 py-2 text-xs font-medium text-background shadow-md">
            <div className="mt-1 text-background/90">{tip.body}</div>
            <button
              onClick={dismiss}
              className="mt-2 inline-flex items-center text-[11px] font-semibold text-background/80 hover:text-background"
            >
              {tip.cta}
            </button>
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
