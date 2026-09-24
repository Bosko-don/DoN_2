import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  User as UserIcon,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  Filter,
  CalendarDays,
  ListFilter,
  CheckCircle2,
  Building,
  CalendarClock,
  Share2,
  Download,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { store } from "../services/store";
import { TimetableEntry, DayOfWeek, DAYS_OF_WEEK, Unit } from "../types";
import { ExportTimetableModal } from "./ExportTimetableModal";
import { generateGoogleCalendarUrl } from "../services/timetableExport";

interface TimetableViewProps {
  onOpenAddModal: (defaultDay?: DayOfWeek) => void;
  onOpenEditModal: (entry: TimetableEntry) => void;
  onNavigateToLibraryWithFilter: (unitId: string) => void;
  onNavigateToCourses: () => void;
}

export const TimetableView: React.FC<TimetableViewProps> = ({
  onOpenAddModal,
  onOpenEditModal,
  onNavigateToLibraryWithFilter,
  onNavigateToCourses,
}) => {
  const [timetable, setTimetable] = useState<TimetableEntry[]>(store.getTimetable());
  const [units, setUnits] = useState<Unit[]>(store.getUnits());
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>("all");
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Determine today's day of week
  const todayDayMap: DayOfWeek[] = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const todayDay = todayDayMap[new Date().getDay()];

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setTimetable(store.getTimetable());
      setUnits(store.getUnits());
    });
    return unsub;
  }, []);

  // Calculate duration string e.g. "2 hrs"
  const getDurationHours = (start: string, end: string): number => {
    const [sH, sM] = start.split(":").map(Number);
    const [eH, eM] = end.split(":").map(Number);
    return Math.max(0, (eH * 60 + eM - (sH * 60 + sM)) / 60);
  };

  // Weekly metrics
  const totalSessions = timetable.length;
  const totalWeeklyHours = timetable.reduce(
    (acc, item) => acc + getDurationHours(item.startTime, item.endTime),
    0
  );
  const scheduledUnitIds = new Set(timetable.map((t) => t.unitId));
  const uniqueUnitsCount = scheduledUnitIds.size;

  // Day with most classes
  const dayCounts: Record<DayOfWeek, number> = {
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
    Sunday: 0,
  };
  timetable.forEach((t) => {
    dayCounts[t.day] = (dayCounts[t.day] || 0) + 1;
  });

  const busiestDay = (Object.keys(dayCounts) as DayOfWeek[]).reduce(
    (max, cur) => (dayCounts[cur] > dayCounts[max] ? cur : max),
    "Monday" as DayOfWeek
  );

  // Filtered timetable
  const filteredTimetable = timetable.filter((entry) => {
    if (selectedDayFilter !== "all" && entry.day !== selectedDayFilter) return false;
    if (selectedUnitFilter !== "all" && entry.unitId !== selectedUnitFilter) return false;
    return true;
  });

  // Group by day
  const daysToRender: DayOfWeek[] =
    selectedDayFilter === "all"
      ? (["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as DayOfWeek[])
      : [selectedDayFilter as DayOfWeek];

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Remove this lesson from your timetable?")) {
      store.deleteTimetableEntry(id);
    }
  };

  const handlePrevDay = () => {
    const validDays = DAYS_OF_WEEK;
    if (selectedDayFilter === "all") {
      setSelectedDayFilter(todayDay);
      return;
    }
    const idx = validDays.indexOf(selectedDayFilter as DayOfWeek);
    const prevIdx = (idx - 1 + validDays.length) % validDays.length;
    setSelectedDayFilter(validDays[prevIdx]);
  };

  const handleNextDay = () => {
    const validDays = DAYS_OF_WEEK;
    if (selectedDayFilter === "all") {
      setSelectedDayFilter(todayDay);
      return;
    }
    const idx = validDays.indexOf(selectedDayFilter as DayOfWeek);
    const nextIdx = (idx + 1) % validDays.length;
    setSelectedDayFilter(validDays[nextIdx]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Class Timetable
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
              Weekly Schedule
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Weekly lectures, practical labs, and tutorials linked directly to registered unit records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* View Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5">
            <button
              id="btn-timetable-grid-view"
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Weekly Grid
            </button>
            <button
              id="btn-timetable-list-view"
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Day Agenda
            </button>
          </div>

          <button
            id="btn-export-timetable"
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Export timetable as PDF or sync with Google Calendar (.ics)"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Export / Sync</span>
            <span className="sm:hidden">Export</span>
          </button>

          <button
            id="btn-add-class-top"
            type="button"
            onClick={() => onOpenAddModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lesson</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip: 1 col on mobile, 2 col on tablet, 4 col on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Weekly Sessions</span>
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{totalSessions} sessions</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Across all weekdays</p>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Weekly Lecture Hours</span>
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {totalWeeklyHours.toFixed(1)} hrs
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Total contact hours</p>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Scheduled Units</span>
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {uniqueUnitsCount} / {units.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Registered unit modules</p>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Busiest Day</span>
            <CalendarClock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {totalSessions > 0 ? busiestDay : "None"}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {totalSessions > 0 ? `${dayCounts[busiestDay]} sessions scheduled` : "No sessions added"}
          </p>
        </div>
      </div>

      {/* Filter and Day Pills */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
        {/* Day Selectors */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            id="day-pill-all"
            type="button"
            onClick={() => setSelectedDayFilter("all")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg shrink-0 transition-colors cursor-pointer ${
              selectedDayFilter === "all"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            All Days ({timetable.length})
          </button>

          {DAYS_OF_WEEK.map((d) => {
            const count = dayCounts[d] || 0;
            const isToday = d === todayDay;
            const isSelected = selectedDayFilter === d;
            return (
              <button
                key={d}
                id={`day-pill-${d.toLowerCase()}`}
                type="button"
                onClick={() => setSelectedDayFilter(d)}
                className={`relative px-2.5 py-1 text-xs font-medium rounded-lg shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white font-semibold shadow-2xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <span>{d.slice(0, 3)}</span>
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected
                        ? "bg-indigo-800/80 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {count}
                  </span>
                )}
                {isToday && (
                  <span
                    title="Today"
                    className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-800"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Unit Filter Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            id="timetable-filter-unit-select"
            value={selectedUnitFilter}
            onChange={(e) => setSelectedUnitFilter(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-hidden"
          >
            <option value="all">All Units ({units.length})</option>
            {units.map((u) => {
              const code = u.unitCode || u.code || "";
              return (
                <option key={u.id} value={u.id}>
                  {code ? `${code} - ${u.title || u.name}` : (u.title || u.name)}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Mobile Day-by-Day Quick Switcher (shown on narrow screens) */}
      <div className="flex md:hidden items-center justify-between p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60">
        <button
          type="button"
          onClick={handlePrevDay}
          className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center px-2">
          <div className="text-xs font-bold text-slate-900 dark:text-white">
            {selectedDayFilter === "all" ? "All Days (Weekly Overview)" : selectedDayFilter}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            {selectedDayFilter === "all"
              ? "Showing all weekday classes"
              : `${dayCounts[selectedDayFilter as DayOfWeek] || 0} classes scheduled`}
          </div>
        </div>
        <button
          type="button"
          onClick={handleNextDay}
          className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Next day"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Timetable Content */}
      {viewMode === "grid" ? (
        /* Weekly Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {daysToRender.map((dayName) => {
            const dayLessons = filteredTimetable
              .filter((t) => t.day === dayName)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));
            const isToday = dayName === todayDay;

            return (
              <div
                key={dayName}
                className={`flex flex-col rounded-xl border transition-all ${
                  isToday
                    ? "border-indigo-300 dark:border-indigo-700/80 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                }`}
              >
                {/* Day Header */}
                <div
                  className={`flex items-center justify-between px-3.5 py-2.5 border-b ${
                    isToday
                      ? "border-indigo-200 dark:border-indigo-800/60 bg-indigo-100/50 dark:bg-indigo-950/50"
                      : "border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {dayName}
                    </span>
                    {isToday && (
                      <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Today
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">
                    {dayLessons.length} {dayLessons.length === 1 ? "lesson" : "lessons"}
                  </span>
                </div>

                {/* Day Lessons List */}
                <div className="p-3 flex-1 flex flex-col gap-2.5">
                  {dayLessons.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-8 text-center px-2">
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        No lessons scheduled
                      </p>
                      <button
                        type="button"
                        onClick={() => onOpenAddModal(dayName)}
                        className="mt-2 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        + Add for {dayName.slice(0, 3)}
                      </button>
                    </div>
                  ) : (
                    dayLessons.map((lesson) => {
                      const unit = store.getUnit(lesson.unitId);
                      const unitColor = unit?.color || lesson.color || "#4f46e5";
                      const unitCode = unit?.unitCode || unit?.code || "UNIT";
                      const unitTitle = unit?.title || unit?.name || "Academic Unit";
                      const duration = getDurationHours(lesson.startTime, lesson.endTime);

                      return (
                        <div
                          key={lesson.id}
                          className="group relative p-3 rounded-lg border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800/90 hover:border-indigo-300 dark:hover:border-indigo-600 shadow-2xs transition-all"
                        >
                          {/* Left colored status indicator line */}
                          <div
                            className="absolute left-0 top-2 bottom-2 w-1 rounded-r-sm"
                            style={{ backgroundColor: unitColor }}
                          />

                          {/* Time & Duration */}
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1 pl-1.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {lesson.startTime} – {lesson.endTime}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                              {duration}h
                            </span>
                          </div>

                          {/* Unit Code and Title */}
                          <div className="pl-1.5 mb-2">
                            <span
                              className="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded-sm text-white mb-0.5"
                              style={{ backgroundColor: unitColor }}
                            >
                              {unitCode}
                            </span>
                            <h4
                              title={unitTitle}
                              className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1"
                            >
                              {unitTitle}
                            </h4>
                          </div>

                          {/* Venue & Lecturer */}
                          <div className="pl-1.5 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                            {lesson.venue && (
                              <div className="flex items-center gap-1 line-clamp-1">
                                <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                                <span className="truncate">{lesson.venue}</span>
                              </div>
                            )}
                            {lesson.lecturer && (
                              <div className="flex items-center gap-1 line-clamp-1">
                                <UserIcon className="w-3 h-3 shrink-0 text-slate-400" />
                                <span className="truncate">{lesson.lecturer}</span>
                              </div>
                            )}
                            {lesson.notes && (
                              <p className="text-[10px] text-slate-400 italic line-clamp-1">
                                {lesson.notes}
                              </p>
                            )}
                          </div>

                          {/* Card Hover Actions */}
                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-1 pl-1.5">
                            <button
                              type="button"
                              onClick={() => onNavigateToLibraryWithFilter(lesson.unitId)}
                              title="View unit study materials"
                              className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                            >
                              <BookOpen className="w-3 h-3" />
                              <span>Notes</span>
                            </button>

                            <div className="flex items-center gap-1">
                              <a
                                href={generateGoogleCalendarUrl(lesson, unit, store.getUser())}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Add this lesson to Google Calendar"
                                className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              >
                                <CalendarPlus className="w-3 h-3" />
                              </a>
                              <button
                                type="button"
                                onClick={() => onOpenEditModal(lesson)}
                                title="Edit lesson"
                                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDelete(lesson.id, e)}
                                title="Delete lesson"
                                className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Add Class Button inside Column */}
                  {dayLessons.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onOpenAddModal(dayName)}
                      className="mt-auto py-1.5 text-center text-[11px] font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 transition-colors"
                    >
                      + Add Class
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : filteredTimetable.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No timetable entries yet
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Add your weekly lectures, labs, and tutorials to keep track of lecture schedules and venues.
          </p>
          <button
            onClick={() => onOpenAddModal(todayDay)}
            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Lesson</span>
          </button>
        </div>
      ) : (
        /* Day Agenda List View */
        <div className="space-y-4">
          {daysToRender.map((dayName) => {
            const dayLessons = filteredTimetable
              .filter((t) => t.day === dayName)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));
            const isToday = dayName === todayDay;

            if (dayLessons.length === 0 && selectedDayFilter === "all") return null;

            return (
              <div
                key={dayName}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs"
              >
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/70">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {dayName}
                    </span>
                    {isToday && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Today
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      ({dayLessons.length} {dayLessons.length === 1 ? "lesson" : "lessons"})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenAddModal(dayName)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Lesson</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {dayLessons.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No lessons scheduled for {dayName}.
                    </div>
                  ) : (
                    dayLessons.map((lesson) => {
                      const unit = store.getUnit(lesson.unitId);
                      const unitColor = unit?.color || lesson.color || "#4f46e5";
                      const unitCode = unit?.unitCode || unit?.code || "UNIT";
                      const unitTitle = unit?.title || unit?.name || "Academic Unit";
                      const duration = getDurationHours(lesson.startTime, lesson.endTime);

                      return (
                        <div
                          key={lesson.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors"
                        >
                          <div className="flex items-start sm:items-center gap-3.5">
                            {/* Time badge */}
                            <div className="w-28 shrink-0 flex flex-col text-left">
                              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                {lesson.startTime} - {lesson.endTime}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {duration} hr duration
                              </span>
                            </div>

                            {/* Unit pill and details */}
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className="px-2 py-0.5 text-xs font-bold rounded-sm text-white"
                                  style={{ backgroundColor: unitColor }}
                                >
                                  {unitCode}
                                </span>
                                <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                                  {unitTitle}
                                </h3>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                                {lesson.venue && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                    <span>{lesson.venue}</span>
                                  </span>
                                )}
                                {lesson.lecturer && (
                                  <span className="flex items-center gap-1">
                                    <UserIcon className="w-3 h-3 text-slate-400" />
                                    <span>{lesson.lecturer}</span>
                                  </span>
                                )}
                                {lesson.notes && (
                                  <span className="italic text-slate-400">
                                    Note: {lesson.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <a
                              href={generateGoogleCalendarUrl(lesson, unit, store.getUser())}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Add to Google Calendar"
                            >
                              <CalendarPlus className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Sync</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => onNavigateToLibraryWithFilter(lesson.unitId)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                            >
                              <BookOpen className="w-3 h-3" />
                              <span>View Materials</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenEditModal(lesson)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Edit Lesson"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDelete(lesson.id, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Remove Lesson"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Export & Calendar Sync Modal */}
      <ExportTimetableModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        timetable={filteredTimetable.length > 0 ? filteredTimetable : timetable}
        units={units}
      />
    </div>
  );
};
