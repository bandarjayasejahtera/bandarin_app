"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getSunTimes } from "@/utils/sun-calc";

type Theme = "light" | "dark" | "auto";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Ambil tema dari localStorage jika ada, default 'light'
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("bandarin-theme") as Theme;
    if (savedTheme) setThemeState(savedTheme);
    setMounted(true);
  }, []);

  // Logic Utama Perubahan Tema
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    const applyTheme = (mode: "light" | "dark") => {
      root.classList.add(mode);
    };

    if (theme === "auto") {
      // Logic Auto Solar
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const { sunrise, sunset } = getSunTimes(latitude, longitude);
            const now = new Date();

            if (now >= sunrise && now < sunset) {
              applyTheme("light");
            } else {
              applyTheme("dark");
            }
          },
          (error) => {
            console.warn("Izin lokasi ditolak, fallback ke jam sistem (06-18)", error);
            const hour = new Date().getHours();
            applyTheme(hour >= 6 && hour < 18 ? "light" : "dark");
          }
        );
      } else {
        // Fallback jika browser tidak support geo
        const hour = new Date().getHours();
        applyTheme(hour >= 6 && hour < 18 ? "light" : "dark");
      }
    } else {
      // Manual Mode
      applyTheme(theme);
    }

    // Simpan ke storage
    localStorage.setItem("bandarin-theme", theme);
  }, [theme]);

  // Fungsi Toggle: Light -> Dark -> Auto -> Light
  const toggleTheme = () => {
    if (theme === "light") setThemeState("dark");
    else if (theme === "dark") setThemeState("auto");
    else setThemeState("light");
  };

  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};