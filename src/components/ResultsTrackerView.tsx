import React, { useState, useMemo } from "react";
import {
  LineChart as LineChartIcon,
  PlusCircle,
  TrendingUp,
  BarChart2,
  Calendar,
  Trash2,
  BookOpen,
  Filter,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { store } from "../services/store";
import { Result } from "../types";
import { AIBadge } from "./AIBadge";
import { CourseQuizProgressChart } from "./CourseQuizProgressChart";

interface ResultsTrackerViewProps {
  onOpenLogModal: (defaultCourseId?: string, defaultTopicId?: string) => void;
  selectedCourseId?: string;
  onNavigateToLibrary?: () => void;
}

export const ResultsTrackerView: React.FC<ResultsTrackerViewProps> = ({
  onOpenLogModal,
  selectedCourseId: propCourseId,
  onNavigateToLibrary,
}) => {
  const units = store.getUnits();
  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    propCourseId || units[0]?.id || ""
  );
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");

  const topics = store.getTopics(selectedUnitId);
  const allResults = store.getResults();

  // Filter results by selected unit and topic
  const filteredResults = useMemo(() => {
    return allResults.filter((r) => {
      const matchUnit = !selectedUnitId || r.unitId === selectedUnitId || r.courseId === selectedUnitId;
      const matchTopic = !selectedTopicId || r.topicId === selectedTopicId;
      return matchUnit && matchTopic;
    });
  }, [allResults, selectedUnitId, selectedTopicId]);

  // Sort ascending by date for chronological trend chart
  const trendData = useMemo(() => {
    const list = [...filteredResults].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    return list.map((item) => ({
      date: item.date,
      name: item.assessmentName,
      type: item.assessmentType || "Assessment",
      percentage: item.percentage,
      scoreText: `${item.score}/${item.maxScore}`,
    }));
  }, [filteredResults]);

  // Topic mastery bar chart data for selected unit
  const topicMasteryData = useMemo(() => {
    const currentTopics = store.getTopics(selectedUnitId);
    return currentTopics.map((topic) => {
      const topicResults = allResults.filter((r) => r.topicId === topic.id);
      const avg =
        topicResults.length > 0
          ? Math.round(
              topicResults.reduce((acc, r) => acc + r.percentage, 0) / topicResults.length
            )
          : 0;

      return {
        topicId: topic.id,
        name: topic.name.length > 20 ? topic.name.slice(0, 18) + "..." : topic.name,
        fullName: topic.name,
        avgScore: avg,
        count: topicResults.length,
      };
    });
  }, [allResults, selectedUnitId]);

  const activeUnit = store.getUnit(selectedUnitId);

  const handleDeleteResult = (id: string, name: string) => {
    if (confirm(`Remove assessment score "${name}"?`)) {
      store.deleteResult(id);
    }
  };

  const avgUnitScore =
    filteredResults.length > 0
      ? Math.round(
          filteredResults.reduce((acc, r) => acc + r.percentage, 0) / filteredResults.length
        )
      : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Academic Results &amp; Performance Tracker
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
              Kenyan Academic Grading
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track average quiz scores over time across courses, log Continuous Assessment Tests (CATs), monitor topic mastery, and spot weak areas.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {onNavigateToLibrary && (
            <button
              type="button"
              onClick={onNavigateToLibrary}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span>Library Quizzes</span>
            </button>
          )}
          <button
            onClick={() => onOpenLogModal(selectedUnitId, selectedTopicId)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Log CAT / Quiz Score</span>
          </button>
        </div>
      </div>

      {/* Visual Performance Chart: Average Quiz Scores Over Time for Each Course */}
      <CourseQuizProgressChart
        units={units}
        results={allResults}
        quizzes={store.getQuizzes()}
        onOpenLogModal={(cId) => onOpenLogModal(cId || selectedUnitId, selectedTopicId)}
        onNavigateToLibrary={onNavigateToLibrary}
      />

      {/* Unit-Specific Breakdown & CATs */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Unit Topic Mastery &amp; Individual Trajectory
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Deep-dive into individual units &amp; topics
          </span>
        </div>

        {/* Unit & Topic Selector Bar */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold shrink-0">
              <Filter className="w-3.5 h-3.5" />
              <span>Which unit?</span>
            </div>
            <select
              value={selectedUnitId}
              onChange={(e) => {
                setSelectedUnitId(e.target.value);
                setSelectedTopicId("");
              }}
              className="w-full sm:w-auto px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unitCode || u.code ? `${u.unitCode || u.code} - ` : ""}
                  {u.title || u.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold sm:ml-2 shrink-0">
              <span>Topic:</span>
            </div>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium"
            >
              <option value="">All Topics in Unit</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">Unit Average:</span>
            <span
              className={`px-2.5 py-1 rounded-md font-bold text-xs ${
                avgUnitScore && avgUnitScore >= 75
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
                  : avgUnitScore
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {avgUnitScore !== null ? `${avgUnitScore}%` : "No scores logged"}
            </span>
          </div>
        </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Chronological Performance Trend */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Chronological CAT &amp; Exam Trajectory
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {trendData.length} records
              </span>
            </div>

            {trendData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-xs text-slate-400">
                <span>No scores logged for this unit filter.</span>
                <button
                  onClick={() => onOpenLogModal(selectedUnitId, selectedTopicId)}
                  className="mt-2 text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Log first CAT score
                </button>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                      tickFormatter={(val) => {
                        const parts = val.split("-");
                        return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : val;
                      }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                      unit="%"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="p-2.5 bg-slate-900 text-white rounded-lg text-xs shadow-lg space-y-1">
                              <p className="font-semibold">{d.name}</p>
                              <p className="text-[11px] text-slate-300">
                                {d.type} • Marks: {d.scoreText} ({d.percentage}%)
                              </p>
                              <p className="text-[10px] text-slate-400">{d.date}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="percentage"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#4f46e5" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Tracks percentage trajectory across continuous assessment tests and final exam papers over time.
          </p>
        </div>

        {/* Chart 2: Topic-Level Mastery */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Topic Mastery Breakdown
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Pass Mark Target: &ge;75%
              </span>
            </div>

            {topicMasteryData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-xs text-slate-400">
                <span>No topics defined for this unit.</span>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topicMasteryData}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="#94a3b8" width={110} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="p-2.5 bg-slate-900 text-white rounded-lg text-xs shadow-lg space-y-1">
                              <p className="font-semibold">{d.fullName}</p>
                              <p className="text-emerald-400">Average: {d.avgScore}%</p>
                              <p className="text-[10px] text-slate-400">
                                {d.count} assessment{d.count === 1 ? "" : "s"} recorded
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="avgScore" radius={[0, 4, 4, 0]}>
                      {topicMasteryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.avgScore >= 75 ? "#059669" : entry.avgScore > 0 ? "#e11d48" : "#cbd5e1"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Red bars highlight weak topics (&lt;75%) requiring revision before the final exam.
          </p>
        </div>
      </div>
      </div>

      {/* Table of All Logged Results */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            CAT &amp; Exam Log Entries ({filteredResults.length})
          </h3>
          <span className="text-xs text-slate-400">
            Official Kenyan university assessment marks &amp; AI practice quizzes
          </span>
        </div>

        {filteredResults.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No assessment results logged yet. Click "Log CAT / Exam Score" to record marks.
          </div>
        ) : (
          <>
            {/* Mobile Stacked Card View */}
            <div className="block md:hidden space-y-3">
              {filteredResults.map((item) => {
                const unit = store.getUnit(item.unitId || item.courseId || "");
                const topic = store.getTopic(item.topicId);
                const isHigh = item.percentage >= 80;
                const isMedium = item.percentage >= 65 && item.percentage < 80;
                const displayType = item.assessmentType || "CAT";

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                              displayType === "Final Exam"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300"
                                : displayType === "Practical CAT"
                                ? "bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300"
                                : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300"
                            }`}
                          >
                            {displayType}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">{item.date}</span>
                        </div>
                        <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 mt-1">
                          {item.assessmentName}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-bold font-mono ${
                            isHigh
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
                              : isMedium
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300"
                          }`}
                        >
                          {item.percentage}%
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {item.score}/{item.maxScore}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {unit?.unitCode || unit?.code || unit?.title}
                      </span>
                      <span> • </span>
                      <span>{topic?.name || "Topic"}</span>
                    </div>

                    {item.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                        {item.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800">
                      <div>
                        {item.source === "auto_quiz" ? (
                          <AIBadge label="Revision Quiz" size="sm" />
                        ) : (
                          <span className="text-[10px] text-slate-400">Manual Entry</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteResult(item.id, item.assessmentName)}
                        className="text-[11px] text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 p-1 flex items-center gap-1 cursor-pointer"
                        title="Delete log entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Assessment</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Unit / Topic</th>
                    <th className="py-2.5 px-3">Source</th>
                    <th className="py-2.5 px-3 text-right">Marks</th>
                    <th className="py-2.5 px-3 text-right">Percentage</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredResults.map((item) => {
                    const unit = store.getUnit(item.unitId || item.courseId || "");
                    const topic = store.getTopic(item.topicId);

                    const isHigh = item.percentage >= 80;
                    const isMedium = item.percentage >= 65 && item.percentage < 80;

                    const displayType = item.assessmentType || "CAT";

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors"
                      >
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
                          {item.date}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">
                          {item.assessmentName}
                          {item.notes && (
                            <p className="text-[11px] font-normal text-slate-400 line-clamp-1 mt-0.5">
                              {item.notes}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              displayType === "Final Exam"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300"
                                : displayType === "Practical CAT"
                                ? "bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300"
                                : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300"
                            }`}
                          >
                            {displayType}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {unit?.unitCode || unit?.code || unit?.title}
                          </span>
                          <span className="text-slate-400"> &bull; </span>
                          <span>{topic?.name}</span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {item.source === "auto_quiz" ? (
                            <AIBadge label="Revision Quiz" size="sm" />
                          ) : (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              Manual CAT
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium text-slate-800 dark:text-slate-200">
                          {item.score} / {item.maxScore}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-bold">
                          <span
                            className={`px-2 py-0.5 rounded ${
                              isHigh
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
                                : isMedium
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300"
                            }`}
                          >
                            {item.percentage}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteResult(item.id, item.assessmentName)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                            title="Delete mark"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
