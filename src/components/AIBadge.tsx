import React from "react";
import { BookOpen } from "lucide-react";

interface AIBadgeProps {
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export const AIBadge: React.FC<AIBadgeProps> = ({
  label = "AI Assistant",
  size = "sm",
  className = "",
}) => {
  const isSm = size === "sm";
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md tracking-tight ${
        isSm
          ? "px-2 py-0.5 text-xs bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
          : "px-2.5 py-1 text-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700"
      } ${className}`}
      title="Powered by Gemini AI"
    >
      <BookOpen className={`${isSm ? "w-3.5 h-3.5" : "w-4 h-4"} text-indigo-600 dark:text-indigo-400 shrink-0`} />
      <span className="whitespace-nowrap">{label}</span>
    </span>
  );
};
