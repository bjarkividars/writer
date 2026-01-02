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
import { useSidebarContext } from "@/components/sidebar/SidebarContext";
import {
  useCreateSessionMutation,
  useGenerateTitleMutation,
} from "@/hooks/orpc/useSessionMutations";

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
  isSwitchingSession: boolean;
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
  const pendingUrlSessionIdRef = useRef<string | null>(null);
  const { refreshSessions } = useSidebarContext();
  const createSessionMutation = useCreateSessionMutation();
  const generateTitleMutation = useGenerateTitleMutation();
  const urlSessionId = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    return segments.length > 0 ? segments[0] : null;
  }, [pathname]);
  const isSwitchingSession = !!urlSessionId && urlSessionId !== sessionId;

  const setSessionId = useCallback(
    (nextSessionId: string | null, source?: SessionSource) => {
      const nextSource = source ?? (nextSessionId ? "created" : null);
      setSessionIdState(nextSessionId);
      setSessionSource(nextSource);
      setTitle(null);
      titlePromiseRef.current = null;
      setHydrated(nextSessionId && nextSource === "url" ? false : true);
    },
    [setTitle, setHydrated]
  );

  // Extract sessionId from pathname
  useEffect(() => {
    const hasPendingUrlSync = pendingUrlSessionIdRef.current !== null;
    if (sessionSource === "created" && hasPendingUrlSync) {
      return;
    }

    if (urlSessionId && urlSessionId !== sessionId) {
      setSessionId(urlSessionId, "url");
      return;
    }

    if (!urlSessionId && sessionId && sessionSource === "url") {
      setSessionId(null, null);
    }
  }, [urlSessionId, sessionId, sessionSource, setSessionId]);

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

    const promise = (async () => {
      try {
        const response = await createSessionMutation.mutateAsync(undefined);
        setSessionId(response.sessionId, "created");
        pendingUrlSessionIdRef.current = response.sessionId;
        await refreshSessions();
        return response.sessionId;
      } finally {
        createPromiseRef.current = null;
      }
    })();

    createPromiseRef.current = promise;
    return promise;
  }, [sessionId, setSessionId, refreshSessions, createSessionMutation]);

  useEffect(() => {
    const pendingSessionId = pendingUrlSessionIdRef.current;
    if (!pendingSessionId) {
      return;
    }

    if (sessionSource !== "created" || sessionId !== pendingSessionId) {
      return;
    }

    updateUrl(pendingSessionId);
    pendingUrlSessionIdRef.current = null;
  }, [sessionId, sessionSource, updateUrl]);

  const requestTitle = useCallback(async () => {
    if (title) {
      return title;
    }

    if (titlePromiseRef.current) {
      return titlePromiseRef.current;
    }

    const promise = (async () => {
      try {
        const sessionId = await ensureSession();
        const response = await generateTitleMutation.mutateAsync({ sessionId });
        if (response.title) {
          setTitle(response.title);
          await refreshSessions();
        }
        return response.title ?? null;
      } finally {
        titlePromiseRef.current = null;
      }
    })();

    titlePromiseRef.current = promise;
    return promise;
  }, [ensureSession, title, setTitle, refreshSessions, generateTitleMutation]);

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
      isSwitchingSession,
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
      isSwitchingSession,
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
