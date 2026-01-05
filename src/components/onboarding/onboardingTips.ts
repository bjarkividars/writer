"use client";

export type OnboardingTipId =
  | "sidebar-manage-docs"
  | "chat-shortcut-back-to-doc";

export type OnboardingEvent = "session-first-save" | "chat-shortcut-used";

export type OnboardingTipConfig = {
  id: OnboardingTipId;
  event: OnboardingEvent;
  body: string;
  cta: string;
};

export const onboardingTips: OnboardingTipConfig[] = [
  {
    id: "sidebar-manage-docs",
    event: "session-first-save",
    body: "Open the sidebar to manage or create documents anytime.",
    cta: "Got it",
  },
  {
    id: "chat-shortcut-back-to-doc",
    event: "chat-shortcut-used",
    body: "Use {{shortcut}} again to jump back to the document.",
    cta: "Got it",
  },
];

const tipById = onboardingTips.reduce<Record<OnboardingTipId, OnboardingTipConfig>>(
  (accumulator, tip) => {
    accumulator[tip.id] = tip;
    return accumulator;
  },
  {} as Record<OnboardingTipId, OnboardingTipConfig>
);

export const isOnboardingTipId = (value: string): value is OnboardingTipId =>
  value in tipById;

export const getOnboardingTip = (id: OnboardingTipId): OnboardingTipConfig =>
  tipById[id];

export const getTipsForEvent = (event: OnboardingEvent) =>
  onboardingTips.filter((tip) => tip.event === event);
