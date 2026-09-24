import React, { useState } from "react";
import {
  FolderArchive,
  CheckSquare,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Calendar,
  FileText,
  FileSpreadsheet,
  Video,
  Plus,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  GraduationCap,
} from "lucide-react";
import { store } from "../services/store";
import { Unit, UnitTask, TaskPriority, TaskType } from "../types";

interface ActiveUnitsSummaryProps {
  onNavigateToLibraryWithFilter?: (unitId: string) => void;
  onNavigateToCourses?: () => void;
  onOpenNewResourceWithUnit?: (unitId: string) => void;
}

export const ActiveUnitsSummary: React.FC<ActiveUnitsSummaryProps> = ({
  onNavigateToLibraryWithFilter,
  onNavigateToCourses,
  onOpenNewResourceWithUnit,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "pending_only" | "completed_only">("all");
  const [expandedUnitIds, setExpandedUnitIds] = useState<Record<string, boolean>>({});
  const [addingTaskForUnitId, setAddingTaskForUnitId] = useState<string | null>(null);

  // Form state for adding task
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("medium");
  const [newTaskType, setNewTaskType] = useState<TaskType>("assignment");

  const units = store.getUnits();
  const allSummaries = store.getAllUnitsSummary();

  // Aggregate high-level stats
  const totalUnits = units.length;
  const totalResources = allSummaries.reduce((sum, s) => sum + s.resourceCount, 0);
  const totalPendingTasks = allSummaries.reduce((sum, s) => sum + s.pendingTasksCount, 0);
  const totalCompletedTasks = allSummaries.reduce((sum, s) => sum + s.completedTasksCount, 0);
  const totalTasks = totalPendingTasks + totalCompletedTasks;
  const overallTaskProgress = totalTasks > 0 ? Math.round((totalCompletedTasks / totalTasks) * 100) : 100;

  // Filter summaries based on user input
  const filteredSummaries = allSummaries.filter((item) => {
    if (!item.unit) return false;
    const code = (item.unit.unitCode || item.unit.code || "").toLowerCase();
    const title = (item.unit.title || item.unit.name || "").toLowerCase();
    const query = searchQuery.toLowerCase().trim();

    if (query && !code.includes(query) && !title.includes(query)) {
      return false;
    }

    if (filterMode === "pending_only") {
      return item.pendingTasksCount > 0;
    }
    if (filterMode === "completed_only") {
      return item.pendingTasksCount === 0;
    }

    return true;
  });

  const toggleUnitExpanded = (unitId: string) => {
    setExpandedUnitIds((prev) => ({
      ...prev,
      [unitId]: prev[unitId] === undefined ? false : !prev[unitId],
    }));
  };

  const handleToggleTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    store.toggleTask(taskId);
  };

  const handleDeleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    store.deleteTask(taskId);
  };

  const handleSaveNewTask = (unitId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    store.addTask({
      unitId,
      title: newTaskTitle.trim(),
      dueDate: newTaskDueDate || undefined,
      priority: newTaskPriority,
      type: newTaskType,
    });

    // Reset form
    setNewTaskTitle("");
    setNewTaskDueDate("");
    setNewTaskPriority("medium");
    setNewTaskType("assignment");
    setAddingTaskForUnitId(null);
  };

  // Helper formatting for task type labels
  const getTaskTypeLabel = (type: TaskType): string => {
    switch (type) {
      case "assignment":
        return "Assignment";
      case "cat_prep":
        return "CAT Prep";
      case "lab_report":
        return "Lab Report";
      case "reading":
        return "Reading";
      case "revision":
        return "Revision";
      default:
        return "Task";
    }
  };

  const getTaskTypeBadge = (type: TaskType) => {
    switch (type) {
      case "assignment":
        return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
      case "cat_prep":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800";
      case "lab_report":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      case "reading":
        return "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800";
      case "revision":
        return "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case "high":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300";
      case "medium":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300";
      case "low":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <section
      id="dashboard-active-units-summary"
      className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
    >
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Active Units: Resources &amp; Pending Tasks
              </h2>
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {totalUnits} Active {totalUnits === 1 ? "Unit" : "Units"}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live breakdown of reference materials, notes, and pending academic coursework for each enrolled unit.
            </p>
          </div>
        </div>

        {/* Aggregated Roll-up Stats */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs">
            <FolderArchive className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {totalResources}
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">Resources</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span
              className={`font-semibold ${
                totalPendingTasks > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {totalPendingTasks}
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">Pending Tasks</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {overallTaskProgress}%
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">Complete</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search unit by code or title..."
            className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterMode("all")}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              filterMode === "all"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750"
            }`}
          >
            All Units ({allSummaries.length})
          </button>
          <button
            onClick={() => setFilterMode("pending_only")}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              filterMode === "pending_only"
                ? "bg-amber-600 text-white shadow-2xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750"
            }`}
          >
            Has Pending Tasks (
            {allSummaries.filter((s) => s.pendingTasksCount > 0).length})
          </button>
          <button
            onClick={() => setFilterMode("completed_only")}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              filterMode === "completed_only"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750"
            }`}
          >
            All Caught Up (
            {allSummaries.filter((s) => s.pendingTasksCount === 0).length})
          </button>
        </div>
      </div>

      {/* Units Cards Grid */}
      {allSummaries.length === 0 ? (
        <div className="py-12 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-2">
          <GraduationCap className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No enrolled units yet
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Create your first academic unit to track course notes, upcoming assignments, and exam revision milestones.
          </p>
          {onNavigateToCourses && (
            <button
              onClick={onNavigateToCourses}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Unit</span>
            </button>
          )}
        </div>
      ) : filteredSummaries.length === 0 ? (
        <div className="py-10 text-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
          <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
            No matching active units found
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Try adjusting your search query or filter selection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
          {filteredSummaries.map((item) => {
            if (!item.unit) return null;
            const unit = item.unit;
            const isExpanded = expandedUnitIds[unit.id] ?? true; // Default expanded for great visibility
            const unitCode = unit.unitCode || unit.code || "UNIT";
            const unitColor = unit.color || "#4f46e5";
            const isAddingTask = addingTaskForUnitId === unit.id;

            // Task completion rate for this unit
            const taskRate =
              item.totalTasksCount > 0
                ? Math.round((item.completedTasksCount / item.totalTasksCount) * 100)
                : 100;

            return (
              <div
                key={unit.id}
                id={`unit-summary-card-${unit.id}`}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850/90 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Unit Header Bar with Color Accent */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Color indicator pip */}
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0 mt-1 shadow-xs ring-2 ring-white dark:ring-slate-900"
                        style={{ backgroundColor: unitColor }}
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
                            {unitCode}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {unit.term || `Year ${unit.yearOfStudy || 1}, ${unit.semester || "Semester 1"}`}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mt-1 truncate">
                          {unit.title || unit.name}
                        </h3>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleUnitExpanded(unit.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title={isExpanded ? "Collapse tasks" : "Expand tasks"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Summary Metric Counters Row */}
                  <div className="grid grid-cols-2 gap-2.5 mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                    {/* Resource Counter Button (Clickable to Library) */}
                    <button
                      type="button"
                      onClick={() => onNavigateToLibraryWithFilter && onNavigateToLibraryWithFilter(unit.id)}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-750 text-left hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group flex items-center justify-between"
                      title="Click to view all resources in Library"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <FolderArchive className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-[11px] font-medium">Resources</span>
                        </div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                          {item.resourceCount}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                          <span>{item.resourcesByType.notes} notes</span>
                          <span>•</span>
                          <span>{item.resourcesByType.pdfs} PDFs</span>
                          <span>•</span>
                          <span>{item.resourcesByType.videos} videos</span>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0 transition-colors" />
                    </button>

                    {/* Pending Tasks Counter */}
                    <div
                      className={`p-2.5 rounded-lg border text-left flex flex-col justify-between ${
                        item.pendingTasksCount > 0
                          ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60"
                          : "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-[11px] font-medium">Pending Tasks</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                            item.pendingTasksCount > 0
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-200"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-200"
                          }`}
                        >
                          {item.pendingTasksCount > 0 ? `${item.pendingTasksCount} To-Do` : "All Done"}
                        </span>
                      </div>
                      <div className="mt-1">
                        <div className="text-lg font-bold text-slate-900 dark:text-white">
                          {item.pendingTasksCount}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.completedTasksCount} of {item.totalTasksCount} tasks completed ({taskRate}%)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Task Progress Bar */}
                  {item.totalTasksCount > 0 && (
                    <div className="mt-3">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300 rounded-full"
                          style={{ width: `${taskRate}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded Tasks & Actions Body */}
                {isExpanded && (
                  <div className="p-4 space-y-3 bg-slate-50/40 dark:bg-slate-900/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Deliverables &amp; Study Tasks ({item.pendingTasksCount} pending)
                      </span>
                      {!isAddingTask && (
                        <button
                          type="button"
                          onClick={() => {
                            setAddingTaskForUnitId(unit.id);
                            setNewTaskTitle("");
                            setNewTaskDueDate("");
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Task</span>
                        </button>
                      )}
                    </div>

                    {/* Inline Add Task Form */}
                    {isAddingTask && (
                      <form
                        onSubmit={(e) => handleSaveNewTask(unit.id, e)}
                        className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 space-y-2.5 shadow-2xs"
                      >
                        <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                          <span>New Task for {unitCode}</span>
                          <button
                            type="button"
                            onClick={() => setAddingTaskForUnitId(null)}
                            className="text-slate-400 hover:text-slate-600 text-[11px]"
                          >
                            Cancel
                          </button>
                        </div>
                        <input
                          type="text"
                          required
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="e.g. Complete assignment 2, Revise for CAT 1..."
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          autoFocus
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Due Date</label>
                            <input
                              type="date"
                              value={newTaskDueDate}
                              onChange={(e) => setNewTaskDueDate(e.target.value)}
                              className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Type</label>
                            <select
                              value={newTaskType}
                              onChange={(e) => setNewTaskType(e.target.value as TaskType)}
                              className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200"
                            >
                              <option value="assignment">Assignment</option>
                              <option value="cat_prep">CAT Prep</option>
                              <option value="reading">Reading</option>
                              <option value="lab_report">Lab Report</option>
                              <option value="revision">Revision</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Priority</label>
                            <select
                              value={newTaskPriority}
                              onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                              className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200"
                            >
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setAddingTaskForUnitId(null)}
                            className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors"
                          >
                            Save Task
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Task items list */}
                    {item.allTasks.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        No tasks recorded for this unit yet.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {item.allTasks.map((task) => (
                          <div
                            key={task.id}
                            className={`p-2 rounded-lg border transition-all flex items-start justify-between gap-2.5 ${
                              task.completed
                                ? "bg-slate-100/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 opacity-65"
                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-750 shadow-2xs"
                            }`}
                          >
                            <div className="flex items-start gap-2 min-w-0">
                              <button
                                type="button"
                                onClick={(e) => handleToggleTask(task.id, e)}
                                className="mt-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shrink-0 cursor-pointer"
                                title={task.completed ? "Mark as pending" : "Mark as completed"}
                              >
                                {task.completed ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <Circle className="w-4 h-4" />
                                )}
                              </button>
                              <div className="min-w-0">
                                <p
                                  className={`text-xs font-medium truncate ${
                                    task.completed
                                      ? "line-through text-slate-400 dark:text-slate-500"
                                      : "text-slate-850 dark:text-slate-150"
                                  }`}
                                >
                                  {task.title}
                                </p>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]">
                                  <span
                                    className={`px-1.5 py-0.2 rounded font-medium border ${getTaskTypeBadge(
                                      task.type
                                    )}`}
                                  >
                                    {getTaskTypeLabel(task.type)}
                                  </span>

                                  <span
                                    className={`px-1.5 py-0.2 rounded font-semibold uppercase text-[9px] ${getPriorityBadge(
                                      task.priority
                                    )}`}
                                  >
                                    {task.priority}
                                  </span>

                                  {task.dueDate && (
                                    <span className="flex items-center gap-0.5 text-slate-500 dark:text-slate-400">
                                      <Calendar className="w-2.5 h-2.5" />
                                      <span>Due {task.dueDate}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleDeleteTask(task.id, e)}
                              className="text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400 p-1 shrink-0 transition-colors"
                              title="Delete task"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Card Quick Action Footer */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigateToLibraryWithFilter && onNavigateToLibraryWithFilter(unit.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition-colors font-medium cursor-pointer"
                    >
                      <FolderArchive className="w-3 h-3 text-indigo-500" />
                      <span>Browse ({item.resourceCount})</span>
                    </button>

                    {onOpenNewResourceWithUnit && (
                      <button
                        type="button"
                        onClick={() => onOpenNewResourceWithUnit(unit.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors font-medium cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-emerald-500" />
                        <span>Add Note/PDF</span>
                      </button>
                    )}
                  </div>

                  {onNavigateToCourses && (
                    <button
                      type="button"
                      onClick={onNavigateToCourses}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                    >
                      <span>Topics</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
