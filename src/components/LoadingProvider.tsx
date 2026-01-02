"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useSessionContext } from "./session/SessionContext";

type LoadingContextValue = {
  isInitialLoading: boolean;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const { isHydrated, isSwitchingSession, sessionSource } = useSessionContext();

  // Initial loading is done when:
  // 1. Session has been hydrated (or no session to hydrate)
  const isSessionHydrating = sessionSource === "url" && !isHydrated;
  const isInitialLoading =
    isSessionHydrating || (sessionSource === "url" && isSwitchingSession);

  const value = {
    isInitialLoading,
  };

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
}

export function useLoadingContext() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoadingContext must be used within LoadingProvider");
  }
  return context;
}
