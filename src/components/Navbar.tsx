import React from "react";
import { Sun, Moon, Zap, Menu, GraduationCap, Keyboard } from "lucide-react";
import { PLACEHOLDER_USER } from "../services/store";
import { AccentTheme } from "../types";
import { MoodAccentSelector } from "./MoodAccentSelector";
import { PWAInstallButton } from "./PWAInstallButton";

interface NavbarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  accentTheme: AccentTheme;
  onSelectAccentTheme: (theme: AccentTheme) => void;
  onOpenQuickCapture: () => void;
  onToggleMobileMenu: () => void;
  onOpenShortcuts?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  onToggleDarkMode,
  accentTheme,
  onSelectAccentTheme,
  onOpenQuickCapture,
  onToggleMobileMenu,
  onOpenShortcuts,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-3 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-8 sm:w-9 h-8 sm:h-9 rounded-lg bg-indigo-600 text-white font-bold text-xs sm:text-sm shadow-xs shrink-0">
            DoN
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base tracking-tight leading-none truncate">
                Diary of a Nerd
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
                University
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block leading-none mt-0.5 truncate">
              Academic Study Organizer
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Quick Capture trigger button (Always accessible, compact on mobile) */}
        <button
          onClick={onOpenQuickCapture}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
          title="Quickly capture a note, link, or thought with AI classification (⌘K)"
          aria-label="Quick Capture"
        >
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
          <span className="hidden sm:inline">Quick Capture</span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.2 text-[10px] text-slate-400 dark:text-slate-400 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 font-mono">
            ⌘K
          </kbd>
        </button>

        {/* In-App PWA Install Prompt Button */}
        <PWAInstallButton variant="navbar" />

        {/* Mood-Based Accent Theme Selector */}
        <MoodAccentSelector
          accentTheme={accentTheme}
          onSelectAccentTheme={onSelectAccentTheme}
          darkMode={darkMode}
          onToggleDarkMode={onToggleDarkMode}
        />

        {/* Dark/Light mode toggle */}
        <button
          onClick={onToggleDarkMode}
          className="flex items-center justify-center p-2 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
          title={darkMode ? "Switch to Light theme" : "Switch to Dark theme"}
          aria-label="Toggle theme"
        >
          {darkMode ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline ml-1 text-[11px] font-semibold">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-indigo-600 dark:text-slate-400 shrink-0" />
              <span className="hidden sm:inline ml-1 text-[11px] font-semibold">Dark</span>
            </>
          )}
        </button>

        {/* Keyboard Shortcuts Help Overlay button (shown on medium+ screens with hardware keyboards) */}
        {onOpenShortcuts && (
          <button
            onClick={onOpenShortcuts}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
            title="Keyboard shortcuts (?)"
            aria-label="View keyboard shortcuts"
          >
            <Keyboard className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
            <span className="hidden lg:inline text-[11px] font-semibold">Shortcuts</span>
            <kbd className="px-1 py-0.2 text-[10px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 font-mono">
              ?
            </kbd>
          </button>
        )}

        {/* Current Student User Tag (No auth screens, placeholder user representation) */}
        <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800 text-left">
          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-semibold text-xs">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-900 dark:text-slate-100 leading-tight">
              {PLACEHOLDER_USER.name}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-400 leading-tight">
              {PLACEHOLDER_USER.major}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
