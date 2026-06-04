import React from "react";
import { useTheme } from "../hooks/useTheme";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-xs"
      style={{
        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
        border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
        color: isDark ? "#9ca3af" : "#6b7280"
      }}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? "☀️" : "🌙"}
      <span className="hidden sm:inline">
        {isDark ? "Light" : "Dark"}
      </span>
    </button>
  );
}