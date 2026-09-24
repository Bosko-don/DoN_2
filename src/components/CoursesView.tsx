import React, { useState, useMemo, useEffect } from "react";
import {
  GraduationCap,
  Plus,
  ChevronDown,
  ChevronRight,
  FolderArchive,
  LineChart,
  PlusCircle,
  Trash2,
  BookOpen,
  Filter,
  Calendar,
  Layers,
  Database,
  Loader2,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import { store } from "../services/store";
import { Unit, Topic, Semester } from "../types";
import { TopicProgressChart } from "./TopicProgressChart";

interface CoursesViewProps {
  onNavigateToLibraryWithFilter: (unitId: string, topicId?: string) => void;
  onOpenLogScoreForTopic: (unitId: string, topicId: string) => void;
  onOpenNewResourceForTopic: (unitId: string, topicId: string) => void;
}

export const CoursesView: React.FC<CoursesViewProps> = ({
  onNavigateToLibraryWithFilter,
  onOpenLogScoreForTopic,
  onOpenNewResourceForTopic,
}) => {
  const [units, setUnits] = useState(store.getUnits());
  const [topics, setTopics] = useState(store.getTopics());
  const [expandedUnitIds, setExpandedUnitIds] = useState<string[]>(
    store.getUnits().map((u) => u.id)
  );

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setUnits(store.getUnits());
      setTopics(store.getTopics());
    });
    return unsub;
  }, []);

  // Filters for Kenyan University academic structure
  const [selectedYear, setSelectedYear] = useState<string>("all"); // "all" | "1" | "2" | "3" | "4" | "5"
  const [selectedSemester, setSelectedSemester] = useState<string>("all"); // "all" | "Semester 1" | "Semester 2"

  // New Unit Modal State
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [unitCode, setUnitCode] = useState("");
  const [unitTitle, setUnitTitle] = useState("");
  const [unitDesc, setUnitDesc] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState<number>(2);
  const [semester, setSemester] = useState<Semester>("Semester 1");
  const [unitColor, setUnitColor] = useState("#2563eb");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Topic Modal State
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [targetUnitId, setTargetUnitId] = useState("");
  const [topicName, setTopicName] = useState("");
  const [topicDesc, setTopicDesc] = useState("");

  const refreshData = () => {
    setUnits(store.getUnits());
    setTopics(store.getTopics());
  };

  const toggleExpand = (unitId: string) => {
    if (expandedUnitIds.includes(unitId)) {
      setExpandedUnitIds(expandedUnitIds.filter((id) => id !== unitId));
    } else {
      setExpandedUnitIds([...expandedUnitIds, unitId]);
    }
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const cleanCode = unitCode.trim() ? unitCode.trim().toUpperCase() : undefined;
      const newUnit = store.addUnit({
        unitCode: cleanCode,
        code: cleanCode,
        title: unitTitle.trim(),
        name: unitTitle.trim(),
        description: unitDesc.trim(),
        yearOfStudy: Number(yearOfStudy) || 1,
        semester: semester,
        term: `Year ${yearOfStudy}, ${semester}`,
        color: unitColor,
      });

      setExpandedUnitIds([...expandedUnitIds, newUnit.id]);
      setUnitCode("");
      setUnitTitle("");
      setUnitDesc("");
      setYearOfStudy(2);
      setSemester("Semester 1");
      setIsAddUnitOpen(false);
      refreshData();
    } catch (err) {
      // Handled silently
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUnitId || !topicName.trim()) return;

    store.addTopic({
      unitId: targetUnitId,
      courseId: targetUnitId,
      name: topicName.trim(),
      description: topicDesc.trim(),
    });

    setTopicName("");
    setTopicDesc("");
    setIsAddTopicOpen(false);
    refreshData();
  };

  const handleDeleteUnit = (id: string, name: string) => {
    if (confirm(`Delete unit "${name}" and all its associated topics and study resources?`)) {
      store.deleteUnit(id);
      refreshData();
    }
  };

  const handleDeleteTopic = (id: string, name: string) => {
    if (confirm(`Delete topic "${name}" and its linked resources?`)) {
      store.deleteTopic(id);
      refreshData();
    }
  };

  const resources = store.getResources();
  const results = store.getResults();

  // Filtered units according to selected Year of Study & Semester
  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      if (selectedYear !== "all" && u.yearOfStudy !== Number(selectedYear)) {
        return false;
      }
      if (selectedSemester !== "all" && u.semester !== selectedSemester) {
        return false;
      }
      return true;
    });
  }, [units, selectedYear, selectedSemester]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Units & Topic Organization
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50">
              Kenyan University Structure
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize academic units by Year of Study (Year 1–4/5+) and Semester (Semester 1 &amp; 2) with linked lecture topics, CATs, and final exam prep.
          </p>
        </div>

        <button
          onClick={() => setIsAddUnitOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-center"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Unit</span>
        </button>
      </div>

      {/* Kenyan University Academic Filter Toolbar (Year of Study & Semester) */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            <span>Year of Study:</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg">
            {[
              { id: "all", label: "All Years" },
              { id: "1", label: "Year 1" },
              { id: "2", label: "Year 2" },
              { id: "3", label: "Year 3" },
              { id: "4", label: "Year 4" },
              { id: "5", label: "Year 5+" },
            ].map((yr) => (
              <button
                key={yr.id}
                onClick={() => setSelectedYear(yr.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  selectedYear === yr.id
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {yr.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold">
            <Layers className="w-3.5 h-3.5" />
            <span>Semester:</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg">
            {[
              { id: "all", label: "All Semesters" },
              { id: "Semester 1", label: "Semester 1" },
              { id: "Semester 2", label: "Semester 2" },
            ].map((sem) => (
              <button
                key={sem.id}
                onClick={() => setSelectedSemester(sem.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  selectedSemester === sem.id
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {sem.label}
              </button>
            ))}
          </div>

          {(selectedYear !== "all" || selectedSemester !== "all") && (
            <button
              onClick={() => {
                setSelectedYear("all");
                setSelectedSemester("all");
              }}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline px-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Visual Progress Chart for Study Topics (using Recharts) */}
      <TopicProgressChart
        units={filteredUnits.length > 0 ? filteredUnits : units}
        topics={topics}
        onNavigateToLibraryWithFilter={onNavigateToLibraryWithFilter}
        onOpenLogScoreForTopic={onOpenLogScoreForTopic}
        onTopicProgressUpdated={refreshData}
      />

      {/* Units Accordion List */}
      <div className="space-y-4">
        {filteredUnits.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/40">
            <GraduationCap className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No units found matching this criteria
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Adjust your Year of Study or Semester filters, or add a new unit.
            </p>
            <button
              onClick={() => setIsAddUnitOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Unit</span>
            </button>
          </div>
        ) : (
          filteredUnits.map((unit) => {
            const unitTopics = topics.filter(
              (t) => t.unitId === unit.id || t.courseId === unit.id
            );
            const isExpanded = expandedUnitIds.includes(unit.id);
            const unitResources = resources.filter(
              (r) => r.unitId === unit.id || r.courseId === unit.id
            );
            const unitResults = results.filter(
              (res) => res.unitId === unit.id || res.courseId === unit.id
            );

            const unitAvg =
              unitResults.length > 0
                ? Math.round(
                    unitResults.reduce((acc, r) => acc + r.percentage, 0) / unitResults.length
                  )
                : null;

            const displayCode = unit.unitCode || unit.code;
            const displayTitle = unit.title || unit.name;

            return (
              <div
                key={unit.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden"
              >
                {/* Unit Header Bar */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800">
                  <div
                    onClick={() => toggleExpand(unit.id)}
                    className="flex items-center gap-3 cursor-pointer select-none min-w-0 flex-1"
                  >
                    <button
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                      aria-label="Expand or collapse unit topics"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-slate-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-500" />
                      )}
                    </button>

                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: unit.color || "#6366f1" }}
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {displayCode && (
                          <span className="font-bold text-sm sm:text-base text-indigo-600 dark:text-indigo-400 font-mono tracking-tight bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200/50 dark:border-indigo-800/40">
                            {displayCode}
                          </span>
                        )}
                        <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                          {displayTitle}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          Year {unit.yearOfStudy || 1} • {unit.semester || "Semester 1"}
                        </span>
                      </div>
                      {unit.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                          {unit.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Unit Quick Stats & Actions */}
                  <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        onClick={() => onNavigateToLibraryWithFilter(unit.id)}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400"
                        title="View all study resources for this unit"
                      >
                        {unitResources.length} Resources
                      </button>
                      <span
                        className={`px-2 py-1 text-[11px] font-bold rounded-md ${
                          unitAvg && unitAvg >= 75
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
                            : unitAvg
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                        title="Average score across CATs and exams for this unit"
                      >
                        Avg: {unitAvg !== null ? `${unitAvg}%` : "No scores"}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setTargetUnitId(unit.id);
                        setIsAddTopicOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-md border border-indigo-200/60 dark:border-indigo-800/60 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Topic</span>
                    </button>

                    <button
                      onClick={() => handleDeleteUnit(unit.id, displayCode || displayTitle)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Delete unit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Topics Under Unit */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 divide-y divide-slate-100 dark:divide-slate-800/80">
                    {unitTopics.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No topics added for this unit yet. Click "Add Topic" to structure your syllabus modules.
                      </div>
                    ) : (
                      unitTopics.map((topic) => {
                        const topicResources = resources.filter(
                          (r) => r.topicId === topic.id
                        );
                        const topicResults = results.filter(
                          (res) => res.topicId === topic.id
                        );

                        const topicAvg =
                          topicResults.length > 0
                            ? Math.round(
                                topicResults.reduce((acc, r) => acc + r.percentage, 0) /
                                  topicResults.length
                              )
                            : null;

                        const isWeakTopic = topicAvg !== null && topicAvg < 75;
                        const topicCompletion = store.getTopicCompletion(topic.id);

                        return (
                          <div
                            key={topic.id}
                            className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                                  {topic.name}
                                </h4>
                                {isWeakTopic && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300">
                                    CAT / Exam Focus (&lt;75%)
                                  </span>
                                )}
                              </div>
                              {topic.description && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                  {topic.description}
                                </p>
                              )}

                              {/* Topic Syllabus Completion Progress Indicator */}
                              <div className="flex items-center gap-2 mt-1.5">
                                <div className="w-24 sm:w-32 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{
                                      width: `${topicCompletion}%`,
                                      backgroundColor:
                                        topicCompletion >= 75
                                          ? "#10b981"
                                          : topicCompletion >= 40
                                          ? unit.color || "#6366f1"
                                          : "#f59e0b",
                                    }}
                                  />
                                </div>
                                <span className="text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-400">
                                  {topicCompletion}% complete
                                </span>
                                <button
                                  onClick={() => {
                                    const next = topicCompletion >= 100 ? 0 : Math.min(100, topicCompletion + 10);
                                    store.updateTopicProgress(topic.id, next);
                                    refreshData();
                                  }}
                                  className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Quick bump completion +10% (resets to 0% if at 100%)"
                                >
                                  +10%
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              <button
                                onClick={() =>
                                  onNavigateToLibraryWithFilter(unit.id, topic.id)
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                                title="Browse notes and files in this topic"
                              >
                                <FolderArchive className="w-3 h-3 text-slate-500" />
                                <span>{topicResources.length} items</span>
                              </button>

                              <button
                                onClick={() => onOpenLogScoreForTopic(unit.id, topic.id)}
                                className={`px-2 py-1 text-[11px] font-bold rounded ${
                                  topicAvg !== null
                                    ? isWeakTopic
                                      ? "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300"
                                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
                                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                }`}
                                title="Click to log CAT or exam marks for this topic"
                              >
                                {topicAvg !== null ? `${topicAvg}% avg` : "Log CAT / Exam"}
                              </button>

                              <button
                                onClick={() =>
                                  onOpenNewResourceForTopic(unit.id, topic.id)
                                }
                                className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                                title="Add resource to this topic"
                              >
                                <PlusCircle className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDeleteTopic(topic.id, topic.name)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600"
                                title="Delete topic"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Unit Modal (Kenyan University Academic Spec & Firestore Persistence) */}
      {isAddUnitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md max-h-[96vh] sm:max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in-50 duration-200">
            <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Create Academic Unit</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                    <Database className="w-2.5 h-2.5" />
                    Firestore
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure unit code, title, and academic term. Persisted directly to Firestore.
                </p>
              </div>
              <button
                onClick={() => setIsAddUnitOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                disabled={isSubmitting}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateUnit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="unit-code-input"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Unit Code <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500">(Optional)</span>
                  </label>
                  <input
                    id="unit-code-input"
                    type="text"
                    value={unitCode}
                    onChange={(e) => setUnitCode(e.target.value)}
                    placeholder="e.g., BIT 2101"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 uppercase font-mono tracking-tight placeholder:normal-case placeholder:font-sans focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    e.g., BIT 2101, SMA 2104
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="unit-year-select"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Year of Study <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="unit-year-select"
                    value={yearOfStudy}
                    onChange={(e) => setYearOfStudy(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                    <option value={5}>Year 5+</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="unit-title-input"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Unit Name / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  id="unit-title-input"
                  type="text"
                  value={unitTitle}
                  onChange={(e) => setUnitTitle(e.target.value)}
                  placeholder="e.g. Operating Systems & Systems Programming"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Semester <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["Semester 1", "Semester 2"] as Semester[]).map((semOption) => (
                    <button
                      key={semOption}
                      type="button"
                      onClick={() => setSemester(semOption)}
                      className={`py-2 px-3 text-xs rounded-lg border text-center font-medium transition-colors ${
                        semester === semOption
                          ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 font-semibold"
                          : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {semOption}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  {["#2563eb", "#059669", "#7c3aed", "#d97706", "#dc2626", "#0891b2"].map(
                    (color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setUnitColor(color)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          unitColor === color
                            ? "border-slate-900 dark:border-white scale-110"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    )
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="unit-desc-input"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Description / Syllabus Overview
                </label>
                <textarea
                  id="unit-desc-input"
                  value={unitDesc}
                  onChange={(e) => setUnitDesc(e.target.value)}
                  rows={2}
                  placeholder="Syllabus focus, lecturer details, CAT breakdown..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 gap-2">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <Database className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Saves to <code>/units</code> collection</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAddUnitOpen(false)}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-initial px-3.5 py-2 sm:py-1.5 text-xs text-center text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 sm:border-transparent rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-initial justify-center inline-flex items-center gap-1.5 px-4 py-2 sm:py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-lg transition-colors shadow-2xs"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Creating Unit...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Unit</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Topic Modal */}
      {isAddTopicOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md max-h-[96vh] sm:max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                  Add New Topic
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Break down this unit into distinct examinable sub-topics.
                </p>
              </div>
              <button
                onClick={() => setIsAddTopicOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTopic} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Which unit is this for? <span className="text-rose-500">*</span>
                </label>
                <select
                  value={targetUnitId}
                  onChange={(e) => setTargetUnitId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  required
                >
                  <option value="">-- Select Academic Unit --</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.unitCode || u.code ? `${u.unitCode || u.code} - ` : ""}
                      {u.title || u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Topic Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  placeholder="e.g. Concurrency & Semaphores"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Topic Description
                </label>
                <textarea
                  value={topicDesc}
                  onChange={(e) => setTopicDesc(e.target.value)}
                  rows={2}
                  placeholder="Key sub-concepts tested in CATs or final exams..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddTopicOpen(false)}
                  className="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 text-xs text-center text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 sm:border-transparent rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto justify-center inline-flex items-center px-4 py-2 sm:py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Create Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
