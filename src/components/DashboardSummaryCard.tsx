import React from "react";
import {
  FolderArchive,
  CalendarClock,
  Award,
  ArrowRight,
  BookOpen,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  Video,
  TrendingUp,
} from "lucide-react";
import { Resource, Result, Quiz, TimetableEntry, DayOfWeek } from "../types";
import { store } from "../services/store";

interface DashboardSummaryCardProps {
  resources: Resource[];
  results: Result[];
  quizzes: Quiz[];
  todayLessons: TimetableEntry[];
  todayDayName: DayOfWeek;
  onNavigateToLibrary: () => void;
  onNavigateToTimetable?: () => void;
  onOpenNewResource?: () => void;
}

export const DashboardSummaryCard: React.FC<DashboardSummaryCardProps> = ({
  resources,
  results,
  quizzes,
  todayLessons,
  todayDayName,
  onNavigateToLibrary,
  onNavigateToTimetable,
  onOpenNewResource,
}) => {
  // 1. Total Resources Captured metrics
  const totalResources = resources.length;
  const notesCount = resources.filter((r) => r.type === "note").length;
  const pdfsCount = resources.filter((r) => r.type === "pdf").length;
  const videosCount = resources.filter((r) => r.type === "video").length;

  // 2. Upcoming Classes Today calculation
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();

  const upcomingClasses = todayLessons.filter((lesson) => {
    const [h, m] = lesson.startTime.split(":").map(Number);
    return h * 60 + m > currentMins;
  });

  const liveClass = todayLessons.find((lesson) => {
    const [sh, sm] = lesson.startTime.split(":").map(Number);
    const [eh, em] = lesson.endTime.split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    return currentMins >= start && currentMins <= end;
  });

  const nextClass = upcomingClasses[0];

  // 3. Average Quiz Score achieved this week (Current calendar week with 7-day rolling window)
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfWeekMs = startOfWeek.getTime();
  const sevenDaysAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;

  // We consider quizzes either within the calendar week or within the rolling past 7 days
  const effectiveWindowMs = Math.min(startOfWeekMs, sevenDaysAgoMs);

  const quizScoresThisWeek: number[] = [];

  // From completed quizzes
  const completedQuizzesThisWeek = quizzes.filter((q) => {
    const dateStr = q.completedAt || q.createdAt;
    if (!dateStr) return false;
    const timeMs = new Date(dateStr).getTime();
    return timeMs >= effectiveWindowMs && q.score !== undefined && q.totalQuestions > 0;
  });

  completedQuizzesThisWeek.forEach((q) => {
    if (q.score !== undefined && q.totalQuestions > 0) {
      quizScoresThisWeek.push(Math.round((q.score / q.totalQuestions) * 100));
    }
  });

  // From results tracker where source is auto_quiz or name includes quiz
  const quizResultsThisWeek = results.filter((r) => {
    const isQuiz = r.source === "auto_quiz" || r.assessmentName.toLowerCase().includes("quiz");
    if (!isQuiz) return false;
    const timeMs = new Date(r.createdAt || r.date).getTime();
    return timeMs >= effectiveWindowMs;
  });

  quizResultsThisWeek.forEach((r) => {
    // Prevent double counting if tied to a quiz in completedQuizzesThisWeek
    if (!r.quizId || !completedQuizzesThisWeek.some((q) => q.id === r.quizId)) {
      quizScoresThisWeek.push(r.percentage);
    }
  });

  const avgQuizScore =
    quizScoresThisWeek.length > 0
      ? Math.round(
          quizScoresThisWeek.reduce((sum, val) => sum + val, 0) / quizScoresThisWeek.length
        )
      : null;

  return (
    <div
      id="dashboard-summary-card"
      className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden"
    >
      {/* Top Banner Header */}
      <div className="px-5 py-3.5 bg-slate-50/70 dark:bg-slate-850/60 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            Study Pulse &amp; Academic Metrics
          </h2>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">•</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
            Active Week Overview
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {todayDayName}
          </span>
        </div>
      </div>

      {/* 3-Column Summary Grid: 1 col on phone/tablet, 3 col on laptop/desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">
        {/* Metric 1: Total Resources Captured */}
        <div className="p-4 sm:p-5 flex flex-col justify-between hover:bg-slate-50/40 dark:hover:bg-slate-850/30 transition-colors group">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <FolderArchive className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Library Materials
                  </span>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">
                    Total Resources Captured
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                Active
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {totalResources}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {totalResources === 1 ? "resource" : "resources"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <FileText className="w-3 h-3 text-blue-500" />
                <span>{notesCount} Notes</span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <FileSpreadsheet className="w-3 h-3 text-red-500" />
                <span>{pdfsCount} PDFs</span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Video className="w-3 h-3 text-amber-500" />
                <span>{videosCount} Videos</span>
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <button
              type="button"
              onClick={onNavigateToLibrary}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer group-hover:translate-x-0.5 transform duration-150"
            >
              <span>Explore Library</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            {onOpenNewResource && (
              <button
                type="button"
                onClick={onOpenNewResource}
                className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                + Add New
              </button>
            )}
          </div>
        </div>

        {/* Metric 2: Upcoming Classes Today */}
        <div className="p-4 sm:p-5 flex flex-col justify-between hover:bg-slate-50/40 dark:hover:bg-slate-850/30 transition-colors group">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    liveClass
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                      : upcomingClasses.length > 0
                      ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <CalendarClock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Timetable Schedule
                  </span>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">
                    Upcoming Classes Today
                  </div>
                </div>
              </div>

              {liveClass ? (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 animate-pulse">
                  Live Now
                </span>
              ) : upcomingClasses.length > 0 ? (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Scheduled
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Done
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {liveClass ? upcomingClasses.length + 1 : upcomingClasses.length}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {liveClass
                  ? "session active / upcoming"
                  : upcomingClasses.length === 1
                  ? "session remaining today"
                  : "sessions remaining today"}
              </span>
            </div>

            {/* Next session or status banner */}
            <div className="mt-3 text-[11px]">
              {liveClass ? (
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-medium truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">
                    In Session: {(() => {
                      const u = store.getUnit(liveClass.unitId);
                      return u?.unitCode || u?.code || u?.title || "Academic Unit";
                    })()} ({liveClass.startTime} - {liveClass.endTime})
                  </span>
                </div>
              ) : nextClass ? (
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium truncate">
                  <Clock className="w-3 h-3 text-blue-500 shrink-0" />
                  <span className="truncate">
                    Next: {(() => {
                      const u = store.getUnit(nextClass.unitId);
                      return u?.unitCode || u?.code || u?.title || "Academic Unit";
                    })()} at {nextClass.startTime}
                    {nextClass.venue ? ` (${nextClass.venue})` : ""}
                  </span>
                </div>
              ) : todayLessons.length > 0 ? (
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span>All {todayLessons.length} sessions completed for today!</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                  <CalendarClock className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>No lectures scheduled for {todayDayName}. Free study day!</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            {onNavigateToTimetable ? (
              <button
                type="button"
                onClick={onNavigateToTimetable}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer group-hover:translate-x-0.5 transform duration-150"
              >
                <span>View Timetable</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="text-[11px] text-slate-400">Full Schedule</span>
            )}
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {todayLessons.length} total today
            </span>
          </div>
        </div>

        {/* Metric 3: Average Quiz Score Achieved This Week */}
        <div className="p-4 sm:p-5 flex flex-col justify-between hover:bg-slate-50/40 dark:hover:bg-slate-850/30 transition-colors group">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Weekly Mastery
                  </span>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">
                    Avg Quiz Score This Week
                  </div>
                </div>
              </div>

              {avgQuizScore !== null ? (
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                    avgQuizScore >= 75
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60"
                      : avgQuizScore >= 50
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60"
                      : "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200/60 dark:border-red-800/60"
                  }`}
                >
                  {avgQuizScore >= 75 ? "Target Met" : "Review"}
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  No Quizzes
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {avgQuizScore !== null ? `${avgQuizScore}%` : "—"}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {avgQuizScore !== null
                  ? `across ${quizScoresThisWeek.length} ${
                      quizScoresThisWeek.length === 1 ? "quiz" : "quizzes"
                    }`
                  : "no quiz attempts"}
              </span>
            </div>

            <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
              {avgQuizScore !== null ? (
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <TrendingUp className="w-3 h-3 text-purple-500 shrink-0" />
                  <span>
                    {avgQuizScore >= 75
                      ? "Excellent retention across recent revision sets."
                      : "Strengthen weak topics with targeted revision."}
                  </span>
                </div>
              ) : (
                <div className="text-slate-400 dark:text-slate-500">
                  Take a revision quiz on any note to log this week's mastery.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <button
              type="button"
              onClick={onNavigateToLibrary}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer group-hover:translate-x-0.5 transform duration-150"
            >
              <span>Practice Notes &amp; Quizzes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-slate-400">Goal: ≥ 75%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
