import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  CalendarClock,
  FolderArchive,
  GraduationCap,
  LineChart,
  Quote,
  PlusCircle,
  BookOpen,
  Sun,
  Moon,
  Keyboard,
  Calculator,
} from "lucide-react";
import { store } from "../services/store";
import { AccentTheme } from "../types";
import { MoodAccentSelector } from "./MoodAccentSelector";
import { PWAInstallButton } from "./PWAInstallButton";

export type NavTab = "dashboard" | "timetable" | "library" | "courses" | "tracker" | "citations" | "mathsolver";

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenNewResource: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenShortcuts?: () => void;
  accentTheme?: AccentTheme;
  onSelectAccentTheme?: (theme: AccentTheme) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewResource,
  isMobileOpen,
  onCloseMobile,
  darkMode,
  onToggleDarkMode,
  onOpenShortcuts,
  accentTheme,
  onSelectAccentTheme,
}) => {
  const [units, setUnits] = useState(store.getUnits());
  const [resources, setResources] = useState(store.getResources());
  const [results, setResults] = useState(store.getResults());
  const [timetable, setTimetable] = useState(store.getTimetable());

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setUnits(store.getUnits());
      setResources(store.getResources());
      setResults(store.getResults());
      setTimetable(store.getTimetable());
    });
    return unsub;
  }, []);

  const navItems = [
    {
      id: "dashboard" as NavTab,
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "timetable" as NavTab,
      label: "Class Timetable",
      icon: CalendarClock,
      badge: timetable.length > 0 ? timetable.length : null,
    },
    {
      id: "library" as NavTab,
      label: "Unified Library",
      icon: FolderArchive,
      badge: resources.length,
    },
    {
      id: "courses" as NavTab,
      label: "Units & Topics",
      icon: GraduationCap,
      badge: units.length,
    },
    {
      id: "tracker" as NavTab,
      label: "CATs & Exam Results",
      icon: LineChart,
      badge: results.length,
    },
    {
      id: "citations" as NavTab,
      label: "Citation Generator",
      icon: Quote,
      badge: null,
    },
    {
      id: "mathsolver" as NavTab,
      label: "Math & STEM Solver",
      icon: Calculator,
      badge: "AI",
    },
  ];

  const handleSelect = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 md:top-16 z-40 flex flex-col w-64 h-[100dvh] md:h-[calc(100vh-4rem)] shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-200 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Mobile-only header with Close Button */}
        <div className="flex md:hidden items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-indigo-600 text-white font-bold text-xs shadow-xs">
              DoN
            </div>
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              Menu Navigation
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Action Button */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-850">
          <button
            onClick={() => {
              onOpenNewResource();
              onCloseMobile();
            }}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Study Resource</span>
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-3 py-3 overflow-y-auto space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full min-h-[42px] flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 font-semibold"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${
                      isActive
                        ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick Active Units section */}
          <div className="pt-5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
            Active Units
          </div>
          <div className="space-y-0.5">
            {units.map((unit) => {
              const unitResCount = resources.filter(
                (r) => r.unitId === unit.id || r.courseId === unit.id
              ).length;
              const displayCode = unit.unitCode || unit.code || unit.title;
              return (
                <button
                  key={unit.id}
                  onClick={() => {
                    handleSelect("courses");
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-md transition-colors text-left group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: unit.color || "#6366f1" }}
                    />
                    <span className="truncate font-medium">{displayCode}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 group-hover:text-slate-500">
                    {unitResCount} items
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mood-Based Accent Switcher */}
        {accentTheme && onSelectAccentTheme && (
          <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Study Mood</span>
              <span className="font-semibold text-slate-600 dark:text-slate-300 capitalize">{accentTheme}</span>
            </div>
            <MoodAccentSelector
              accentTheme={accentTheme}
              onSelectAccentTheme={onSelectAccentTheme}
              darkMode={!!darkMode}
              variant="sidebar"
            />
          </div>
        )}

        {/* PWA Install Button for mobile / sidebar view */}
        <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800">
          <PWAInstallButton variant="sidebar" />
        </div>

        {/* Footer Info & Theme Control */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>AI Assistant</span>
          </span>
          <div className="flex items-center gap-1">
            {onOpenShortcuts && (
              <button
                onClick={onOpenShortcuts}
                className="flex items-center justify-center w-6 h-6 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors cursor-pointer text-[10px] font-mono font-semibold"
                title="Keyboard Shortcuts (?)"
              >
                ?
              </button>
            )}
            {onToggleDarkMode && (
              <button
                onClick={onToggleDarkMode}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors cursor-pointer text-[10px] font-semibold"
                title={darkMode ? "Switch to Light theme" : "Switch to Dark theme"}
              >
                {darkMode ? <Sun className="w-3 h-3 text-amber-400" /> : <Moon className="w-3 h-3 text-indigo-500" />}
                <span>{darkMode ? "Light" : "Dark"}</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
