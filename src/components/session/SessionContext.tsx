"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createSession } from "@/lib/api/client";

type SessionSource = "url" | "created" | null;

type SessionContextValue = {
  sessionId: string | null;
  sessionSource: SessionSource;
  ensureSession: () => Promise<string>;
  setSessionId: (sessionId: string | null, source?: SessionSource) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

type SessionProviderProps = {
  children: ReactNode;
  initialSessionId?: string | null;
};

export function SessionProvider({
  children,
  initialSessionId = null,
}: SessionProviderProps) {
  const [sessionId, setSessionIdState] = useState<string | null>(initialSessionId);
  const [sessionSource, setSessionSource] = useState<SessionSource>(
    initialSessionId ? "url" : null
  );
  const createPromiseRef = useRef<Promise<string> | null>(null);

  const setSessionId = useCallback(
    (nextSessionId: string | null, source?: SessionSource) => {
      setSessionIdState(nextSessionId);
      setSessionSource(source ?? (nextSessionId ? "created" : null));
    },
    []
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
        return response.sessionId;
      })
      .finally(() => {
        createPromiseRef.current = null;
      });

    createPromiseRef.current = promise;
    return promise;
  }, [sessionId, setSessionId, updateUrl]);

  const value = useMemo(
    () => ({
      sessionId,
      sessionSource,
      ensureSession,
      setSessionId,
    }),
    [sessionId, sessionSource, ensureSession, setSessionId]
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
