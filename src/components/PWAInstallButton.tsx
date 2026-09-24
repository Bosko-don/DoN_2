import React, { useState } from "react";
import { Download, Share2, PlusSquare, X } from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";

interface PWAInstallButtonProps {
  variant?: "navbar" | "sidebar";
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = "navbar" }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === "sidebar") {
      return (
        <button
          onClick={install}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 transition-colors border border-indigo-200/50 dark:border-indigo-800/40"
          title="Install DoN Study Organizer on this device"
        >
          <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Install Offline App</span>
        </button>
      );
    }

    return (
      <button
        onClick={install}
        className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 transition-colors border border-indigo-200/50 dark:border-indigo-800/40"
        title="Install DoN for offline study access"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
          title="Install DoN on iOS Safari"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
            <div className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>Install DoN on iPhone / iPad</span>
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="py-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold shrink-0 text-[11px]">
                    1
                  </span>
                  <p>
                    Tap the <strong>Share</strong> button <Share2 className="inline w-3.5 h-3.5 mx-0.5 text-indigo-600" /> in the Safari toolbar at the bottom.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold shrink-0 text-[11px]">
                    2
                  </span>
                  <p>
                    Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare className="inline w-3.5 h-3.5 mx-0.5 text-indigo-600" />.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold shrink-0 text-[11px]">
                    3
                  </span>
                  <p>
                    Tap <strong>Add</strong> in the top right. DoN will open full-screen and work offline!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
