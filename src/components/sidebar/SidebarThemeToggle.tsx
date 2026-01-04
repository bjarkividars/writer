"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useThemePreference } from "./useThemePreference";
import { Button } from "@/components/Button";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

export default function SidebarThemeToggle() {
  const { theme, setTheme } = useThemePreference();

  return (
    <div className="px-3 pb-3 shrink-0 w-[280px]">
      <div
        className="grid grid-cols-3 gap-1 rounded-md bg-muted p-1"
        role="radiogroup"
        aria-label="Theme"
      >
        {themeOptions.map((option) => {
          const isActive = theme === option.value;
          const Icon = option.icon;
          return (
            <Button
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
            </Button>
          );
        })}
      </div>
    </div>
  );
}
