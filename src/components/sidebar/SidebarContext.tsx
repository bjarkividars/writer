"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getSessions } from "@/lib/api/client";
import type { SessionSummary } from "@/lib/api/contracts";

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
  const [isOpen, setIsOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await getSessions();
      setSessions(data.sessions);
    } catch (error) {
      console.error("[sidebar] Failed to load sessions", error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const hasSessions = sessions.length > 0;

  // Initialize from localStorage and check screen size
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const isMobile = window.matchMedia("(max-width: 1023px)").matches;

    if (stored !== null) {
      setIsOpen(stored === "true");
    } else {
      // Default: open on desktop, closed on mobile
      setIsOpen(!isMobile);
    }

    setMounted(true);
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
      setIsOpen(false);
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

  const refreshSessions = useCallback(async () => {
    await fetchSessions();
  }, [fetchSessions]);

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
