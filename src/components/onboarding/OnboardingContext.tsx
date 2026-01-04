"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type OnboardingEvent,
  type OnboardingTipId,
  getOnboardingTip,
  getTipsForEvent,
  isOnboardingTipId,
} from "./onboardingTips";

type OnboardingContextValue = {
  activeTip: OnboardingTipId | null;
  shownTips: OnboardingTipId[];
  pendingTips: OnboardingTipId[];
  hasShownTip: (tip: OnboardingTipId) => boolean;
  trackEvent: (event: OnboardingEvent) => void;
  dismissTip: (tip: OnboardingTipId) => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

const SHOWN_TIPS_KEY = "writer_onboarding_shown_tips";
const ACTIVE_TIP_KEY = "writer_onboarding_active_tip";

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [shownTips, setShownTips] = useState<OnboardingTipId[]>([]);
  const [activeTip, setActiveTip] = useState<OnboardingTipId | null>(null);
  const [pendingTips, setPendingTips] = useState<OnboardingTipId[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedShown = localStorage.getItem(SHOWN_TIPS_KEY);
    if (storedShown) {
      try {
        const parsed = JSON.parse(storedShown) as string[];
        setTimeout(() => {
          setShownTips(parsed.filter(isOnboardingTipId));
        }, 0);
      } catch (error) {
        console.error("[onboarding] Failed to parse shown tips", error);
      }
    }

    const storedActive = localStorage.getItem(ACTIVE_TIP_KEY);
    if (storedActive && isOnboardingTipId(storedActive)) {
      setTimeout(() => {
        setActiveTip(storedActive);
      }, 0);
    }

    setTimeout(() => {
      setMounted(true);
    }, 0);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(SHOWN_TIPS_KEY, JSON.stringify(shownTips));
  }, [shownTips, mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (activeTip) {
      localStorage.setItem(ACTIVE_TIP_KEY, activeTip);
      return;
    }
    localStorage.removeItem(ACTIVE_TIP_KEY);
  }, [activeTip, mounted]);

  useEffect(() => {
    if (activeTip && shownTips.includes(activeTip)) {
      setTimeout(() => {
        setActiveTip(null);
      }, 0);
    }
  }, [activeTip, shownTips]);

  const hasShownTip = useCallback(
    (tip: OnboardingTipId) => shownTips.includes(tip),
    [shownTips]
  );

  const enqueueTip = useCallback(
    (tip: OnboardingTipId) => {
      if (shownTips.includes(tip)) return;
      setPendingTips((prev) => (prev.includes(tip) ? prev : [...prev, tip]));
    },
    [shownTips]
  );

  const trackEvent = useCallback(
    (event: OnboardingEvent) => {
      const tipsToShow = getTipsForEvent(event).map((tip) => tip.id);
      const nextTip = tipsToShow.find((tip) => !shownTips.includes(tip));
      if (!nextTip) return;

      if (activeTip) {
        enqueueTip(nextTip);
        return;
      }

      setActiveTip(nextTip);
    },
    [activeTip, enqueueTip, shownTips]
  );

  const dismissTip = useCallback((tip: OnboardingTipId) => {
    setActiveTip((current) => (current === tip ? null : current));
    setPendingTips((prev) => prev.filter((entry) => entry !== tip));
    setShownTips((prev) => (prev.includes(tip) ? prev : [...prev, tip]));
  }, []);

  useEffect(() => {
    if (activeTip || pendingTips.length === 0) return;
    setTimeout(() => {
      setActiveTip(pendingTips[0]);
    }, 0);
    setTimeout(() => {
      setPendingTips((prev) => prev.slice(1));
    }, 0);
  }, [activeTip, pendingTips]);

  const value = useMemo(
    () => ({
      activeTip,
      shownTips,
      pendingTips,
      hasShownTip,
      trackEvent,
      dismissTip,
    }),
    [activeTip, shownTips, pendingTips, hasShownTip, trackEvent, dismissTip]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingTips() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboardingTips must be used within OnboardingProvider");
  }
  return context;
}

export function useOnboardingTip(tipId: OnboardingTipId) {
  const { activeTip, dismissTip, hasShownTip } = useOnboardingTips();

  return {
    tip: getOnboardingTip(tipId),
    isActive: activeTip === tipId,
    hasShown: hasShownTip(tipId),
    dismiss: () => dismissTip(tipId),
  };
}
