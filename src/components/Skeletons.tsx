import React from "react";

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      {/* Top Academic Overview Bar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-8 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="h-7 w-12 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-2.5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>

      {/* AI Recommendations Box Skeleton */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-5 w-44 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
          </div>
          <div className="h-7 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
        <div className="h-3.5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
              </div>
              <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-4/5 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="pt-2 flex gap-1.5">
                <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Columns Lower Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Resources */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/50 flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0 mt-0.5" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="flex gap-2">
                      <div className="h-2.5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-2.5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                  </div>
                </div>
                <div className="w-4 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Recent Assessment Scores */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/50 flex items-center justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-2.5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
                <div className="h-6 w-12 bg-slate-200 dark:bg-slate-800 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const RecommendationsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2 animate-pulse">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/70 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
          </div>
          <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-750 flex gap-2">
            <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const LibrarySkeleton: React.FC<{ viewMode?: "grid" | "list" }> = ({ viewMode = "grid" }) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <div className="h-7 w-52 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-80 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
        <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="h-9 w-full bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-7 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-7 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
      </div>

      {/* View Switcher & Counter Bar Skeleton */}
      <div className="flex items-center justify-between px-1">
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>

      {/* Cards Skeleton */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between h-56 space-y-3"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>
                <div className="h-4 w-4/5 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 shadow-2xs">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 flex-1">
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-2.5 w-1/4 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
