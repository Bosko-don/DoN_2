import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Sidebar, NavTab } from "./components/Sidebar";
import { DashboardView } from "./components/DashboardView";
import { LibraryView } from "./components/LibraryView";
import { CoursesView } from "./components/CoursesView";
import { ResultsTrackerView } from "./components/ResultsTrackerView";
import { CitationGeneratorView } from "./components/CitationGeneratorView";
import { MathSolverView } from "./components/MathSolverView";
import { TimetableView } from "./components/TimetableView";
import { TimetableModal } from "./components/TimetableModal";
import { QuickCaptureModal } from "./components/QuickCaptureModal";
import { NewResourceModal } from "./components/NewResourceModal";
import { ResourceDetailModal } from "./components/ResourceDetailModal";
import { QuizRunnerModal } from "./components/QuizRunnerModal";
import { LogScoreModal } from "./components/LogScoreModal";
import { KeyboardShortcutsModal } from "./components/KeyboardShortcutsModal";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { store } from "./services/store";
import { Resource, TimetableEntry, DayOfWeek, AccentTheme } from "./types";

export default function App() {
  // Theme state: dark / light
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("don_theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Mood-Based Accent Theme state: calm / focus / energize (independent from dark/light base mode)
  const [accentTheme, setAccentTheme] = useState<AccentTheme>(() => {
    const saved = localStorage.getItem("don_accent_theme");
    if (saved === "calm" || saved === "focus" || saved === "energize") {
      return saved as AccentTheme;
    }
    return store.getAccentTheme();
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (darkMode) {
      root.classList.add("dark");
      body.classList.add("dark");
      localStorage.setItem("don_theme", "dark");
    } else {
      root.classList.remove("dark");
      body.classList.remove("dark");
      localStorage.setItem("don_theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    root.setAttribute("data-accent", accentTheme);
    body.setAttribute("data-accent", accentTheme);

    root.classList.remove("theme-calm", "theme-focus", "theme-energize");
    root.classList.add(`theme-${accentTheme}`);
    body.classList.remove("theme-calm", "theme-focus", "theme-energize");
    body.classList.add(`theme-${accentTheme}`);

    localStorage.setItem("don_accent_theme", accentTheme);
    try {
      sessionStorage.setItem("don_accent_theme", accentTheme);
    } catch {
      // silent
    }
    store.setAccentTheme(accentTheme);
  }, [accentTheme]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals state
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isNewResourceOpen, setIsNewResourceOpen] = useState(false);
  const [newResourceDefaults, setNewResourceDefaults] = useState<{ courseId?: string; topicId?: string }>({});

  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isResourceDetailOpen, setIsResourceDetailOpen] = useState(false);

  const [quizResource, setQuizResource] = useState<Resource | null>(null);
  const [isQuizRunnerOpen, setIsQuizRunnerOpen] = useState(false);

  const [isLogScoreOpen, setIsLogScoreOpen] = useState(false);
  const [logScoreDefaults, setLogScoreDefaults] = useState<{ courseId?: string; topicId?: string }>({});

  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Feature 16: Timetable Modal state
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  const [editingTimetableEntry, setEditingTimetableEntry] = useState<TimetableEntry | null>(null);
  const [timetableDefaultDay, setTimetableDefaultDay] = useState<DayOfWeek | undefined>(undefined);

  // Library view filter pass-through
  const [libraryFilter, setLibraryFilter] = useState<{ courseId?: string; topicId?: string }>({});

  // Global keyboard shortcuts (?, Cmd+K, Cmd+D, Cmd+N, Cmd+L, Cmd+1-5, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      // Escape closes the shortcuts overlay if open
      if (e.key === "Escape" && isShortcutsOpen) {
        e.preventDefault();
        setIsShortcutsOpen(false);
        return;
      }

      // Do not trigger key actions when typing inside form inputs
      if (isInput) return;

      // '?' key toggles the keyboard shortcut help overlay
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // Cmd+K or Ctrl+K: Quick Capture
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsQuickCaptureOpen((prev) => !prev);
        return;
      }

      // Cmd+D or Ctrl+D: Dark / Light Mode
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        toggleDarkMode();
        return;
      }

      // Cmd+N or Ctrl+N: Add Resource
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleOpenNewResourceWithContext();
        return;
      }

      // Cmd+L or Ctrl+L: Log Score
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "l") {
        e.preventDefault();
        handleOpenLogScoreWithContext();
        return;
      }

      // Cmd+1..5: Navigate Views
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "1") {
          e.preventDefault();
          setCurrentTab("dashboard");
        } else if (e.key === "2") {
          e.preventDefault();
          setCurrentTab("library");
        } else if (e.key === "3") {
          e.preventDefault();
          setCurrentTab("tracker");
        } else if (e.key === "4") {
          e.preventDefault();
          setCurrentTab("courses");
        } else if (e.key === "5") {
          e.preventDefault();
          setCurrentTab("timetable");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isShortcutsOpen]);

  // Handlers
  const handleOpenResource = (resource: Resource) => {
    setSelectedResource(resource);
    setIsResourceDetailOpen(true);
  };

  const handleStartQuizFromResource = (resource: Resource) => {
    setIsResourceDetailOpen(false);
    setQuizResource(resource);
    setIsQuizRunnerOpen(true);
  };

  const handleOpenNewResourceWithContext = (courseId?: string, topicId?: string) => {
    setNewResourceDefaults({ courseId, topicId });
    setIsNewResourceOpen(true);
  };

  const handleOpenLogScoreWithContext = (courseId?: string, topicId?: string) => {
    setLogScoreDefaults({ courseId, topicId });
    setIsLogScoreOpen(true);
  };

  const handleNavigateToLibraryWithFilter = (courseId: string, topicId?: string) => {
    setLibraryFilter({ courseId, topicId });
    setCurrentTab("library");
  };

  // Timetable Handlers
  const handleOpenAddTimetable = (defaultDay?: DayOfWeek) => {
    setEditingTimetableEntry(null);
    setTimetableDefaultDay(defaultDay);
    setIsTimetableModalOpen(true);
  };

  const handleOpenEditTimetable = (entry: TimetableEntry) => {
    setEditingTimetableEntry(entry);
    setTimetableDefaultDay(entry.day);
    setIsTimetableModalOpen(true);
  };

  return (
    <div
      className="min-h-screen flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white bg-[var(--app-bg)] text-[var(--app-fg)]"
      style={{ backgroundColor: "var(--app-bg)", color: "var(--app-fg)" }}
    >
      {/* Top Navigation */}
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        accentTheme={accentTheme}
        onSelectAccentTheme={setAccentTheme}
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex w-full">
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            if (tab === "library") {
              // reset specific sub-filter if clicked directly
              setLibraryFilter({});
            }
          }}
          onOpenNewResource={() => handleOpenNewResourceWithContext()}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          accentTheme={accentTheme}
          onSelectAccentTheme={setAccentTheme}
        />

        {/* Viewport Content Area */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto min-w-0 max-w-full">
          {currentTab === "dashboard" && (
            <DashboardView
              onNavigateToLibrary={() => setCurrentTab("library")}
              onNavigateToTracker={() => setCurrentTab("tracker")}
              onNavigateToCourses={() => setCurrentTab("courses")}
              onNavigateToTimetable={() => setCurrentTab("timetable")}
              onOpenResource={handleOpenResource}
              onOpenNewResource={() => handleOpenNewResourceWithContext()}
              onOpenNewResourceWithUnit={(unitId) => handleOpenNewResourceWithContext(unitId)}
              onOpenLogScore={() => handleOpenLogScoreWithContext()}
              onOpenAddTimetable={handleOpenAddTimetable}
              onOpenEditTimetable={handleOpenEditTimetable}
              onNavigateToLibraryWithFilter={handleNavigateToLibraryWithFilter}
            />
          )}

          {currentTab === "timetable" && (
            <TimetableView
              onOpenAddModal={handleOpenAddTimetable}
              onOpenEditModal={handleOpenEditTimetable}
              onNavigateToLibraryWithFilter={handleNavigateToLibraryWithFilter}
              onNavigateToCourses={() => setCurrentTab("courses")}
            />
          )}

          {currentTab === "library" && (
            <LibraryView
              onOpenResource={handleOpenResource}
              onOpenNewResource={() => handleOpenNewResourceWithContext()}
              initialCourseId={libraryFilter.courseId}
              initialTopicId={libraryFilter.topicId}
            />
          )}

          {currentTab === "courses" && (
            <CoursesView
              onNavigateToLibraryWithFilter={handleNavigateToLibraryWithFilter}
              onOpenLogScoreForTopic={(cId, tId) => handleOpenLogScoreWithContext(cId, tId)}
              onOpenNewResourceForTopic={(cId, tId) => handleOpenNewResourceWithContext(cId, tId)}
            />
          )}

          {currentTab === "tracker" && (
            <ResultsTrackerView
              onOpenLogModal={(cId, tId) => handleOpenLogScoreWithContext(cId, tId)}
              selectedCourseId={libraryFilter.courseId}
              onNavigateToLibrary={() => setCurrentTab("library")}
            />
          )}

          {currentTab === "citations" && <CitationGeneratorView />}

          {currentTab === "mathsolver" && <MathSolverView />}
        </main>
      </div>

      {/* Global Quick Capture Modal (Feature 13) */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        onResourceSaved={(resId) => {
          const res = store.getResource(resId);
          if (res) {
            handleOpenResource(res);
          }
        }}
      />

      {/* Editable School Timetable Modal (Feature 16) */}
      <TimetableModal
        isOpen={isTimetableModalOpen}
        onClose={() => {
          setIsTimetableModalOpen(false);
          setEditingTimetableEntry(null);
        }}
        entryToEdit={editingTimetableEntry}
        defaultDay={timetableDefaultDay}
        onNavigateToUnits={() => setCurrentTab("courses")}
      />

      {/* Add New Resource Modal (Feature 1) */}
      <NewResourceModal
        isOpen={isNewResourceOpen}
        onClose={() => setIsNewResourceOpen(false)}
        defaultCourseId={newResourceDefaults.courseId}
        defaultTopicId={newResourceDefaults.topicId}
        onCreated={(resId) => {
          const res = store.getResource(resId);
          if (res) {
            handleOpenResource(res);
          }
        }}
      />

      {/* Resource Detail & PDF Viewer Modal (Features 2, 10, 15) */}
      <ResourceDetailModal
        resource={selectedResource}
        isOpen={isResourceDetailOpen}
        onClose={() => {
          setIsResourceDetailOpen(false);
          setSelectedResource(null);
        }}
        onStartQuiz={handleStartQuizFromResource}
        onResourceUpdated={() => {
          if (selectedResource) {
            const updated = store.getResource(selectedResource.id);
            if (updated) setSelectedResource(updated);
          }
        }}
      />

      {/* Interactive Quiz Runner Modal (Feature 6) */}
      <QuizRunnerModal
        resource={quizResource}
        isOpen={isQuizRunnerOpen}
        onClose={() => {
          setIsQuizRunnerOpen(false);
          setQuizResource(null);
        }}
        onQuizCompleted={() => {
          // Quiz score feeds directly into results tracker
        }}
      />

      {/* Manual Results Logger Modal (Feature 4) */}
      <LogScoreModal
        isOpen={isLogScoreOpen}
        onClose={() => setIsLogScoreOpen(false)}
        defaultCourseId={logScoreDefaults.courseId}
        defaultTopicId={logScoreDefaults.topicId}
        onSaved={() => {
          // automatically updates store subscribers
        }}
      />

      {/* Global Keyboard Shortcut Help Overlay */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Offline Status Connectivity Banner */}
      <OfflineIndicator />
    </div>
  );
}
