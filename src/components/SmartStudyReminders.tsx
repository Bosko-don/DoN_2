import React, { useState, useEffect, useMemo } from "react";
import {
  Bell,
  BellRing,
  Clock,
  Calendar,
  CalendarClock,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  X,
  ChevronRight,
  ArrowRight,
  GraduationCap,
  FileText,
  SlidersHorizontal,
  RefreshCw,
  Info,
} from "lucide-react";
import { store } from "../services/store";
import { TimetableEntry, UnitTask, DayOfWeek } from "../types";

export type ReminderCategory = "all" | "classes" | "assignments";

export type ReminderType =
  | "class_live"
  | "class_starting_soon"
  | "class_prep"
  | "assignment_coincidence"
  | "assignment_overdue"
  | "assignment_due_today"
  | "assignment_due_soon"
  | "tomorrow_preview";

export type ReminderUrgency = "urgent" | "high" | "normal";

export interface SmartReminderItem {
  id: string;
  type: ReminderType;
  category: "class" | "assignment";
  urgency: ReminderUrgency;
  title: string;
  subtitle: string;
  detail?: string;
  unitId?: string;
  unitCode?: string;
  unitTitle?: string;
  unitColor?: string;
  timeBadge?: string;
  studyActionLabel?: string;
  venue?: string;
  lecturer?: string;
  timestamp: number;
}

interface SmartStudyRemindersProps {
  onNavigateToLibraryWithFilter?: (unitId: string) => void;
  onNavigateToTimetable?: () => void;
  onNavigateToCourses?: () => void;
  onOpenNewResourceWithUnit?: (unitId: string) => void;
}

const DISMISSED_STORAGE_KEY = "don_dismissed_smart_reminders";

