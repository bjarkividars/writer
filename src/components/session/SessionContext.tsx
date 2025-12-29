"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { createSession, generateSessionTitle } from "@/lib/api/client";
import { useSidebarContext } from "@/components/sidebar/SidebarContext";

type SessionSource = "url" | "created" | null;

type SessionContextValue = {
  sessionId: string | null;
  sessionSource: SessionSource;
  ensureSession: () => Promise<string>;
  setSessionId: (sessionId: string | null, source?: SessionSource) => void;
  title: string | null;
  setTitle: (title: string | null) => void;
  requestTitle: () => Promise<string | null>;
  isHydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

type SessionProviderProps = {
  children: ReactNode;
};

export function SessionProvider({ children }: SessionProviderProps) {
  const pathname = usePathname();
  const [sessionId, setSessionIdState] = useState<string | null>(null);
  const [sessionSource, setSessionSource] = useState<SessionSource>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [isHydrated, setHydrated] = useState(false);
  const createPromiseRef = useRef<Promise<string> | null>(null);
  const titlePromiseRef = useRef<Promise<string | null> | null>(null);
  const { refreshSessions } = useSidebarContext();

  // Extract sessionId from pathname
  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    const urlSessionId = segments.length > 0 ? segments[0] : null;

    if (urlSessionId && urlSessionId !== sessionId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSessionIdState(urlSessionId);
      setSessionSource("url");
    } else if (!urlSessionId && sessionId) {
      setSessionIdState(null);
      setSessionSource(null);
    }
  }, [pathname, sessionId]);

  const setSessionId = useCallback(
    (nextSessionId: string | null, source?: SessionSource) => {
      setSessionIdState(nextSessionId);
      setSessionSource(source ?? (nextSessionId ? "created" : null));
      setTitle(null);
      titlePromiseRef.current = null;
    },
    [setTitle]
  );

  const updateUrl = useCallback((nextSessionId: string) => {
    if (typeof window === "undefined") return;
    const pathname = window.location.pathname;
    if (pathname === "/" || pathname === "") {
      window.history.replaceState(null, "", `/${nextSessionId}`);
    }
  }, []);

  const ensureSession = useCallback(async () => {
    if (sessionId) {
      return sessionId;
    }

    if (createPromiseRef.current) {
      return createPromiseRef.current;
    }

    const promise = createSession()
      .then((response) => {
        setSessionId(response.sessionId, "created");
        updateUrl(response.sessionId);
        // Refresh sidebar to show new session
        refreshSessions();
        return response.sessionId;
      })
      .finally(() => {
        createPromiseRef.current = null;
      });

    createPromiseRef.current = promise;
    return promise;
  }, [sessionId, setSessionId, updateUrl, refreshSessions]);

  const requestTitle = useCallback(async () => {
    if (title) {
      return title;
    }

    if (titlePromiseRef.current) {
      return titlePromiseRef.current;
    }

    const promise = ensureSession()
      .then((sessionId) => generateSessionTitle(sessionId))
      .then((response) => {
        if (response.title) {
          setTitle(response.title);
          // Refresh sidebar to show updated title
          refreshSessions();
        }
        return response.title ?? null;
      })
      .finally(() => {
        titlePromiseRef.current = null;
      });

    titlePromiseRef.current = promise;
    return promise;
  }, [ensureSession, title, setTitle, refreshSessions]);

  const value = useMemo(
    () => ({
      sessionId,
      sessionSource,
      ensureSession,
      setSessionId,
      title,
      setTitle,
      requestTitle,
      isHydrated,
      setHydrated,
    }),
    [
      sessionId,
      sessionSource,
      ensureSession,
      setSessionId,
      title,
      setTitle,
      requestTitle,
      isHydrated,
      setHydrated,
    ]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessionContext must be used within SessionProvider");
  }
  return context;
}
