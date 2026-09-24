import React, { useState, useMemo, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpDown,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  FolderArchive,
  BookOpen,
} from "lucide-react";
import { Unit, Topic } from "../types";
import { store } from "../services/store";

interface TopicProgressChartProps {
  units: Unit[];
  topics: Topic[];
  onNavigateToLibraryWithFilter?: (unitId: string, topicId?: string) => void;
  onOpenLogScoreForTopic?: (unitId: string, topicId: string) => void;
  onTopicProgressUpdated?: () => void;
  defaultUnitFilter?: string; // unitId or "all"
}

type SortOrder = "completion-desc" | "completion-asc" | "unit" | "alphabetical";
type ChartOrientation = "horizontal" | "vertical";

export const TopicProgressChart: React.FC<TopicProgressChartProps> = ({
  units,
  topics,
  onNavigateToLibraryWithFilter,
  onOpenLogScoreForTopic,
  onTopicProgressUpdated,
  defaultUnitFilter = "all",
}) => {
  const [selectedUnitId, setSelectedUnitId] = useState<string>(defaultUnitFilter);
  const [sortOrder, setSortOrder] = useState<SortOrder>("completion-desc");
  const [orientation, setOrientation] = useState<ChartOrientation>("horizontal");
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [editingTopic, setEditingTopic] = useState<{ id: string; name: string; current: number } | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const resources = store.getResources();
  const results = store.getResults();

  // Unit lookup helper
  const unitMap = useMemo(() => {
    const map = new Map<string, Unit>();
    units.forEach((u) => map.set(u.id, u));
    return map;
  }, [units]);

  // Compute dataset for all or filtered topics
  const chartData = useMemo(() => {
    let filtered = topics;
    if (selectedUnitId !== "all") {
      filtered = topics.filter(
        (t) => t.unitId === selectedUnitId || t.courseId === selectedUnitId
      );
    }

    const items = filtered.map((topic) => {
      const parentUnit = unitMap.get(topic.unitId || topic.courseId || "");
      const completion = store.getTopicCompletion(topic.id);
      const topicResources = resources.filter((r) => r.topicId === topic.id);
      const topicResults = results.filter((res) => res.topicId === topic.id);
      const avgScore =
        topicResults.length > 0
          ? Math.round(
              topicResults.reduce((acc, curr) => acc + curr.percentage, 0) /
                topicResults.length
            )
          : null;

      const unitCode = parentUnit?.unitCode || parentUnit?.code || "UNIT";
      const unitColor = parentUnit?.color || "#6366f1";

      // Display name tailored for chart axis
      const maxLen = isMobile ? 18 : 26;
      const shortName =
        topic.name.length > maxLen ? topic.name.substring(0, maxLen - 2) + "…" : topic.name;
      const displayName =
        selectedUnitId === "all" ? (isMobile ? shortName : `[${unitCode}] ${shortName}`) : shortName;

      return {
        id: topic.id,
        topicId: topic.id,
        unitId: parentUnit?.id || topic.unitId,
        name: topic.name,
        displayName,
        completion,
        unitCode,
        unitTitle: parentUnit?.title || parentUnit?.name || "Unit",
        unitColor,
        resourceCount: topicResources.length,
        avgScore,
        status:
          completion >= 75
            ? ("mastered" as const)
            : completion >= 40
            ? ("in-progress" as const)
            : ("needs-focus" as const),
      };
    });

    // Apply sorting
    if (sortOrder === "completion-desc") {
      items.sort((a, b) => b.completion - a.completion);
    } else if (sortOrder === "completion-asc") {
      items.sort((a, b) => a.completion - b.completion);
    } else if (sortOrder === "unit") {
      items.sort((a, b) => a.unitCode.localeCompare(b.unitCode));
    } else if (sortOrder === "alphabetical") {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }

    return items;
  }, [topics, selectedUnitId, unitMap, sortOrder, resources, results]);

  // Overall metric summaries
  const metrics = useMemo(() => {
    if (chartData.length === 0) {
      return { avg: 0, mastered: 0, inProgress: 0, needsFocus: 0 };
    }
    const total = chartData.reduce((sum, item) => sum + item.completion, 0);
    const avg = Math.round(total / chartData.length);
    const mastered = chartData.filter((i) => i.completion >= 75).length;
    const inProgress = chartData.filter(
      (i) => i.completion >= 40 && i.completion < 75
    ).length;
    const needsFocus = chartData.filter((i) => i.completion < 40).length;

    return { avg, mastered, inProgress, needsFocus };
  }, [chartData]);

  // Dynamic height for horizontal bar layout
  const chartHeight = useMemo(() => {
    if (orientation === "vertical") return 320;
    return Math.max(260, chartData.length * 42 + 50);
  }, [orientation, chartData.length]);

  const handleUpdateProgress = (topicId: string, newProgress: number) => {
    store.updateTopicProgress(topicId, newProgress);
    if (onTopicProgressUpdated) onTopicProgressUpdated();
    if (editingTopic && editingTopic.id === topicId) {
      setEditingTopic({ ...editingTopic, current: newProgress });
    }
  };

  // Custom Tooltip component for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xl text-xs max-w-xs space-y-2 z-50 pointer-events-none">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: data.unitColor }}
            />
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {data.unitCode}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {data.unitTitle}
            </span>
          </div>

          <div className="font-semibold text-slate-900 dark:text-white text-xs leading-snug">
            {data.name}
          </div>

          {/* Completion Progress Bar */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-500 dark:text-slate-400">Completion:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {data.completion}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${data.completion}%`,
                  backgroundColor:
                    data.completion >= 75
                      ? "#10b981"
                      : data.completion >= 40
                      ? "#6366f1"
                      : "#f59e0b",
                }}
              />
            </div>
          </div>

          {/* Details & Stats */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px]">
            <div>
              <span className="text-slate-400">Study Items:</span>
              <p className="font-medium text-slate-700 dark:text-slate-200">
                {data.resourceCount} {data.resourceCount === 1 ? "note/pdf" : "notes/pdfs"}
              </p>
            </div>
            <div>
              <span className="text-slate-400">CAT / Exam Avg:</span>
              <p className="font-medium text-slate-700 dark:text-slate-200">
                {data.avgScore !== null ? `${data.avgScore}%` : "No scores logged"}
              </p>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 pt-0.5 italic">
            Click bar to highlight details or adjust progress
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/50 via-white to-indigo-50/30 dark:from-slate-850/50 dark:via-slate-900 dark:to-indigo-950/20">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-100/70 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Topic Completion Progress
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                Recharts Visualizer
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visual syllabus coverage across study topics based on notes, quizzes, and CAT assessment milestones.
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          {/* Unit Selector */}
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            aria-label="Filter chart by academic unit"
          >
            <option value="all">All Units ({topics.length} topics)</option>
            {units.map((u) => {
              const count = topics.filter(
                (t) => t.unitId === u.id || t.courseId === u.id
              ).length;
              return (
                <option key={u.id} value={u.id}>
                  {u.unitCode || u.code || "UNIT"} - {u.title || u.name} ({count})
                </option>
              );
            })}
          </select>

          {/* Sort Order */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg text-xs">
            <button
              onClick={() =>
                setSortOrder(
                  sortOrder === "completion-desc"
                    ? "completion-asc"
                    : "completion-desc"
                )
              }
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                sortOrder === "completion-desc" || sortOrder === "completion-asc"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Toggle sorting by completion percentage"
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>{sortOrder === "completion-asc" ? "Lowest %" : "Highest %"}</span>
            </button>
            <button
              onClick={() => setSortOrder("unit")}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                sortOrder === "unit"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Group by unit"
            >
              By Unit
            </button>
          </div>

          {/* Layout Orientation Toggle */}
          <button
            onClick={() =>
              setOrientation(orientation === "horizontal" ? "vertical" : "horizontal")
            }
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 text-xs"
            title={`Switch to ${
              orientation === "horizontal" ? "vertical column" : "horizontal bar"
            } view`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* Collapse/Expand Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 text-xs"
            title={isCollapsed ? "Expand chart" : "Collapse chart"}
            aria-label="Toggle chart collapse"
          >
            {isCollapsed ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                Avg Completion
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono">
                  {metrics.avg}%
                </span>
                <span className="text-[10px] text-slate-400">across topics</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Mastered (≥75%)
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                  {metrics.mastered}
                </span>
                <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">
                  of {chartData.length}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40">
              <span className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                In Progress (40–74%)
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl sm:text-2xl font-bold text-indigo-700 dark:text-indigo-400 font-mono">
                  {metrics.inProgress}
                </span>
                <span className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70">
                  topics
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40">
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Needs Attention (&lt;40%)
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl sm:text-2xl font-bold text-amber-700 dark:text-amber-400 font-mono">
                  {metrics.needsFocus}
                </span>
                <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70">
                  topics
                </span>
              </div>
            </div>
          </div>

          {/* Recharts Container */}
          {chartData.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No topics available for the selected unit filter.
            </div>
          ) : (
            <div className="w-full overflow-x-auto pt-2">
              <div style={{ width: "100%", minWidth: orientation === "vertical" ? (isMobile ? 380 : 500) : "100%", height: chartHeight }}>
                <ResponsiveContainer width="100%" height="100%">
                  {orientation === "horizontal" ? (
                    <BarChart
                      layout="vertical"
                      data={chartData}
                      margin={{ top: 10, right: isMobile ? 20 : 35, left: isMobile ? 0 : 10, bottom: 10 }}
                      onClick={(e: any) => {
                        if (e && e.activePayload && e.activePayload[0]) {
                          const clicked = e.activePayload[0].payload;
                          setSelectedTopicId(clicked.id);
                          setEditingTopic({
                            id: clicked.id,
                            name: clicked.name,
                            current: clicked.completion,
                          });
                        }
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="#94a3b8"
                        strokeOpacity={0.2}
                      />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={{ stroke: "#cbd5e1" }}
                      />
                      <YAxis
                        type="category"
                        dataKey="displayName"
                        width={isMobile ? 105 : 160}
                        tick={{ fontSize: isMobile ? 10 : 11, fill: "#475569" }}
                        axisLine={{ stroke: "#cbd5e1" }}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99, 102, 241, 0.07)" }} />
                      <ReferenceLine
                        x={75}
                        stroke="#10b981"
                        strokeDasharray="4 4"
                        label={{
                          value: "Target 75%",
                          position: "insideTopRight",
                          fill: "#10b981",
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      />
                      <Bar
                        dataKey="completion"
                        radius={[0, 6, 6, 0]}
                        barSize={20}
                        className="cursor-pointer"
                      >
                        {chartData.map((entry) => {
                          const isSelected = selectedTopicId === entry.id;
                          const fillColor =
                            entry.completion >= 75
                              ? "#10b981"
                              : entry.completion >= 40
                              ? entry.unitColor || "#6366f1"
                              : "#f59e0b";
                          return (
                            <Cell
                              key={`cell-${entry.id}`}
                              fill={fillColor}
                              stroke={isSelected ? "#312e81" : "none"}
                              strokeWidth={isSelected ? 2 : 0}
                              fillOpacity={selectedTopicId ? (isSelected ? 1 : 0.6) : 0.9}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  ) : (
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 20, left: 0, bottom: 40 }}
                      onClick={(e: any) => {
                        if (e && e.activePayload && e.activePayload[0]) {
                          const clicked = e.activePayload[0].payload;
                          setSelectedTopicId(clicked.id);
                          setEditingTopic({
                            id: clicked.id,
                            name: clicked.name,
                            current: clicked.completion,
                          });
                        }
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#94a3b8"
                        strokeOpacity={0.2}
                      />
                      <XAxis
                        dataKey="displayName"
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        angle={-30}
                        textAnchor="end"
                        interval={0}
                        height={60}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99, 102, 241, 0.07)" }} />
                      <ReferenceLine
                        y={75}
                        stroke="#10b981"
                        strokeDasharray="4 4"
                        label={{
                          value: "Target 75%",
                          position: "insideTopRight",
                          fill: "#10b981",
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      />
                      <Bar
                        dataKey="completion"
                        radius={[6, 6, 0, 0]}
                        barSize={24}
                        className="cursor-pointer"
                      >
                        {chartData.map((entry) => {
                          const isSelected = selectedTopicId === entry.id;
                          const fillColor =
                            entry.completion >= 75
                              ? "#10b981"
                              : entry.completion >= 40
                              ? entry.unitColor || "#6366f1"
                              : "#f59e0b";
                          return (
                            <Cell
                              key={`cell-v-${entry.id}`}
                              fill={fillColor}
                              stroke={isSelected ? "#312e81" : "none"}
                              strokeWidth={isSelected ? 2 : 0}
                              fillOpacity={selectedTopicId ? (isSelected ? 1 : 0.6) : 0.9}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Interactive Topic Progress Adjustment Drawer / Selected Topic Bar */}
          {editingTopic && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-indigo-200 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                    Selected Topic
                  </span>
                  <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                    {editingTopic.name}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Adjust completion status directly to keep syllabus tracking aligned with lectures and CAT preparation.
                </p>
              </div>

              {/* Progress Slider & Quick Buttons */}
              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={editingTopic.current}
                    onChange={(e) =>
                      handleUpdateProgress(editingTopic.id, Number(e.target.value))
                    }
                    className="w-24 sm:w-32 accent-indigo-600 cursor-pointer"
                    aria-label="Adjust completion percentage"
                  />
                  <span className="font-mono text-xs font-bold w-10 text-slate-800 dark:text-slate-200">
                    {editingTopic.current}%
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      handleUpdateProgress(
                        editingTopic.id,
                        Math.min(100, editingTopic.current + 10)
                      )
                    }
                    className="px-2 py-1 text-[11px] font-medium rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                    title="Add 10% progress"
                  >
                    +10%
                  </button>
                  <button
                    onClick={() => handleUpdateProgress(editingTopic.id, 100)}
                    className="px-2 py-1 text-[11px] font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                    title="Mark 100% complete"
                  >
                    100%
                  </button>

                  {onNavigateToLibraryWithFilter && (
                    <button
                      onClick={() => {
                        const targetTopic = topics.find((t) => t.id === editingTopic.id);
                        if (targetTopic) {
                          onNavigateToLibraryWithFilter(
                            targetTopic.unitId || targetTopic.courseId || "",
                            targetTopic.id
                          );
                        }
                      }}
                      className="px-2 py-1 text-[11px] font-medium rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100"
                      title="Open study resources for this topic"
                    >
                      <FolderArchive className="w-3 h-3 inline mr-1" />
                      Materials
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setEditingTopic(null);
                      setSelectedTopicId(null);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Close editor"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
