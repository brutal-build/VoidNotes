import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import type { ThemeName } from "../types";

const THEME_BG: Record<string, string> = {
  obsidian: "#1e1e1e",
  light: "#ffffff",
  macos: "#1a1a1a",
};

function resolveSystemTheme(): "obsidian" | "light" {
  if (typeof window === "undefined" || !window.matchMedia) return "obsidian";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "obsidian";
}

export function useTheme() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const [systemTheme, setSystemTheme] = useState<"obsidian" | "light">(resolveSystemTheme);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => setSystemTheme(media.matches ? "light" : "obsidian");
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme = useMemo(
    () => (theme === "system" ? systemTheme : theme),
    [theme, systemTheme],
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    window.electronAPI.setBackground(THEME_BG[resolvedTheme] ?? "#1e1e1e");
  }, [resolvedTheme]);

  return { theme, resolvedTheme, setTheme };
}
