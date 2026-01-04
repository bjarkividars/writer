"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "writer_theme";
const MEDIA_QUERY = "(prefers-color-scheme: dark)";

export type ThemePreference = "light" | "system" | "dark";
export type ResolvedTheme = "light" | "dark";

const isThemePreference = (value: string | null): value is ThemePreference =>
  value === "light" || value === "system" || value === "dark";

const applyThemePreference = (
  preference: ThemePreference,
  prefersDark: boolean
) => {
  const shouldUseDark =
    preference === "dark" || (preference === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", shouldUseDark);
};

type ThemePreferenceContextValue = {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
};

const ThemePreferenceContext =
  createContext<ThemePreferenceContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isThemePreference(stored)) {
      setTimeout(() => {
        setTheme(stored);
      }, 0);
    }
    setTimeout(() => {
      setHydrated(true);
    }, 0);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const media = window.matchMedia(MEDIA_QUERY);
    const apply = () => {
      const nextResolved =
        theme === "system" ? (media.matches ? "dark" : "light") : theme;
      setResolvedTheme(nextResolved);
      applyThemePreference(theme, media.matches);
    };

    apply();

    if (theme !== "system") {
      return;
    }

    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme, hydrated]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, hydrated]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme]
  );

  return (
    <ThemePreferenceContext.Provider value={value}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);
  if (!context) {
    throw new Error("useThemePreference must be used within ThemeProvider");
  }
  return context;
}
