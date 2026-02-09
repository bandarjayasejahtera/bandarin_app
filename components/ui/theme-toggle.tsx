// components/ui/theme-toggle.tsx
"use client";

import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Moon, Sun, SunSnow } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative overflow-hidden rounded-full border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-9 h-9"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ y: -20, opacity: 0, rotate: -90 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 20, opacity: 0, rotate: 90 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {theme === "light" && (
            <Sun className="h-[1.2rem] w-[1.2rem] text-orange-500" />
          )}
          {theme === "dark" && (
            <Moon className="h-[1.2rem] w-[1.2rem] text-blue-500" />
          )}
          {theme === "auto" && (
            <SunSnow className="h-[1.2rem] w-[1.2rem] text-green-600" />
          )}
        </motion.div>
      </AnimatePresence>
      <span className="sr-only">Toggle theme (Current: {theme})</span>
    </Button>
  );
}