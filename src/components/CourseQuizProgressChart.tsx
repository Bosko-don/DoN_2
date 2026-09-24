import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  Award,
  BookOpen,
  Filter,
  Layers,
  HelpCircle,
  PlusCircle,
  CheckCircle2,
  Calendar,
  BarChart3,
} from "lucide-react";
import { Unit, Result, Quiz } from "../types";

interface CourseQuizProgressChartProps {
  units: Unit[];
  results: Result[];
  quizzes?: Quiz[];
  onOpenLogModal: (defaultCourseId?: string) => void;
  onNavigateToLibrary?: () => void;
}

// Fallback palette for distinct, accessible course lines
const COURSE_PALETTE = [
  "#4f46e5", // Indigo
  "#059669", // Emerald
  "#d97706", // Amber
  "#0284c7", // Sky
  "#e11d48", // Rose
  "#7c3aed", // Violet
  "#0d9488", // Teal
  "#ea580c", // Orange
];

export const CourseQuizProgressChart: React.FC<CourseQuizProgressChartProps> = ({
  units,
  results,
  quizzes = [],
  onOpenLogModal,
  onNavigateToLibrary,
}) => {
  // Chart controls state
  const [calculationMode, setCalculationMode] = useState<"cumulative" | "session">("cumulative");
  const [filterScope, setFilterScope] = useState<"quizzes_only" | "all_assessments">("quizzes_only");
  const [hiddenCourseIds, setHiddenCourseIds] = useState<Set<string>>(new Set());
  const [showSamplePreview, setShowSamplePreview] = useState(false);

  // Extract all quiz/assessment data entries
  const allScoreEntries = useMemo(() => {
    const list: Array<{
      courseId: string;
      date: string;
      percentage: number;
      score: number;
      maxScore: number;
      name: string;
      isQuiz: boolean;
    }> = [];

    // 1. From results table
    results.forEach((r) => {
      const isQuizType =
        r.source === "auto_quiz" ||
        r.assessmentType === "Quiz" ||
        r.assessmentType === "Assignment" ||
        (r.assessmentName && r.assessmentName.toLowerCase().includes("quiz")) ||
        (r.notes && r.notes.toLowerCase().includes("quiz"));

      if (filterScope === "all_assessments" || isQuizType) {
        const cId = r.unitId || r.courseId;
        if (cId) {
          list.push({
            courseId: cId,
            date: r.date,
            percentage: r.percentage,
            score: r.score,
            maxScore: r.maxScore,
            name: r.assessmentName || "Quiz",
            isQuiz: Boolean(isQuizType),
          });
        }
      }
    });

    // 2. From completed quizzes in store (if not already recorded in results)
    quizzes.forEach((q) => {
      if (q.completedAt && q.score !== undefined && q.totalQuestions > 0) {
        const qDate = q.completedAt.split("T")[0];
        const pct = Math.round((q.score / q.totalQuestions) * 100);
        const cId = q.unitId || q.courseId;
        // Avoid duplicate if already in results
        const existsInResults = results.some(
          (r) =>
            (r.unitId === cId || r.courseId === cId) &&
            r.date === qDate &&
            r.score === q.score &&
            r.maxScore === q.totalQuestions
        );

        if (!existsInResults && cId) {
          list.push({
            courseId: cId,
            date: qDate,
            percentage: pct,
            score: q.score,
            maxScore: q.totalQuestions,
            name: q.title || "Interactive Revision Quiz",
            isQuiz: true,
          });
        }
      }
    });

    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [results, quizzes, filterScope]);

  const hasRealData = allScoreEntries.length > 0;

  // Sample demonstration data generator if the student hasn't logged quiz scores yet
  const sampleData = useMemo(() => {
    if (units.length === 0) return [];

    const dates = ["2026-08-10", "2026-08-18", "2026-08-27", "2026-09-05", "2026-09-14", "2026-09-21"];
    const baseScores: Record<number, number[]> = {
      0: [65, 72, 70, 78, 85, 90], // Strong steady growth
      1: [55, 60, 68, 72, 75, 78], // Solid upward climb
      2: [75, 70, 80, 82, 85, 88], // High baseline
      3: [48, 52, 58, 64, 70, 74], // Overcoming initial struggles
    };

    return dates.map((d, dateIdx) => {
      const parts = d.split("-");
      const displayDate = `${parts[1]}/${parts[2]}`;
      const entry: Record<string, any> = {
        date: d,
        displayDate,
        fullDate: new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      };

      units.slice(0, 4).forEach((u, uIdx) => {
        const scores = baseScores[uIdx % 4];
        entry[u.id] = scores[dateIdx];
        entry[`${u.id}_count`] = 1;
        entry[`${u.id}_avg`] = scores[dateIdx];
      });

      return entry;
    });
  }, [units]);

  // Aggregate real chronological data points for Recharts
  const chartData = useMemo(() => {
    if (!hasRealData && showSamplePreview) {
      return sampleData;
    }
    if (!hasRealData) {
      return [];
    }

    // Collect all distinct dates
    const dateMap = new Map<string, typeof allScoreEntries>();
    allScoreEntries.forEach((entry) => {
      if (!dateMap.has(entry.date)) {
        dateMap.set(entry.date, []);
      }
      dateMap.get(entry.date)!.push(entry);
    });

    const sortedDates = Array.from(dateMap.keys()).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    // Track running cumulative totals for each course
    const courseRunningTotals: Record<string, { totalScore: number; count: number }> = {};
    units.forEach((u) => {
      courseRunningTotals[u.id] = { totalScore: 0, count: 0 };
    });

    return sortedDates.map((d) => {
      const entriesOnDate = dateMap.get(d) || [];
      const parts = d.split("-");
      const displayDate = parts.length === 3 ? `${parts[1]}/${parts[2]}` : d;

      const row: Record<string, any> = {
        date: d,
        displayDate,
        fullDate: new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      };

      // Calculate per-date or cumulative scores for each course
      units.forEach((u) => {
        const courseEntriesOnDate = entriesOnDate.filter((e) => e.courseId === u.id);

        if (calculationMode === "cumulative") {
          if (courseEntriesOnDate.length > 0) {
            courseEntriesOnDate.forEach((e) => {
              courseRunningTotals[u.id].totalScore += e.percentage;
              courseRunningTotals[u.id].count += 1;
            });
          }
          if (courseRunningTotals[u.id].count > 0) {
            row[u.id] = Math.round(
              courseRunningTotals[u.id].totalScore / courseRunningTotals[u.id].count
            );
            row[`${u.id}_count`] = courseRunningTotals[u.id].count;
          } else {
            row[u.id] = null;
          }
        } else {
          // Session / Per-date average
          if (courseEntriesOnDate.length > 0) {
            const sum = courseEntriesOnDate.reduce((acc, curr) => acc + curr.percentage, 0);
            row[u.id] = Math.round(sum / courseEntriesOnDate.length);
            row[`${u.id}_count`] = courseEntriesOnDate.length;
            row[`${u.id}_tests`] = courseEntriesOnDate.map((e) => e.name);
          } else {
            row[u.id] = null;
          }
        }
      });

      return row;
    });
  }, [allScoreEntries, units, calculationMode, hasRealData, showSamplePreview, sampleData]);

  // Overall Statistics for KPIs
  const stats = useMemo(() => {
    if (!hasRealData && !showSamplePreview) {
      return {
        totalQuizzes: 0,
        overallAvg: null,
        topCourse: null,
        coursesWithDataCount: 0,
      };
    }

    const dataSource = hasRealData
      ? allScoreEntries
      : sampleData.flatMap((d) =>
          units.slice(0, 4).map((u) => ({
            courseId: u.id,
            percentage: d[u.id] as number,
          }))
        );

    const total = dataSource.length;
    if (total === 0) {
      return { totalQuizzes: 0, overallAvg: null, topCourse: null, coursesWithDataCount: 0 };
    }

    const overallAvg = Math.round(
      dataSource.reduce((acc, curr) => acc + curr.percentage, 0) / total
    );

    // Compute per-course averages
    const courseStats: Record<string, { total: number; count: number }> = {};
    dataSource.forEach((item) => {
      if (!courseStats[item.courseId]) {
        courseStats[item.courseId] = { total: 0, count: 0 };
      }
      courseStats[item.courseId].total += item.percentage;
      courseStats[item.courseId].count += 1;
    });

    let bestUnitId: string | null = null;
    let bestAvg = -1;

    Object.entries(courseStats).forEach(([uId, data]) => {
      const avg = Math.round(data.total / data.count);
      if (avg > bestAvg) {
        bestAvg = avg;
        bestUnitId = uId;
      }
    });

    const topUnit = units.find((u) => u.id === bestUnitId);

    return {
      totalQuizzes: total,
      overallAvg,
      topCourse: topUnit ? { unit: topUnit, avg: bestAvg } : null,
      coursesWithDataCount: Object.keys(courseStats).length,
    };
  }, [hasRealData, showSamplePreview, allScoreEntries, sampleData, units]);

  // Toggle individual course visibility
  const toggleCourseVisibility = (courseId: string) => {
    setHiddenCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        // Prevent hiding all courses
        if (next.size + 1 < units.length) {
          next.add(courseId);
        }
      }
      return next;
    });
  };

  const showAllCourses = () => {
    setHiddenCourseIds(new Set());
  };

  // Helper for Kenyan honors tier
  const getHonorsTier = (score: number) => {
    if (score >= 70) return { label: "First Class (Distinction)", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/60" };
    if (score >= 60) return { label: "Second Class Upper", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/60" };
    if (score >= 50) return { label: "Second Class Lower (Pass)", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/60" };
    return { label: "Below Pass Mark (<50%)", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/60" };
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Average Quiz Scores Over Time by Course
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Comparative academic performance curves plotting mastery progression across every registered unit.
          </p>
        </div>

        {/* Action and Display Toggle Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Filter Scope Toggle */}
          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setFilterScope("quizzes_only")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                filterScope === "quizzes_only"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Quizzes Only
            </button>
            <button
              type="button"
              onClick={() => setFilterScope("all_assessments")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                filterScope === "all_assessments"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              All Assessments
            </button>
          </div>

          {/* Cumulative vs Session Average */}
          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setCalculationMode("cumulative")}
              title="Smooth cumulative moving average showing true progress over the semester"
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                calculationMode === "cumulative"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Cumulative Trend
            </button>
            <button
              type="button"
              onClick={() => setCalculationMode("session")}
              title="Per-date average score for each testing session"
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                calculationMode === "session"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Date Score
            </button>
          </div>

          {!hasRealData && (
            <button
              type="button"
              onClick={() => setShowSamplePreview((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                showSamplePreview
                  ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750"
              }`}
            >
              <span className="inline-flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-indigo-500" />
                {showSamplePreview ? "Hide Preview" : "Preview Curve"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-850/80 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Overall Average
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">
              {stats.overallAvg !== null ? `${stats.overallAvg}%` : "—"}
            </span>
            {stats.overallAvg !== null && (
              <span className={`text-[10px] font-medium ${getHonorsTier(stats.overallAvg).color}`}>
                {stats.overallAvg >= 70 ? "First Class" : stats.overallAvg >= 50 ? "Pass" : "Focus"}
              </span>
            )}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-850/80 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Top Performing Course
          </span>
          <div className="mt-0.5 truncate">
            {stats.topCourse ? (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {stats.topCourse.unit.unitCode || stats.topCourse.unit.code || stats.topCourse.unit.title}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {stats.topCourse.avg}%
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-400 font-medium">No tests logged</span>
            )}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-850/80 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Assessments Tracked
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">
              {stats.totalQuizzes}
            </span>
            <span className="text-[10px] text-slate-400">entries</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-850/80 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Target Benchmark
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              &ge; 70%
            </span>
            <span className="text-[10px] text-slate-400">Distinction target</span>
          </div>
        </div>
      </div>

      {/* Interactive Course Visibility Filter Pills */}
      {units.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Toggle Courses:</span>
          </span>

          {units.map((unit, idx) => {
            const isHidden = hiddenCourseIds.has(unit.id);
            const lineColor = unit.color || COURSE_PALETTE[idx % COURSE_PALETTE.length];
            const displayCode = unit.unitCode || unit.code || unit.title;

            return (
              <button
                key={unit.id}
                type="button"
                onClick={() => toggleCourseVisibility(unit.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  !isHidden
                    ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700 shadow-2xs"
                    : "bg-slate-50 dark:bg-slate-850 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 line-through opacity-60"
                }`}
                title={`Click to ${isHidden ? "show" : "hide"} ${unit.title} line`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: lineColor }}
                />
                <span className="truncate max-w-[140px]">{displayCode}</span>
              </button>
            );
          })}

          {hiddenCourseIds.size > 0 && (
            <button
              type="button"
              onClick={showAllCourses}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline ml-1 font-medium cursor-pointer"
            >
              Reset view
            </button>
          )}
        </div>
      )}

      {/* Chart Canvas Area */}
      {units.length === 0 ? (
        <div className="h-64 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center text-xs text-slate-500 dark:text-slate-400">
          <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            No courses enrolled yet
          </p>
          <p className="max-w-md mt-1 text-[11px] text-slate-400">
            Add academic units under "Courses &amp; Units" to begin tracking your quiz scores and progress over time.
          </p>
        </div>
      ) : !hasRealData && !showSamplePreview ? (
        <div className="h-72 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/20 dark:bg-indigo-950/10 flex flex-col items-center justify-center p-6 text-center space-y-3">
          <div className="p-3 rounded-full bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/60 shadow-xs">
            <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              No Quiz Scores Logged Yet
            </h3>
            <p className="max-w-md mt-1 text-xs text-slate-500 dark:text-slate-400">
              Complete revision quizzes in the Library or record Continuous Assessment Test marks to see multi-course performance curves plotted over time.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenLogModal(units[0]?.id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Log First Quiz Score</span>
            </button>
            {onNavigateToLibrary && (
              <button
                type="button"
                onClick={onNavigateToLibrary}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span>Take Revision Quiz in Library</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowSamplePreview(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Preview Demo Trajectory</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {!hasRealData && showSamplePreview && (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 text-xs text-indigo-800 dark:text-indigo-300">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>
                  <strong>Demo Academic Curve:</strong> Demonstrating multi-unit trajectory with Kenyan Honours benchmarks. Log a real quiz score to replace this preview.
                </span>
              </span>
              <button
                type="button"
                onClick={() => onOpenLogModal(units[0]?.id)}
                className="font-semibold underline ml-2 hover:text-indigo-950 dark:hover:text-indigo-100 shrink-0 cursor-pointer"
              >
                Log Real Score
              </button>
            </div>
          )}

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 12, right: 24, left: -12, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                  dy={6}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 70, 85, 100]}
                  unit="%"
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                />

                {/* Academic Benchmarks */}
                <ReferenceLine
                  y={70}
                  stroke="#059669"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: "Distinction (≥70%)",
                    position: "insideTopRight",
                    fill: "#059669",
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
                <ReferenceLine
                  y={50}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  strokeWidth={1.2}
                  label={{
                    value: "Pass (50%)",
                    position: "insideBottomRight",
                    fill: "#d97706",
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />

                {/* Rich Custom Tooltip */}
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const pointDate = payload[0]?.payload?.fullDate || label;

                    return (
                      <div className="p-3 bg-slate-900/95 backdrop-blur-xs text-white rounded-xl shadow-xl border border-slate-800 text-xs min-w-[200px] max-w-[calc(100vw-2.5rem)] space-y-2">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                          <span className="font-semibold text-slate-200">{pointDate}</span>
                          <span className="text-[10px] text-slate-400">
                            {calculationMode === "cumulative" ? "Cumulative Avg" : "Date Avg"}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {payload.map((p: any) => {
                            if (p.value === null || p.value === undefined) return null;
                            const unit = units.find((u) => u.id === p.dataKey);
                            const unitTitle = unit?.unitCode || unit?.code || unit?.title || p.name;
                            const scoreVal = Number(p.value);
                            const tier = getHonorsTier(scoreVal);

                            return (
                              <div key={p.dataKey} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: p.stroke || p.color }}
                                  />
                                  <span className="text-slate-300 font-medium truncate">
                                    {unitTitle}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 font-mono">
                                  <span className="font-bold text-white">{scoreVal}%</span>
                                  <span className="text-[10px] text-slate-400">
                                    ({scoreVal >= 70 ? "1st" : scoreVal >= 60 ? "2:1" : scoreVal >= 50 ? "Pass" : "Fail"})
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }}
                />

                {/* Lines for Each Course */}
                {units.map((unit, idx) => {
                  if (hiddenCourseIds.has(unit.id)) return null;
                  const strokeColor = unit.color || COURSE_PALETTE[idx % COURSE_PALETTE.length];

                  return (
                    <Line
                      key={unit.id}
                      type="monotone"
                      dataKey={unit.id}
                      name={unit.unitCode || unit.code || unit.title}
                      stroke={strokeColor}
                      strokeWidth={2.5}
                      connectNulls={true}
                      dot={{ r: 3.5, fill: strokeColor, strokeWidth: 1.5, stroke: "#ffffff" }}
                      activeDot={{ r: 6, strokeWidth: 2, stroke: "#ffffff" }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-emerald-500 rounded" />
              <span>Distinction Target: &ge;70%</span>
              <span className="text-slate-300 dark:text-slate-700 mx-1">&bull;</span>
              <span className="w-2.5 h-0.5 bg-amber-500 rounded" />
              <span>Pass Benchmark: 50%</span>
            </span>
            <span>
              {calculationMode === "cumulative"
                ? "Progressive cumulative curve showing semester mastery trajectory."
                : "Individual session score averages across testing dates."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
