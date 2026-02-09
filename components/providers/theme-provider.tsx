// components/providers/theme-provider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getSunTimes } from "@/utils/sun-calc";

type Theme = "light" | "dark" | "auto";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("bandarin-theme") as Theme;
    if (savedTheme) setThemeState(savedTheme);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    
    const applyClass = (mode: "light" | "dark") => {
      root.classList.remove("light", "dark");
      root.classList.add(mode);
      setResolvedTheme(mode);
      root.style.colorScheme = mode;
    };

    const handleAutoTheme = () => {
      const now = new Date();
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const { sunrise, sunset } = getSunTimes(latitude, longitude);
            applyClass(now >= sunrise && now < sunset ? "light" : "dark");
          },
          () => {
            const hour = now.getHours();
            applyClass(hour >= 6 && hour < 18 ? "light" : "dark");
          }
        );
      } else {
        const hour = now.getHours();
        applyClass(hour >= 6 && hour < 18 ? "light" : "dark");
      }
    };

    if (theme === "auto") handleAutoTheme();
    else applyClass(theme);

    localStorage.setItem("bandarin-theme", theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setThemeState((prev) => {
      if (prev === "light") return "dark";
      if (prev === "dark") return "auto";
      return "light";
    });
  };

  // Selalu return Provider agar hook useTheme tidak error di komponen anak
  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme: setThemeState, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};