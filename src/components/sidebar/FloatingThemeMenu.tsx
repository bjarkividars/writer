"use client";

import { Menu } from "@base-ui/react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useSidebarContext } from "./SidebarContext";
import { useThemePreference, type ThemePreference } from "./useThemePreference";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

type ThemeIcon = typeof Sun;

const themeIconMap: Record<ThemePreference, ThemeIcon> = {
  light: Sun,
  system: Monitor,
  dark: Moon,
};

export default function FloatingThemeMenu() {
  const { isOpen } = useSidebarContext();
  const { theme, setTheme } = useThemePreference();
  const ActiveIcon = themeIconMap[theme];

  if (isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-2 z-40 hidden md:block">
      <Menu.Root>
        <Menu.Trigger
          render={(props) => (
            <button
              {...props}
              type="button"
              aria-label="Theme"
              className="cursor-pointer flex h-7 w-7 items-center justify-center rounded border border-transparent bg-background text-foreground-muted transition-all duration-200 hover:bg-hover hover:text-foreground data-pressed:bg-hover data-pressed:text-foreground"
            >
              <ActiveIcon className="h-3.5 w-3.5" />
            </button>
          )}
        />
        <Menu.Portal>
          <Menu.Positioner side="top" align="start" sideOffset={8}>
            <Menu.Popup className="min-w-40 rounded-md border border-border bg-background p-1 shadow-sm">
              <Menu.RadioGroup
                value={theme}
                onValueChange={(value) => setTheme(value as ThemePreference)}
              >
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Menu.RadioItem
                      key={option.value}
                      value={option.value}
                      closeOnClick
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-foreground outline-none hover:bg-hover data-highlighted:bg-hover data-checked:bg-hover data-checked:font-medium cursor-pointer"
                    >
                      <Icon className="h-4 w-4 text-foreground-muted" />
                      <span>{option.label}</span>
                    </Menu.RadioItem>
                  );
                })}
              </Menu.RadioGroup>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
}
