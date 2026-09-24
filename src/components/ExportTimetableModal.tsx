import React, { useState } from "react";
import {
  X,
  Calendar,
  FileText,
  Download,
  ExternalLink,
  Check,
  Printer,
  ChevronRight,
  Info,
  Clock,
  MapPin,
  User as UserIcon,
  HelpCircle,
  Share2,
} from "lucide-react";
import { TimetableEntry, Unit } from "../types";
import { store } from "../services/store";
import {
  downloadICSTimetable,
  generateGoogleCalendarUrl,
  openGoogleCalendarImport,
  exportTimetablePDF,
} from "../services/timetableExport";

interface ExportTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  timetable: TimetableEntry[];
  units: Unit[];
}

type TabType = "calendar" | "pdf";

export const ExportTimetableModal: React.FC<ExportTimetableModalProps> = ({
  isOpen,
  onClose,
  timetable,
  units,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("calendar");
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // PDF options
  const [pdfOrientation, setPdfOrientation] = useState<"landscape" | "portrait">("landscape");
  const [includeLecturer, setIncludeLecturer] = useState<boolean>(true);
  const [includeVenue, setIncludeVenue] = useState<boolean>(true);
  const [includeNotes, setIncludeNotes] = useState<boolean>(true);
  const [customTitle, setCustomTitle] = useState<string>("WEEKLY ACADEMIC TIMETABLE");
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [showSingleLessonList, setShowSingleLessonList] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(true);

  if (!isOpen) return null;

  const user = store.getUser();
  const unitMap = new Map<string, Unit>();
  units.forEach((u) => unitMap.set(u.id, u));

  // Quick stats
  const totalSessions = timetable.length;
  const totalHours = timetable.reduce((acc, item) => {
    const [sH, sM] = item.startTime.split(":").map(Number);
    const [eH, eM] = item.endTime.split(":").map(Number);
    return acc + Math.max(0, (eH * 60 + eM - (sH * 60 + sM)) / 60);
  }, 0);

  const handleDownloadICS = () => {
    downloadICSTimetable(timetable, units, user);
    setCopiedNotification("Calendar file (.ics) downloaded successfully!");
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      await exportTimetablePDF({
        entries: timetable,
        units: units,
        user: user,
        orientation: pdfOrientation,
        includeLecturer,
        includeVenue,
        includeNotes,
        customTitle: customTitle.trim() || undefined,
      });
      setCopiedNotification("PDF document exported successfully!");
      setTimeout(() => setCopiedNotification(null), 3000);
    } catch (_err) {
      // PDF export handled gracefully
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  return (
    <div
      id="modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden max-h-[96vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Export Timetable</span>
                <span className="px-2 py-0.2 text-[10px] font-semibold rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {totalSessions} Sessions
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sync with external calendar apps or generate a printable PDF document.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 sm:px-5 pt-3 pb-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("calendar")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === "calendar"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Google Calendar / .ICS</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("pdf")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === "pdf"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Printable PDF Schedule</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {copiedNotification && (
            <div className="p-3 text-xs rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-medium">{copiedNotification}</span>
            </div>
          )}

          {/* TAB 1: CALENDAR EXPORT */}
          {activeTab === "calendar" && (
            <div className="space-y-4">
              {/* Primary Call to Action Card */}
              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Universal iCalendar (.ics)
                    </span>
                    <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-300">
                      RFC 5545 Standard
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Imports all {totalSessions} weekly sessions ({totalHours.toFixed(1)} hrs/week) as recurring weekly events with locations, lecturers, and study notes.
                  </p>
                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    <span>• Google Calendar</span>
                    <span>• Apple Calendar</span>
                    <span>• Microsoft Outlook</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-stretch gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadICS}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download .ics File</span>
                  </button>

                  <button
                    type="button"
                    onClick={openGoogleCalendarImport}
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40 rounded-lg transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open Google Calendar</span>
                  </button>
                </div>
              </div>

              {/* Step-by-Step Google Calendar Instructions */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850/50 p-4 space-y-3">
                <div
                  onClick={() => setShowGuide(!showGuide)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <HelpCircle className="w-4 h-4 text-indigo-500" />
                    <span>How to import into Google Calendar (30 seconds)</span>
                  </div>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                    {showGuide ? "Hide" : "Show"}
                  </span>
                </div>

                {showGuide && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 font-bold flex items-center justify-center text-[10px]">
                          1
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Download</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Click <strong>Download .ics File</strong> above to save your timetable file.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 font-bold flex items-center justify-center text-[10px]">
                          2
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Go to Settings</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Open Google Calendar, click the ⚙️ Settings gear, then select <strong>Import & Export</strong>.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 font-bold flex items-center justify-center text-[10px]">
                          3
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Select & Sync</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Choose the downloaded .ics file and click <strong>Import</strong>. Done!
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Individual Lesson Direct Links */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850/50 p-4 space-y-3">
                <div
                  onClick={() => setShowSingleLessonList(!showSingleLessonList)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Add Individual Lessons to Google Calendar
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Want to sync a specific lesson without importing the full calendar?
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400"
                  >
                    {showSingleLessonList ? "Collapse" : `View ${timetable.length} Lessons`}
                  </button>
                </div>

                {showSingleLessonList && (
                  <div className="space-y-2 pt-2 max-h-60 overflow-y-auto pr-1">
                    {timetable.map((item) => {
                      const unit = unitMap.get(item.unitId);
                      const unitCode = unit?.unitCode || unit?.code || "UNIT";
                      const unitTitle = unit?.title || unit?.name || "Academic Unit";
                      const gCalUrl = generateGoogleCalendarUrl(item, unit, user);

                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {unitCode} - {unitTitle}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                              <span>{item.day}</span>
                              <span>•</span>
                              <span>
                                {item.startTime} - {item.endTime}
                              </span>
                              {item.venue && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{item.venue}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <a
                            href={gCalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-md border border-indigo-200 dark:border-indigo-800/80 shrink-0 transition-colors"
                          >
                            <span>Add</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PDF DOCUMENT EXPORT */}
          {activeTab === "pdf" && (
            <div className="space-y-4">
              {/* Document Setup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Orientation */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Page Orientation
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPdfOrientation("landscape")}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        pdfOrientation === "landscape"
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-500 font-semibold"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                      }`}
                    >
                      <div className="w-8 h-5 border-2 border-current rounded-xs mb-0.5" />
                      <span>Landscape (Recommended)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPdfOrientation("portrait")}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        pdfOrientation === "portrait"
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-500 font-semibold"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                      }`}
                    >
                      <div className="w-5 h-8 border-2 border-current rounded-xs mb-0.5" />
                      <span>Portrait</span>
                    </button>
                  </div>
                </div>

                {/* Custom Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Document Title
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. WEEKLY ACADEMIC TIMETABLE"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Will appear prominently in the PDF document header.
                  </p>
                </div>
              </div>

              {/* Inclusion Checkboxes */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Information Columns to Include:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={includeVenue}
                      onChange={(e) => setIncludeVenue(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Venue / Room</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={includeLecturer}
                      onChange={(e) => setIncludeLecturer(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Lecturer Name</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={includeNotes}
                      onChange={(e) => setIncludeNotes(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Lesson Notes</span>
                  </label>
                </div>
              </div>

              {/* Stats Summary Preview */}
              <div className="p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Ready to Generate:
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-3">
                  <span>{totalSessions} Sessions</span>
                  <span>•</span>
                  <span>{totalHours.toFixed(1)} Contact Hours</span>
                  <span>•</span>
                  <span>{user?.term || "Current Semester"}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleBrowserPrint}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print / Save via Browser</span>
                </button>

                <button
                  type="button"
                  disabled={isExportingPDF}
                  onClick={handleExportPDF}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExportingPDF ? "Generating PDF..." : "Download PDF Document"}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span>Formatted according to ISO & RFC 5545 calendar standards.</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
