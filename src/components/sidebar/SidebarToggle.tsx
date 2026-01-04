"use client";

import { useEffect, useRef, useState } from "react";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { useSidebarContext } from "./SidebarContext";
import {
  useOnboardingTip,
  useOnboardingTips,
} from "@/components/onboarding/OnboardingContext";
import { useSessionContext } from "@/components/session/SessionContext";
import { Button } from "@/components/Button";

export default function SidebarToggle() {
  const { isOpen, open, close, hasSessions } = useSidebarContext();
  const { sessionId } = useSessionContext();
  const { trackEvent } = useOnboardingTips();
  const { tip, isActive, dismiss, hasShown } = useOnboardingTip(
    "sidebar-manage-docs"
  );
  const showTip = isActive;
  const [isHovered, setIsHovered] = useState(false);
  const tipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverDelayMs = 600;

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

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

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

  const tooltipContent = showTip ? (
    <div className="max-w-[220px]">
      <div className="mt-1 text-background/90">{tip.body}</div>
      <Button
        type="button"
        onClick={dismiss}
        className="mt-2 inline-flex items-center text-[11px] font-semibold text-background/80 hover:text-background"
      >
        {tip.cta}
      </Button>
    </div>
  ) : (
    (isOpen ? "Close sidebar" : "Open sidebar")
  );

  const tooltipOpen = showTip || isHovered;
  const tooltipPaddingClass = showTip ? "px-3 py-2" : undefined;

  const handlePointerEnter = () => {
    if (showTip) return;
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    hoverTimerRef.current = setTimeout(() => {
      setIsHovered(true);
    }, hoverDelayMs);
  };

  const handlePointerLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setIsHovered(false);
  };

  return (
    <Button
      tooltipOpen={tooltipOpen}
      tooltip={tooltipContent}
      tooltipSide="bottom"
      tooltipAlign="center"
      tooltipSideOffset={4}
      tooltipClassName={tooltipPaddingClass}
      onClick={handleToggle}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
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
    </Button>
  );
}
