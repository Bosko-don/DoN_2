import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Trash2,
  AlertCircle,
  BookOpen,
  Info,
} from "lucide-react";
import { store } from "../services/store";
import { TimetableEntry, DayOfWeek, DAYS_OF_WEEK, Unit } from "../types";

interface TimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryToEdit?: TimetableEntry | null;
  defaultDay?: DayOfWeek;
  onSaved?: (entry: TimetableEntry) => void;
  onDeleted?: (id: string) => void;
  onNavigateToUnits?: () => void;
}

export const TimetableModal: React.FC<TimetableModalProps> = ({
  isOpen,
  onClose,
  entryToEdit,
  defaultDay,
  onSaved,
  onDeleted,
  onNavigateToUnits,
}) => {
  const [units, setUnits] = useState<Unit[]>(store.getUnits());
  const [unitId, setUnitId] = useState<string>("");
  const [day, setDay] = useState<DayOfWeek>("Monday");
  const [startTime, setStartTime] = useState<string>("08:00");
  const [endTime, setEndTime] = useState<string>("10:00");
  const [venue, setVenue] = useState<string>("");
  const [lecturer, setLecturer] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync available units from store
  useEffect(() => {
    setUnits(store.getUnits());
    const unsub = store.subscribe(() => {
      setUnits(store.getUnits());
    });
    return unsub;
  }, []);

  // Determine current day of week if defaultDay not supplied
  useEffect(() => {
    if (!isOpen) return;

    if (entryToEdit) {
      setUnitId(entryToEdit.unitId);
      setDay(entryToEdit.day);
      setStartTime(entryToEdit.startTime);
      setEndTime(entryToEdit.endTime);
      setVenue(entryToEdit.venue || "");
      setLecturer(entryToEdit.lecturer || "");
      setNotes(entryToEdit.notes || "");
    } else {
      // New entry
      const currentUnits = store.getUnits();
      setUnitId(currentUnits.length > 0 ? currentUnits[0].id : "");

      if (defaultDay) {
        setDay(defaultDay);
      } else {
        const todayDayMap: DayOfWeek[] = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        const currentDay = todayDayMap[new Date().getDay()];
        setDay(currentDay);
      }

      setStartTime("08:00");
      setEndTime("10:00");
      setVenue("");
      setLecturer("");
      setNotes("");
    }
    setError(null);
    setIsDeleting(false);
  }, [isOpen, entryToEdit, defaultDay]);

  if (!isOpen) return null;

  // Calculate duration in hours
  const calculateDuration = () => {
    if (!startTime || !endTime) return null;
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const diff = endMinutes - startMinutes;
    if (diff <= 0) return null;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hours === 0) return `${mins} mins`;
    if (mins === 0) return `${hours} hr${hours > 1 ? "s" : ""}`;
    return `${hours}h ${mins}m`;
  };

  const durationStr = calculateDuration();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!unitId) {
      setError("Please select an academic unit for this lesson.");
      return;
    }

    if (!startTime || !endTime) {
      setError("Please enter both start time and end time.");
      return;
    }

    if (endTime <= startTime) {
      setError("End time must be later than start time.");
      return;
    }

    const selectedUnit = units.find((u) => u.id === unitId);

    if (entryToEdit) {
      const updated = store.updateTimetableEntry(entryToEdit.id, {
        unitId,
        day,
        startTime,
        endTime,
        venue: venue.trim() || undefined,
        lecturer: lecturer.trim() || undefined,
        notes: notes.trim() || undefined,
        color: selectedUnit?.color,
      });
      if (updated && onSaved) {
        onSaved(updated);
      }
    } else {
      const created = store.addTimetableEntry({
        unitId,
        day,
        startTime,
        endTime,
        venue: venue.trim() || undefined,
        lecturer: lecturer.trim() || undefined,
        notes: notes.trim() || undefined,
        color: selectedUnit?.color,
      });
      if (created && onSaved) {
        onSaved(created);
      }
    }

    onClose();
  };

  const handleDelete = () => {
    if (!entryToEdit) return;
    store.deleteTimetableEntry(entryToEdit.id);
    if (onDeleted) {
      onDeleted(entryToEdit.id);
    }
    onClose();
  };

  const presetTimes = [
    { label: "08:00 - 10:00 (2h)", start: "08:00", end: "10:00" },
    { label: "10:00 - 12:00 (2h)", start: "10:00", end: "12:00" },
    { label: "11:00 - 13:00 (2h)", start: "11:00", end: "13:00" },
    { label: "14:00 - 16:00 (2h)", start: "14:00", end: "16:00" },
    { label: "16:00 - 18:00 (2h)", start: "16:00", end: "18:00" },
  ];

  const selectedUnit = units.find((u) => u.id === unitId);

  return (
    <div
      id="timetable-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="timetable-modal-content"
        className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 my-2 sm:my-8 max-h-[96vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {entryToEdit ? "Edit Timetable Class" : "Add Class to Timetable"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Linked directly to your university unit records
              </p>
            </div>
          </div>
          <button
            id="btn-close-timetable-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Unit Selection (Feature 3 Linkage) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Academic Unit <span className="text-red-500">*</span>
              </label>
              {units.length === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onNavigateToUnits) onNavigateToUnits();
                  }}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Create unit first
                </button>
              )}
            </div>

            {units.length === 0 ? (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>No registered units found. Please create an academic unit first.</span>
              </div>
            ) : (
              <div className="relative">
                <select
                  id="timetable-unit-select"
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden transition-colors"
                  required
                >
                  {units.map((u) => {
                    const codeStr = u.unitCode || u.code || "";
                    const display = codeStr ? `${codeStr} — ${u.title || u.name}` : (u.title || u.name);
                    return (
                      <option key={u.id} value={u.id}>
                        {display} (Year {u.yearOfStudy || 1})
                      </option>
                    );
                  })}
                </select>
                {selectedUnit && (
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: selectedUnit.color || "#4f46e5" }}
                    />
                    <span>
                      {selectedUnit.unitCode || selectedUnit.code || "Unit"} • {selectedUnit.semester || "Semester 1"}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Day of Week */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Day of the Week <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {DAYS_OF_WEEK.map((d) => {
                const isSelected = day === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDay(d)}
                    className={`px-2 py-1.5 text-xs font-medium rounded-lg border text-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs font-semibold"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750"
                    }`}
                  >
                    {d.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Span */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Class Time <span className="text-red-500">*</span>
              </label>
              {durationStr && (
                <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                  Duration: {durationStr}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Start Time (24h)
                </label>
                <div className="relative">
                  <input
                    id="timetable-start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  End Time (24h)
                </label>
                <div className="relative">
                  <input
                    id="timetable-end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="pt-1 flex flex-wrap gap-1.5">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 self-center">Presets:</span>
              {presetTimes.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setStartTime(p.start);
                    setEndTime(p.end);
                  }}
                  className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  {p.start}-{p.end}
                </button>
              ))}
            </div>
          </div>

          {/* Venue (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Venue / Room <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                id="timetable-venue-input"
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Lecture Theatre 3B, Computer Lab 2, Hall 104"
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden transition-colors"
              />
            </div>
          </div>

          {/* Lecturer (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Lecturer / Instructor <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                id="timetable-lecturer-input"
                type="text"
                value={lecturer}
                onChange={(e) => setLecturer(e.target.value)}
                placeholder="e.g. Dr. Njoroge, Prof. Omondi"
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden transition-colors"
              />
            </div>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Session Notes / Reminders <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              id="timetable-notes-input"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bring lab manual, bring laptop with Linux setup"
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            {entryToEdit ? (
              isDeleting ? (
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                  <span className="text-xs text-red-600 dark:text-red-400">Confirm delete?</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      id="btn-confirm-delete-timetable"
                      type="button"
                      onClick={handleDelete}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDeleting(false)}
                      className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  id="btn-delete-timetable-entry"
                  type="button"
                  onClick={() => setIsDeleting(true)}
                  className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors w-full sm:w-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove class</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-3.5 py-2 sm:py-1.5 text-xs text-center font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 sm:border-transparent"
              >
                Cancel
              </button>
              <button
                id="btn-save-timetable-entry"
                type="submit"
                disabled={units.length === 0}
                className="flex-1 sm:flex-initial justify-center inline-flex items-center gap-1.5 px-4 py-2 sm:py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors"
              >
                <span>{entryToEdit ? "Save Changes" : "Add to Timetable"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
