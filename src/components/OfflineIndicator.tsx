import React from "react";
import { WifiOff, Database } from "lucide-react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-600/95 dark:bg-amber-600/95 text-white px-3.5 py-2 text-xs font-medium shadow-xl backdrop-blur-xs border border-amber-400/40 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-700/60 shrink-0">
        <WifiOff className="w-3.5 h-3.5 text-amber-100" />
      </div>
      <div>
        <div className="flex items-center gap-1.5 font-semibold leading-tight">
          <span>Offline Mode</span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-200 animate-pulse" />
        </div>
        <p className="text-[11px] text-amber-100/90 leading-tight mt-0.5">
          Viewing cached library items & offline notes
        </p>
      </div>
      <div className="ml-1 pl-2 border-l border-amber-400/30 flex items-center gap-1 text-[10px] text-amber-200 shrink-0">
        <Database className="w-3 h-3" />
        <span>Cached</span>
      </div>
    </aside>
  );
};
