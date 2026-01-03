"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { SessionSummary } from "@/lib/orpc/types";
import { useRefreshSessions, useSessionsQuery } from "@/hooks/orpc/useSessions";

type SidebarContextValue = {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  sessions: SessionSummary[];
  loading: boolean;
  hasSessions: boolean;
  refreshSessions: () => Promise<void>;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = "writer_sidebar_open";

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sessionsQuery = useSessionsQuery();
  const refreshSessions = useRefreshSessions();
  const sessions: SessionSummary[] = sessionsQuery.data?.sessions ?? [];
  const loading = sessionsQuery.isLoading;

  useEffect(() => {
    if (sessionsQuery.error) {
      console.error("[sidebar] Failed to load sessions", sessionsQuery.error);
    }
  }, [sessionsQuery.error]);

  const hasSessions = sessions.length > 0;

  // Initialize from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored !== null) {
      setTimeout(() => {
        setIsOpen(stored === "true");
      }, 0);
    } else {
      setTimeout(() => {
        setIsOpen(false);
      }, 0);
    }

    setTimeout(() => {
      setMounted(true);
    }, 0);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, String(isOpen));
    }
  }, [isOpen, mounted]);

  // Close sidebar if no sessions
  useEffect(() => {
    if (!loading && !hasSessions) {
      setTimeout(() => {
        setIsOpen(false);
      }, 0);
    }
  }, [loading, hasSessions]);

  const toggle = useCallback(() => {
    // Don't allow opening if no sessions
    setIsOpen((prev) => {
      if (!prev && !hasSessions) return false;
      return !prev;
    });
  }, [hasSessions]);

  const open = useCallback(() => {
    // Don't allow opening if no sessions
    if (hasSessions) {
      setIsOpen(true);
    }
  }, [hasSessions]);

  const close = useCallback(() => setIsOpen(false), []);

  const value = {
    isOpen,
    toggle,
    open,
    close,
    sessions,
    loading,
    hasSessions,
    refreshSessions,
  };

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within SidebarProvider");
  }
  return context;
}
