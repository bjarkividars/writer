"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

const STORAGE_KEY = "writer_theme";
const MEDIA_QUERY = "(prefers-color-scheme: dark)";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

type ThemePreference = (typeof themeOptions)[number]["value"];

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

export default function SidebarThemeToggle() {
  const [theme, setTheme] = useState<ThemePreference>("system");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isThemePreference(stored)) {
      setTheme(stored);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const media = window.matchMedia(MEDIA_QUERY);
    const apply = () => applyThemePreference(theme, media.matches);

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

  return (
    <div className="px-3 pb-3">
      <div
        className="grid grid-cols-3 gap-1 rounded-md bg-muted p-1"
        role="radiogroup"
        aria-label="Theme"
      >
        {themeOptions.map((option) => {
          const isActive = theme === option.value;
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setTheme(option.value)}
              className={`flex h-7 items-center justify-center rounded text-xs font-medium transition-colors ${
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-foreground-muted hover:text-foreground hover:bg-hover"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="sr-only">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
