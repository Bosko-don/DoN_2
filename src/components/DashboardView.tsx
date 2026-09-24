import React, { useState, useEffect } from "react";
import {
  FolderArchive,
  GraduationCap,
  LineChart,
  FileText,
  FileSpreadsheet,
  Video,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  User as UserIcon,
  CalendarClock,
  Plus,
  Edit2,
} from "lucide-react";
import { store } from "../services/store";
import { fetchAIRecommendations, RecommendationsResponse } from "../services/api";
import { AIBadge } from "./AIBadge";
import { Resource, Result, TimetableEntry, DayOfWeek, DAYS_OF_WEEK, Quiz } from "../types";
import { DashboardSkeleton, RecommendationsSkeleton } from "./Skeletons";
import { ActiveUnitsSummary } from "./ActiveUnitsSummary";
import { SmartStudyReminders } from "./SmartStudyReminders";
import { DashboardSummaryCard } from "./DashboardSummaryCard";

interface DashboardViewProps {
  onNavigateToLibrary: () => void;
  onNavigateToTracker: () => void;
  onNavigateToCourses: () => void;
  onNavigateToTimetable?: () => void;
  onOpenResource: (resource: Resource) => void;
  onOpenNewResource: () => void;
  onOpenNewResourceWithUnit?: (unitId: string) => void;
  onOpenLogScore: () => void;
  onOpenAddTimetable?: (defaultDay?: DayOfWeek) => void;
  onOpenEditTimetable?: (entry: TimetableEntry) => void;
  onNavigateToLibraryWithFilter?: (unitId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToLibrary,
  onNavigateToTracker,
  onNavigateToCourses,
  onNavigateToTimetable,
  onOpenResource,
  onOpenNewResource,
  onOpenNewResourceWithUnit,
  onOpenLogScore,
  onOpenAddTimetable,
  onOpenEditTimetable,
  onNavigateToLibraryWithFilter,
}) => {
  const [units, setUnits] = useState(store.getUnits());
  const [resources, setResources] = useState(store.getResources());
  const [results, setResults] = useState(store.getResults());
  const [quizzes, setQuizzes] = useState<Quiz[]>(store.getQuizzes());
  const [timetable, setTimetable] = useState(store.getTimetable());
  const [recommendationsData, setRecommendationsData] = useState<RecommendationsResponse | null>(null);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [isStoreLoading, setIsStoreLoading] = useState(true);

  // Today's lessons calculation
  const todayInfo = store.getTodayLessons();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(todayInfo.todayName);

  useEffect(() => {
    // Smooth perceived loading state on view mount
    const timer = setTimeout(() => {
      setIsStoreLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setUnits(store.getUnits());
      setResources(store.getResources());
      setResults(store.getResults());
      setQuizzes(store.getQuizzes());
      setTimetable(store.getTimetable());
    });
    return unsub;
  }, []);

  // Load AI recommendations based on weak topics for CAT and Final Exam prep
  const loadRecommendations = async () => {
    setIsLoadingRecs(true);
    try {
      const stats = store.getTopicPerformanceStats();
      // Weak topics: average score below 75% or lowest scores
      const weak = stats.filter((s) => s.avgScore < 75);
      const targetWeak = weak.length > 0 ? weak : stats.slice(0, 2);

      const payloadWeak = targetWeak.map((w) => ({
        topicName: w.topicName,
        avgScore: w.avgScore,
        assessmentsCount: w.count,
      }));

      const availableRes = store.getResources().map((r) => {
        const topic = store.getTopic(r.topicId);
        return {
          id: r.id,
          title: r.title,
          type: r.type,
          topicName: topic ? topic.name : "Topic",
        };
      });

      const recs = await fetchAIRecommendations(payloadWeak, "Kenyan University Units & Exams", availableRes);
      setRecommendationsData(recs);
    } catch (e) {
      const stats = store.getTopicPerformanceStats();
      const targetWeak = stats.filter((s) => s.avgScore < 75);
      const list = targetWeak.length > 0 ? targetWeak : stats.slice(0, 2);
      const fallbackRecs = list.map((t) => {
        const topicResources = store.getResources().filter((r) => r.topicId === t.topicId);
        const resourcePointers =
          topicResources.length > 0
            ? `Review your saved materials: ${topicResources.map((r) => `"${r.title}"`).join(", ")}.`
            : "Upload reference lecture slides or notes for this topic.";
        return {
          topicName: t.topicName,
          urgency: t.avgScore < 65 ? "High Priority" : "Moderate Priority",
          scoreAnalysis: `Current average score is ${t.avgScore}% across ${t.count} assessment(s).`,
          actionableAdvice: `Strengthen core theoretical grasp on ${t.topicName} before upcoming CATs and final exams. ${resourcePointers}`,
          recommendedResourceIds: topicResources.map((r) => r.id),
        };
      });

      setRecommendationsData({
        generalGuidance: "Prioritize spaced retrieval and targeted revision on unit topics with mastery below 75% for CAT and final exam readiness.",
        recommendations: fallbackRecs,
        generatedAt: new Date().toISOString(),
        isSimulated: true,
      });
    } finally {
      setIsLoadingRecs(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [results.length]);

  // Overall metric calculations
  const totalResources = resources.length;
  const recentResources = [...resources].slice(0, 4);
  const recentResults = [...results].slice(0, 4);

  const avgScore =
    results.length > 0
      ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / results.length)
      : null;

  if (isStoreLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Academic Overview Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Academic Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Organized study materials, CAT &amp; exam trends, and diagnostic AI recommendations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenLogScore}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Log CAT / Exam</span>
          </button>
          <button
            onClick={onOpenNewResource}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Resource</span>
          </button>
        </div>
      </div>

      {/* Smart Timetable & Assignment Study Reminders */}
      <SmartStudyReminders
        onNavigateToLibraryWithFilter={onNavigateToLibraryWithFilter}
        onNavigateToTimetable={onNavigateToTimetable}
        onNavigateToCourses={onNavigateToCourses}
        onOpenNewResourceWithUnit={onOpenNewResourceWithUnit}
      />

      {/* Dashboard Summary Card: Resources Captured, Upcoming Classes Today, Avg Quiz Score This Week */}
      <DashboardSummaryCard
        resources={resources}
        results={results}
        quizzes={quizzes}
        todayLessons={todayInfo.lessons}
        todayDayName={todayInfo.todayName}
        onNavigateToLibrary={onNavigateToLibrary}
        onNavigateToTimetable={onNavigateToTimetable}
        onOpenNewResource={onOpenNewResource}
      />

      {/* Metrics Row: 1 col on mobile, 2 col on tablet, 4 col on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Units</span>
            <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{units.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Active university units</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Resources</span>
            <FolderArchive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalResources}</div>
          <p className="text-[11px] text-slate-400 mt-1">Notes, PDFs, and videos</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Assessments</span>
            <LineChart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{results.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Logged CATs and exams</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Average Performance</span>
            <span
              className={`text-xs font-semibold ${
                avgScore && avgScore >= 75
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {avgScore ? `${avgScore}%` : "—"}
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {avgScore !== null ? `${avgScore}%` : "N/A"}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across all tagged unit topics</p>
        </div>
      </div>

      {/* Active Units Summary: Resources & Pending Tasks */}
      <ActiveUnitsSummary
        onNavigateToLibraryWithFilter={onNavigateToLibraryWithFilter}
        onNavigateToCourses={onNavigateToCourses}
        onOpenNewResourceWithUnit={onOpenNewResourceWithUnit || onOpenNewResource}
      />

      {/* Feature 16: Today's Lessons Timetable Widget */}
      {(() => {
        const todayDay = todayInfo.todayName;
        const isSelectedDayToday = selectedDay === todayDay;
        const displayedLessons = store.getTimetableByDay(selectedDay);

        // Helper to check live / upcoming / completed status if today
        const getLessonStatus = (startTime: string, endTime: string) => {
          if (!isSelectedDayToday) return null;
          const now = new Date();
          const currentH = now.getHours();
          const currentM = now.getMinutes();
          const curMins = currentH * 60 + currentM;

          const [sH, sM] = startTime.split(":").map(Number);
          const [eH, eM] = endTime.split(":").map(Number);
          const startMins = sH * 60 + sM;
          const endMins = eH * 60 + eM;

          if (curMins >= startMins && curMins <= endMins) {
            return {
              type: "live" as const,
              label: "In Session Now",
              className: "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
            };
          } else if (curMins < startMins) {
            const diff = startMins - curMins;
            const diffH = Math.floor(diff / 60);
            const diffM = diff % 60;
            const text = diffH > 0 ? `Starts in ${diffH}h ${diffM}m` : `Starts in ${diffM} mins`;
            return {
              type: "upcoming" as const,
              label: text,
              className: "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
            };
          } else {
            return {
              type: "completed" as const,
              label: "Completed",
              className: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700",
            };
          }
        };

        return (
          <div
            id="dashboard-todays-lessons-card"
            className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
          >
            {/* Widget Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {isSelectedDayToday ? "Today's Lessons & Schedule" : `${selectedDay}'s Lessons`}
                    </h2>
                    {isSelectedDayToday && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Today ({todayInfo.dateFormatted.split(",")[0]})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {displayedLessons.length}{" "}
                    {displayedLessons.length === 1 ? "lesson scheduled" : "lessons scheduled"} • Linked to unit records
                  </p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {onOpenAddTimetable && (
                  <button
                    id="btn-add-today-lesson"
                    type="button"
                    onClick={() => onOpenAddTimetable(selectedDay)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Add Class</span>
                  </button>
                )}

                {onNavigateToTimetable && (
                  <button
                    id="btn-view-full-timetable"
                    type="button"
                    onClick={onNavigateToTimetable}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Full Timetable</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Day Selector Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 shrink-0 mr-1">
                Day:
              </span>
              {DAYS_OF_WEEK.map((d) => {
                const count = store.getTimetableByDay(d).length;
                const isDayToday = d === todayDay;
                const isSelected = selectedDay === d;

                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDay(d)}
                    className={`px-2.5 py-1 text-xs rounded-lg shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold shadow-2xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span>{d.slice(0, 3)}</span>
                    {count > 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          isSelected
                            ? "bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                    {isDayToday && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Lessons List for Selected Day */}
            {displayedLessons.length === 0 ? (
              <div className="py-6 px-4 rounded-lg bg-slate-50 dark:bg-slate-850 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isSelectedDayToday
                    ? `No lectures scheduled for today (${selectedDay})! Free time to study or work on coursework.`
                    : `No lessons scheduled for ${selectedDay}.`}
                </p>
                {onOpenAddTimetable && (
                  <button
                    type="button"
                    onClick={() => onOpenAddTimetable(selectedDay)}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Lesson for {selectedDay}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {displayedLessons.map((lesson) => {
                  const unit = store.getUnit(lesson.unitId);
                  const unitColor = unit?.color || lesson.color || "#4f46e5";
                  const unitCode = unit?.unitCode || unit?.code || "UNIT";
                  const unitTitle = unit?.title || unit?.name || "Academic Unit";
                  const status = getLessonStatus(lesson.startTime, lesson.endTime);

                  return (
                    <div
                      key={lesson.id}
                      className="group relative p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex flex-col justify-between"
                    >
                      {/* Left accent border */}
                      <div
                        className="absolute left-0 top-3 bottom-3 w-1 rounded-r"
                        style={{ backgroundColor: unitColor }}
                      />

                      <div className="pl-1.5 space-y-1.5">
                        {/* Top info: Time & Status */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {lesson.startTime} – {lesson.endTime}
                          </span>

                          {status && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md border ${status.className}`}
                            >
                              {status.type === "live" && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                              )}
                              {status.label}
                            </span>
                          )}
                        </div>

                        {/* Unit details */}
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span
                              className="px-1.5 py-0.2 text-[10px] font-bold rounded-sm text-white"
                              style={{ backgroundColor: unitColor }}
                            >
                              {unitCode}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              Year {unit?.yearOfStudy || 1} • {unit?.semester || "Semester 1"}
                            </span>
                          </div>
                          <h3
                            title={unitTitle}
                            className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white line-clamp-1"
                          >
                            {unitTitle}
                          </h3>
                        </div>

                        {/* Venue & Lecturer */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                          {lesson.venue && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{lesson.venue}</span>
                            </span>
                          )}
                          {lesson.lecturer && (
                            <span className="flex items-center gap-1">
                              <UserIcon className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{lesson.lecturer}</span>
                            </span>
                          )}
                        </div>

                        {lesson.notes && (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 italic line-clamp-1">
                            Note: {lesson.notes}
                          </p>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between pl-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateToLibraryWithFilter) {
                              onNavigateToLibraryWithFilter(lesson.unitId);
                            } else {
                              onNavigateToLibrary();
                            }
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Unit Materials</span>
                        </button>

                        {onOpenEditTimetable && (
                          <button
                            type="button"
                            onClick={() => onOpenEditTimetable(lesson)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-750 rounded transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3 text-slate-400" />
                            <span>Edit</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* AI-Generated Recommendations Card */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              AI Study Recommendations
            </h2>
            <AIBadge label="Diagnostic Focus" size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadRecommendations}
              disabled={isLoadingRecs}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
              title="Refresh AI diagnostic recommendations"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingRecs ? "animate-spin text-indigo-600" : ""}`} />
              <span className="text-[11px] font-medium">Re-analyze Weak Topics</span>
            </button>
          </div>
        </div>

        {isLoadingRecs && !recommendationsData ? (
          <RecommendationsSkeleton />
        ) : recommendationsData && recommendationsData.recommendations.length > 0 ? (
          <div className="space-y-3">
            {recommendationsData.generalGuidance && (
              <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                "{recommendationsData.generalGuidance}"
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {recommendationsData.recommendations.map((rec, index) => {
                const linkedResources = resources.filter(
                  (r) => rec.recommendedResourceIds?.includes(r.id)
                );

                return (
                  <div
                    key={index}
                    className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {rec.topicName}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                            rec.urgency.toLowerCase().includes("high")
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
                          }`}
                        >
                          {rec.urgency}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                        {rec.scoreAnalysis}
                      </p>
                      <p className="text-xs text-slate-700 dark:text-slate-200 font-medium">
                        {rec.actionableAdvice}
                      </p>
                    </div>

                    {linkedResources.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-750 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-medium">Review:</span>
                        {linkedResources.map((res) => (
                          <button
                            key={res.id}
                            onClick={() => onOpenResource(res)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition-colors cursor-pointer"
                          >
                            {res.type === "pdf" && <FileSpreadsheet className="w-3 h-3 text-red-500" />}
                            {res.type === "note" && <FileText className="w-3 h-3 text-blue-500" />}
                            {res.type === "video" && <Video className="w-3 h-3 text-amber-500" />}
                            <span className="max-w-[140px] truncate">{res.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 rounded-lg">
            No weak topics detected. Log additional CAT or exam scores to unlock personalized AI study recommendations.
          </div>
        )}
      </div>

      {/* Two Column Grid: Recent Resources & Recent Logged Scores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Added Resources */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Recently Added Resources
                </h2>
              </div>
              <button
                onClick={onNavigateToLibrary}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                View Library
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentResources.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No resources added yet. Click "Add Resource" above.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentResources.map((res) => {
                  const effectiveUnitId = res.unitId || res.courseId || "";
                  const unit = store.getUnit(effectiveUnitId);
                  const topic = store.getTopic(res.topicId);
                  const displayCode = unit?.unitCode || unit?.code || unit?.title || "Unit";

                  return (
                    <div
                      key={res.id}
                      onClick={() => onOpenResource(res)}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50/50 dark:bg-slate-850/50 hover:bg-white dark:hover:bg-slate-850 transition-all cursor-pointer group flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="p-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shrink-0 mt-0.5">
                          {res.type === "pdf" && <FileSpreadsheet className="w-4 h-4 text-rose-500" />}
                          {res.type === "note" && <FileText className="w-4 h-4 text-blue-500" />}
                          {res.type === "video" && <Video className="w-4 h-4 text-amber-500" />}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            {res.title}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">
                              {displayCode}
                            </span>
                            <span>•</span>
                            <span className="truncate">{topic?.name || "Topic"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {res.aiSummary && (
                          <AIBadge label="Summarized" size="sm" />
                        )}
                        <span className="text-[10px] text-slate-400">
                          {new Date(res.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Latest Logged Scores */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <LineChart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Latest Logged CATs &amp; Exams
                </h2>
              </div>
              <button
                onClick={onNavigateToTracker}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                View Tracker
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentResults.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No scores logged yet. Record your CAT or exam marks to monitor academic progression.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentResults.map((item) => {
                  const effectiveUnitId = item.unitId || item.courseId || "";
                  const unit = store.getUnit(effectiveUnitId);
                  const topic = store.getTopic(item.topicId);
                  const displayCode = unit?.unitCode || unit?.code || unit?.title || "Unit";

                  const isHigh = item.percentage >= 80;
                  const isMedium = item.percentage >= 65 && item.percentage < 80;

                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {item.assessmentName}
                          </h3>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {item.assessmentType || "CAT"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">
                            {displayCode}
                          </span>
                          <span>•</span>
                          <span className="truncate">{topic?.name || "Topic"}</span>
                          <span>•</span>
                          <span>{item.date}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-bold rounded ${
                            isHigh
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
                              : isMedium
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300"
                          }`}
                        >
                          {item.percentage}%
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {item.score} / {item.maxScore}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
