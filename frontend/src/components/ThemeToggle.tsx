"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { actualTheme, toggleTheme, mounted } = useTheme();

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        disabled
      >
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9 hover:bg-accent transition-colors"
      title={actualTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {actualTheme === 'light' ? (
        <Sun className="h-[1.2rem] w-[1.2rem] text-amber-500 transition-all rotate-0 scale-100" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] text-blue-400 transition-all rotate-0 scale-100" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