export const SmartStudyReminders: React.FC<SmartStudyRemindersProps> = ({
  onNavigateToLibraryWithFilter,
  onNavigateToTimetable,
  onNavigateToCourses,
  onOpenNewResourceWithUnit,
}) => {
  const [timetable, setTimetable] = useState(store.getTimetable());
  const [tasks, setTasks] = useState(store.getTasks());
  const [units, setUnits] = useState(store.getUnits());
  const [activeCategory, setActiveCategory] = useState<ReminderCategory>("all");
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [browserNotificationStatus, setBrowserNotificationStatus] = useState<string>("default");

  // Dismissed reminders state
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const saved = sessionStorage.getItem(DISMISSED_STORAGE_KEY);
      if (saved) return new Set(JSON.parse(saved));
    } catch {
      // silent
    }
    return new Set();
  });

  // Subscribe to store updates
  useEffect(() => {
    const unsub = store.subscribe(() => {
      setTimetable(store.getTimetable());
      setTasks(store.getTasks());
      setUnits(store.getUnits());
    });
    return unsub;
  }, []);

  // Update clock every 60 seconds to refresh time-based reminders
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Check browser Notification support
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setBrowserNotificationStatus(Notification.permission);
    } else {
      setBrowserNotificationStatus("unsupported");
    }
  }, []);

  const handleRequestBrowserNotification = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setBrowserNotificationStatus(perm);
      } catch {
        setBrowserNotificationStatus("denied");
      }
    }
  };

  const handleDismissReminder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        sessionStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // silent
      }
      return next;
    });
  };

  const handleRestoreDismissed = () => {
    setDismissedIds(new Set());
    try {
      sessionStorage.removeItem(DISMISSED_STORAGE_KEY);
    } catch {
      // silent
    }
  };

  // Generate intelligent study reminders combining Timetable + Assignments
  const allReminders = useMemo(() => {
    const reminders: SmartReminderItem[] = [];
    const now = currentTime;
    const dayNames: DayOfWeek[] = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const todayDay = dayNames[now.getDay()];
    const tomorrowDay = dayNames[(now.getDay() + 1) % 7];

    const curH = now.getHours();
    const curM = now.getMinutes();
    const curTotalMins = curH * 60 + curM;
    const todayDateStr = now.toISOString().slice(0, 10);

    // Calculate tomorrow date string
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowDateStr = tomorrowDate.toISOString().slice(0, 10);

    // 1. Timetable-based Reminders for Today
    const todayLessons = timetable
      .filter((t) => t.day === todayDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    todayLessons.forEach((lesson) => {
      const [sH, sM] = lesson.startTime.split(":").map(Number);
      const [eH, eM] = lesson.endTime.split(":").map(Number);
      const startTotalMins = sH * 60 + sM;
      const endTotalMins = eH * 60 + eM;

      const unit = units.find((u) => u.id === lesson.unitId);
      const unitCode = unit?.unitCode || unit?.code || "Unit";
      const unitTitle = unit?.title || unit?.name || "Class Lecture";
      const unitResources = store.getResources().filter(
        (r) => r.unitId === lesson.unitId || r.courseId === lesson.unitId
      );
      const unitPendingTasks = tasks.filter((t) => t.unitId === lesson.unitId && !t.completed);

      // Check if class is currently in session
      if (curTotalMins >= startTotalMins && curTotalMins <= endTotalMins) {
        reminders.push({
          id: `live_${lesson.id}_${todayDateStr}`,
          type: "class_live",
          category: "class",
          urgency: "urgent",
          title: `Class In Session: ${unitCode}`,
          subtitle: `${unitTitle} • ${lesson.startTime} – ${lesson.endTime}${
            lesson.venue ? ` • Venue: ${lesson.venue}` : ""
          }`,
          detail: `Attending right now? Have your course notes open or review the unit's AI summaries.`,
          unitId: lesson.unitId,
          unitCode,
          unitTitle,
          unitColor: unit?.color || "#6366f1",
          timeBadge: "Live Now",
          studyActionLabel: "Open Lecture Notes",
          venue: lesson.venue,
          lecturer: lesson.lecturer,
          timestamp: startTotalMins,
        });
      }
      // Check if class starts within next 3 hours
      else if (curTotalMins < startTotalMins && startTotalMins - curTotalMins <= 180) {
        const diff = startTotalMins - curTotalMins;
        const diffH = Math.floor(diff / 60);
        const diffM = diff % 60;
        const timeDiffStr = diffH > 0 ? `${diffH}h ${diffM}m` : `${diffM} mins`;
        const isVerySoon = diff <= 45;

        reminders.push({
          id: `upcoming_${lesson.id}_${todayDateStr}`,
          type: "class_starting_soon",
          category: "class",
          urgency: isVerySoon ? "urgent" : "high",
          title: `Starts in ${timeDiffStr}: ${unitCode}`,
          subtitle: `${unitTitle} at ${lesson.venue || "Campus Hall"} (${lesson.startTime})`,
          detail:
            unitResources.length > 0
              ? `Smart Prep: Review ${unitResources.length} saved resources before the lecturer starts.`
              : `Upcoming session with ${lesson.lecturer || "your lecturer"}. Be ready at ${lesson.venue || "class"}.`,
          unitId: lesson.unitId,
          unitCode,
          unitTitle,
          unitColor: unit?.color || "#6366f1",
          timeBadge: `In ${timeDiffStr}`,
          studyActionLabel: "Review Unit Materials",
          venue: lesson.venue,
          lecturer: lesson.lecturer,
          timestamp: startTotalMins,
        });

        // Trigger native notification if class is very soon and permission granted
        if (isVerySoon && typeof window !== "undefined" && "Notification" in window) {
          if (Notification.permission === "granted") {
            try {
              // Notification deduplication through local session flag
              const notifiedKey = `notified_${lesson.id}_${todayDateStr}`;
              if (!sessionStorage.getItem(notifiedKey)) {
                new Notification(`Lesson Reminder: ${unitCode}`, {
                  body: `Your ${unitCode} lesson starts in ${timeDiffStr} at ${lesson.venue || "Campus"}.`,
                  icon: "/icon.png",
                });
                sessionStorage.setItem(notifiedKey, "true");
              }
            } catch {
              // silent
            }
          }
        }
      }

      // Check for Pending Assignment coincidence with today's timetable class!
      if (unitPendingTasks.length > 0) {
        const mostUrgentTask = unitPendingTasks[0];
        reminders.push({
          id: `coincidence_${lesson.id}_${mostUrgentTask.id}`,
          type: "assignment_coincidence",
          category: "assignment",
          urgency: "urgent",
          title: `Pending Assignment for ${unitCode}`,
          subtitle: `"${mostUrgentTask.title}" • Class meets today at ${lesson.startTime}`,
          detail: `You have ${unitCode} on today's timetable. Verify this assignment is completed or ready to submit.`,
          unitId: lesson.unitId,
          unitCode,
          unitTitle,
          unitColor: unit?.color || "#6366f1",
          timeBadge: `Class Today (${lesson.startTime})`,
          studyActionLabel: "View Unit Tasks",
          timestamp: startTotalMins - 10,
        });
      }
    });

    // 2. Pending Assignments Analysis
    const pendingTasks = tasks.filter((t) => !t.completed);
    pendingTasks.forEach((task) => {
      const unit = units.find((u) => u.id === task.unitId);
      const unitCode = unit?.unitCode || unit?.code || "Unit";
      const unitTitle = unit?.title || unit?.name || "Academic Unit";

      if (task.dueDate) {
        if (task.dueDate < todayDateStr) {
          // Overdue assignment
          reminders.push({
            id: `overdue_${task.id}`,
            type: "assignment_overdue",
            category: "assignment",
            urgency: "urgent",
            title: `Overdue Assignment: ${task.title}`,
            subtitle: `${unitCode} • Due date was ${task.dueDate}`,
            detail: `Priority: ${task.priority.toUpperCase()} • Submit as soon as possible to avoid CAT penalties.`,
            unitId: task.unitId,
            unitCode,
            unitTitle,
            unitColor: unit?.color || "#ef4444",
            timeBadge: "Overdue",
            studyActionLabel: "Open Unit Tasks",
            timestamp: 0,
          });
        } else if (task.dueDate === todayDateStr) {
          // Due Today
          reminders.push({
            id: `due_today_${task.id}`,
            type: "assignment_due_today",
            category: "assignment",
            urgency: "urgent",
            title: `Due Today: ${task.title}`,
            subtitle: `${unitCode} • Due by end of day (${task.dueDate})`,
            detail: `Priority: ${task.priority.toUpperCase()} • Review and submit before deadline.`,
            unitId: task.unitId,
            unitCode,
            unitTitle,
            unitColor: unit?.color || "#f59e0b",
            timeBadge: "Due Today",
            studyActionLabel: "Complete Task",
            timestamp: 10,
          });
        } else if (task.dueDate === tomorrowDateStr) {
          // Due Tomorrow
          reminders.push({
            id: `due_tomorrow_${task.id}`,
            type: "assignment_due_soon",
            category: "assignment",
            urgency: "high",
            title: `Due Tomorrow: ${task.title}`,
            subtitle: `${unitCode} • Due tomorrow (${task.dueDate})`,
            detail: `Priority: ${task.priority.toUpperCase()} • Finish up your work this evening.`,
            unitId: task.unitId,
            unitCode,
            unitTitle,
            unitColor: unit?.color || "#6366f1",
            timeBadge: "Due Tomorrow",
            studyActionLabel: "View Assignment",
            timestamp: 20,
          });
        }
      }
    });

    // 3. Tomorrow's Class Preview (if no live or upcoming classes right now)
    const activeClassesToday = todayLessons.filter((l) => {
      const [eH, eM] = l.endTime.split(":").map(Number);
      return eH * 60 + eM >= curTotalMins;
    });

    if (activeClassesToday.length === 0) {
      const tomorrowLessons = timetable
        .filter((t) => t.day === tomorrowDay)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      if (tomorrowLessons.length > 0) {
        const firstTomorrow = tomorrowLessons[0];
        const unit = units.find((u) => u.id === firstTomorrow.unitId);
        const unitCode = unit?.unitCode || unit?.code || "Unit";
        const unitTitle = unit?.title || unit?.name || "Lecture";

        reminders.push({
          id: `tomorrow_preview_${firstTomorrow.id}`,
          type: "tomorrow_preview",
          category: "class",
          urgency: "normal",
          title: `Tomorrow's First Lecture: ${unitCode}`,
          subtitle: `${unitTitle} • Starts tomorrow at ${firstTomorrow.startTime}${
            firstTomorrow.venue ? ` in ${firstTomorrow.venue}` : ""
          }`,
          detail: `Smart Prep: Preview the unit syllabus or topic notes this evening to stay ahead.`,
          unitId: firstTomorrow.unitId,
          unitCode,
          unitTitle,
          unitColor: unit?.color || "#6366f1",
          timeBadge: `Tomorrow ${firstTomorrow.startTime}`,
          studyActionLabel: "Preview Unit Notes",
          venue: firstTomorrow.venue,
          lecturer: firstTomorrow.lecturer,
          timestamp: 999,
        });
      }
    }

    // Sort by urgency: urgent -> high -> normal
    const urgencyOrder: Record<ReminderUrgency, number> = {
      urgent: 0,
      high: 1,
      normal: 2,
    };

    return reminders.sort((a, b) => {
      const diffUrgency = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (diffUrgency !== 0) return diffUrgency;
      return a.timestamp - b.timestamp;
    });
  }, [timetable, tasks, units, currentTime]);

  // Filter out dismissed reminders
  const activeReminders = useMemo(() => {
    return allReminders.filter((r) => !dismissedIds.has(r.id));
  }, [allReminders, dismissedIds]);

  // Filter by category tab
  const displayedReminders = useMemo(() => {
    if (activeCategory === "classes") {
      return activeReminders.filter((r) => r.category === "class");
    }
    if (activeCategory === "assignments") {
      return activeReminders.filter((r) => r.category === "assignment");
    }
    return activeReminders;
  }, [activeReminders, activeCategory]);

  const classCount = activeReminders.filter((r) => r.category === "class").length;
  const assignmentCount = activeReminders.filter((r) => r.category === "assignment").length;

  if (activeReminders.length === 0 && dismissedIds.size === 0) {
    // When no urgent reminders are active, render a compact status card
    return (
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                All Caught Up!
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                Timetable Synced
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              No imminent lessons or overdue assignments right now. Continue your self-paced study or log CAT scores.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onNavigateToTimetable && (
            <button
              onClick={onNavigateToTimetable}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <CalendarClock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Timetable</span>
            </button>
          )}
          {browserNotificationStatus === "default" && (
            <button
              onClick={handleRequestBrowserNotification}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
              title="Enable browser alerts for upcoming lessons"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Enable Alerts</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      id="smart-study-reminders-hub"
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
    >
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-indigo-50/50 via-white to-white dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <BellRing className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Smart Study Reminders
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {activeReminders.length} Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automated alerts triggered by your weekly timetable and pending assignments.
            </p>
          </div>
        </div>

        {/* Action Controls & Category Selector */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          {/* Categories */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                activeCategory === "all"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              All ({activeReminders.length})
            </button>
            <button
              onClick={() => setActiveCategory("classes")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                activeCategory === "classes"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Lessons ({classCount})
            </button>
            <button
              onClick={() => setActiveCategory("assignments")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                activeCategory === "assignments"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Tasks ({assignmentCount})
            </button>
          </div>

          {/* Browser Notification Permission Button */}
          {browserNotificationStatus === "default" && (
            <button
              onClick={handleRequestBrowserNotification}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
              title="Allow desktop notifications for upcoming lessons"
            >
              <Bell className="w-3 h-3" />
              <span className="hidden sm:inline">Enable Alerts</span>
            </button>
          )}

          {/* Restore Dismissed button */}
          {dismissedIds.size > 0 && (
            <button
              onClick={handleRestoreDismissed}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              title="Restore dismissed alerts"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Restore ({dismissedIds.size})</span>
            </button>
          )}
        </div>
      </div>

      {/* Reminders List */}
      <div className="p-4 space-y-3">
        {displayedReminders.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-850/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
            No active alerts in this category.
          </div>
        ) : (
          displayedReminders.map((reminder) => {
            const isLive = reminder.type === "class_live";
            const isUrgent = reminder.urgency === "urgent";

            return (
              <div
                key={reminder.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 group relative ${
                  isLive
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 shadow-2xs"
                    : isUrgent
                    ? "bg-rose-50/30 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/80 shadow-2xs"
                    : "bg-slate-50/60 dark:bg-slate-850/60 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                }`}
              >
                {/* Left Content */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Icon Badge */}
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isLive
                        ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300"
                        : reminder.category === "class"
                        ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                        : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {isLive ? (
                      <Clock className="w-4 h-4 animate-spin" style={{ animationDuration: "6s" }} />
                    ) : reminder.category === "class" ? (
                      <CalendarClock className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                  </div>

                  {/* Text details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                        {reminder.title}
                      </span>
                      {reminder.timeBadge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isLive
                              ? "bg-emerald-600 text-white animate-pulse"
                              : isUrgent
                              ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                              : "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                          }`}
                        >
                          {reminder.timeBadge}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {reminder.subtitle}
                    </p>

                    {reminder.detail && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span>{reminder.detail}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-800 w-full sm:w-auto justify-end">
                  {reminder.unitId && onNavigateToLibraryWithFilter && (
                    <button
                      type="button"
                      onClick={() => onNavigateToLibraryWithFilter(reminder.unitId!)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 rounded-lg transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{reminder.studyActionLabel || "Study Notes"}</span>
                    </button>
                  )}

                  {reminder.category === "class" && onNavigateToTimetable && (
                    <button
                      type="button"
                      onClick={onNavigateToTimetable}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-750 rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                      title="View in full timetable"
                    >
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="hidden sm:inline">Timetable</span>
                    </button>
                  )}

                  {reminder.category === "assignment" && onNavigateToCourses && (
                    <button
                      type="button"
                      onClick={onNavigateToCourses}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-750 rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                      title="View unit tasks in courses"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      <span className="hidden sm:inline">Unit Tasks</span>
                    </button>
                  )}

                  {/* Dismiss button */}
                  <button
                    type="button"
                    onClick={(e) => handleDismissReminder(reminder.id, e)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                    title="Dismiss reminder for this session"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
