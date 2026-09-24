import React, { useState, useRef, useEffect } from "react";
import {
  Palette,
  Check,
  Sun,
  Moon,
  ChevronDown,
  Layers,
  Flame,
  Target,
  Waves,
} from "lucide-react";
import { AccentTheme } from "../types";

export interface MoodOption {
  id: AccentTheme;
  name: string;
  subtitle: string;
  description: string;
  swatchLight: string;
  swatchDark: string;
  gradientLight: string;
  gradientDark: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const MOOD_THEMES: MoodOption[] = [
  {
    id: "calm",
    name: "Calm",
    subtitle: "Soft blues / greens",
    description: "Serene sea-glass & teal tones for relaxed, fatigue-free study",
    swatchLight: "#0d9488",
    swatchDark: "#2dd4bf",
    gradientLight: "from-teal-500 to-emerald-600",
    gradientDark: "from-teal-400 to-teal-200",
    icon: Waves,
  },
  {
    id: "focus",
    name: "Focus",
    subtitle: "Muted neutrals & sharp cobalt",
    description: "Minimal visual distraction with sharp electric blue clarity",
    swatchLight: "#2563eb",
    swatchDark: "#3b82f6",
    gradientLight: "from-blue-600 to-indigo-600",
    gradientDark: "from-blue-500 to-blue-400",
    icon: Target,
  },
  {
    id: "energize",
    name: "Energize",
    subtitle: "Vibrant orange / amber",
    description: "Warm, high-energy palette to boost alertness & motivation",
    swatchLight: "#ea580c",
    swatchDark: "#fb923c",
    gradientLight: "from-amber-500 to-orange-600",
    gradientDark: "from-orange-400 to-amber-400",
    icon: Flame,
  },
];

interface MoodAccentSelectorProps {
  accentTheme: AccentTheme;
  onSelectAccentTheme: (theme: AccentTheme) => void;
  darkMode: boolean;
  onToggleDarkMode?: () => void;
  variant?: "navbar" | "sidebar" | "compact";
}

export const MoodAccentSelector: React.FC<MoodAccentSelectorProps> = ({
  accentTheme,
  onSelectAccentTheme,
  darkMode,
  onToggleDarkMode,
  variant = "navbar",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentTheme = MOOD_THEMES.find((t) => t.id === accentTheme) || MOOD_THEMES[0];
  const CurrentIcon = currentTheme.icon;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (variant === "sidebar") {
    return (
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200/80 dark:border-slate-700/60">
        {MOOD_THEMES.map((theme) => {
          const isSelected = theme.id === accentTheme;
          return (
            <button
              key={theme.id}
              onClick={() => onSelectAccentTheme(theme.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                isSelected
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
              title={`${theme.name} Accent: ${theme.subtitle}`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: darkMode ? theme.swatchDark : theme.swatchLight,
                }}
              />
              <span className="truncate">{theme.name}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
        title="Select Study Mood Theme (6 combinations)"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform ring-1 ring-black/10 dark:ring-white/20"
          style={{
            backgroundColor: darkMode ? currentTheme.swatchDark : currentTheme.swatchLight,
          }}
        />
        <span className="text-[11px] font-semibold hidden xs:inline">{currentTheme.name}</span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Study Mood Accent
                </span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                6 Combinations
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Select an accent theme to layer over {darkMode ? "Dark" : "Light"} base mode.
            </p>
          </div>

          {/* Base Mode Toggle Row */}
          {onToggleDarkMode && (
            <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-850/40">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                {darkMode ? (
                  <Moon className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span>Base Canvas</span>
              </span>
              <button
                type="button"
                onClick={onToggleDarkMode}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-md transition-colors cursor-pointer shadow-2xs"
              >
                <span>{darkMode ? "Dark Mode" : "Light Mode"}</span>
                <span className="text-[10px] text-slate-400 font-normal">Switch</span>
              </button>
            </div>
          )}

          {/* Theme List */}
          <div className="p-1.5 space-y-1">
            {MOOD_THEMES.map((theme) => {
              const isSelected = theme.id === accentTheme;
              const Icon = theme.icon;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    onSelectAccentTheme(theme.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg transition-all flex items-start gap-2.5 cursor-pointer ${
                    isSelected
                      ? "bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white ring-1 ring-slate-300 dark:ring-slate-700"
                      : "hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {/* Swatch Pill */}
                  <div
                    className="w-7 h-7 rounded-lg shrink-0 mt-0.5 flex items-center justify-center text-white shadow-2xs"
                    style={{
                      backgroundColor: darkMode ? theme.swatchDark : theme.swatchLight,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5 drop-shadow-xs" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {theme.name}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      {theme.subtitle}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">
                      {theme.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Combination Indicator Footer */}
          <div className="px-3.5 py-1.5 mt-1 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 font-medium">
              <Layers className="w-3 h-3 text-slate-400" />
              <span>Active Layer:</span>
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {darkMode ? "Dark" : "Light"} + {currentTheme.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
