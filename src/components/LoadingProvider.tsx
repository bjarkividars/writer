"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useSidebarContext } from "./sidebar/SidebarContext";
import { useSessionContext } from "./session/SessionContext";
import LoadingOverlay from "./LoadingOverlay";

type LoadingContextValue = {
  isInitialLoading: boolean;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const { loading: sidebarLoading } = useSidebarContext();
  const { isHydrated } = useSessionContext();

  // Initial loading is done when:
  // 1. Sidebar has loaded
  // 2. Session has been hydrated (or no session to hydrate)
  const isInitialLoading = sidebarLoading || !isHydrated;

  const value = {
    isInitialLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      <LoadingOverlay show={isInitialLoading} />
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoadingContext() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoadingContext must be used within LoadingProvider");
  }
  return context;
}
