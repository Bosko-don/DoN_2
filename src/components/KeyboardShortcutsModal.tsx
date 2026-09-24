import React, { useEffect } from "react";
import { X, Keyboard, Zap, PlusCircle, Award, Sun, Moon, LayoutGrid } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  icon?: React.ReactNode;
}

interface ShortcutCategory {
  title: string;
  shortcuts: ShortcutItem[];
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Listen for Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const modKey = isMac ? "⌘" : "Ctrl";

  const categories: ShortcutCategory[] = [
    {
      title: "Essential Actions",
      shortcuts: [
        {
          keys: [modKey, "K"],
          description: "Open Quick Capture note & link organizer",
          icon: <Zap className="w-3.5 h-3.5 text-amber-500" />,
        },
        {
          keys: ["?"],
          description: "Toggle this keyboard shortcuts help overlay",
          icon: <Keyboard className="w-3.5 h-3.5 text-indigo-500" />,
        },
        {
          keys: ["Esc"],
          description: "Close active modal, drawer, or dialog",
        },
        {
          keys: [modKey, "D"],
          description: "Toggle instant Dark / Light mode",
          icon: <Moon className="w-3.5 h-3.5 text-indigo-400" />,
        },
      ],
    },
    {
      title: "Content & Assessments",
      shortcuts: [
        {
          keys: [modKey, "N"],
          description: "Upload notes, PDF monograph, or video resource",
          icon: <PlusCircle className="w-3.5 h-3.5 text-emerald-500" />,
        },
        {
          keys: [modKey, "L"],
          description: "Log a CAT, practical CAT, or final exam result",
          icon: <Award className="w-3.5 h-3.5 text-purple-500" />,
        },
      ],
    },
    {
      title: "Workspace Views",
      shortcuts: [
        {
          keys: [modKey, "1"],
          description: "Switch to Academic Overview Dashboard",
        },
        {
          keys: [modKey, "2"],
          description: "Switch to Unified Resource Library",
        },
        {
          keys: [modKey, "3"],
          description: "Switch to CATs & Exam Results Tracker",
        },
        {
          keys: [modKey, "4"],
          description: "Switch to Units & Topics Architecture",
        },
        {
          keys: [modKey, "5"],
          description: "Switch to Weekly Class Timetable",
        },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="shortcuts-title"
                className="text-base font-semibold text-slate-900 dark:text-white"
              >
                Keyboard Shortcuts
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Speed through study management and navigation without leaving your keys.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close shortcuts dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Categories List */}
        <div className="p-5 overflow-y-auto space-y-5 divide-y divide-slate-100 dark:divide-slate-800/80">
          {categories.map((category, catIndex) => (
            <div key={category.title} className={catIndex > 0 ? "pt-4" : ""}>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                {category.title}
              </h3>
              <div className="space-y-2">
                {category.shortcuts.map((sc, scIdx) => (
                  <div
                    key={scIdx}
                    className="flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850/60 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                      {sc.icon && <span className="shrink-0">{sc.icon}</span>}
                      <span>{sc.description}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {sc.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded shadow-2xs">
                            {key}
                          </kbd>
                          {keyIdx < sc.keys.length - 1 && (
                            <span className="text-[10px] text-slate-400 font-medium px-0.5">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/70 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5 text-indigo-500" />
            Press <kbd className="px-1.5 py-0.5 text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-semibold text-slate-700 dark:text-slate-200">?</kbd> anywhere to toggle this menu
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-750 rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
