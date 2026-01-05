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
  workspaceKey: string;
  ensureSession: () => Promise<string>;
  resetSession: () => void;
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
  const [draftKey, setDraftKey] = useState(0);
  const sessionIdRef = useRef<string | null>(null);
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
      const previousSessionId = sessionIdRef.current;
      if (!nextSessionId && previousSessionId) {
        setDraftKey((prev) => prev + 1);
      }
      const nextSource = source ?? (nextSessionId ? "created" : null);
      setSessionIdState(nextSessionId);
      sessionIdRef.current = nextSessionId;
      setSessionSource(nextSource);
      setTitle(null);
      titlePromiseRef.current = null;
      setHydrated(nextSessionId && nextSource === "url" ? false : true);
    },
    [setTitle, setHydrated]
  );

  const resetSession = useCallback(() => {
    pendingUrlSessionIdRef.current = null;
    createPromiseRef.current = null;
    titlePromiseRef.current = null;
    setSessionId(null, null);
  }, [setSessionId]);

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
    if (sessionIdRef.current) {
      return sessionIdRef.current;
    }

    if (createPromiseRef.current) {
      return createPromiseRef.current;
    }

    const promise = (async () => {
      try {
        const response = await createSessionMutation.mutateAsync(undefined);
        sessionIdRef.current = response.sessionId;
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
  }, [setSessionId, refreshSessions, createSessionMutation]);

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

  const workspaceKey = useMemo(() => {
    if (sessionSource === "url" && sessionId) {
      return `session-${sessionId}`;
    }
    return `draft-${draftKey}`;
  }, [draftKey, sessionId, sessionSource]);

  const value = useMemo(
    () => ({
      sessionId,
      sessionSource,
      workspaceKey,
      ensureSession,
      resetSession,
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
      workspaceKey,
      ensureSession,
      resetSession,
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
