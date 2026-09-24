import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  FileSpreadsheet,
  FileText,
  Video,
  PlusCircle,
  BookOpen,
  Tag,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Calendar,
  CheckSquare,
  Square,
  Check,
  CheckCircle2,
  Trash2,
  X,
  AlertTriangle,
  Database,
  WifiOff,
} from "lucide-react";
import { store } from "../services/store";
import { Resource, ResourceType } from "../types";
import { AIBadge } from "./AIBadge";
import { LibrarySkeleton } from "./Skeletons";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

interface LibraryViewProps {
  onOpenResource: (resource: Resource) => void;
  onOpenNewResource: () => void;
  initialCourseId?: string;
  initialTopicId?: string;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onOpenResource,
  onOpenNewResource,
  initialCourseId = "",
  initialTopicId = "",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState(initialCourseId);
  const [selectedTopicId, setSelectedTopicId] = useState(initialTopicId);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [hasAiSummaryFilter, setHasAiSummaryFilter] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isStoreLoading, setIsStoreLoading] = useState(true);

  // Batch selection states
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [units, setUnits] = useState(store.getUnits());
  const [allTopics, setAllTopics] = useState(store.getTopics());
  const [resources, setResources] = useState(store.getResources());
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsStoreLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setUnits(store.getUnits());
      setAllTopics(store.getTopics());
      setResources(store.getResources());
    });
    return unsub;
  }, []);

  const availableTopics = useMemo(() => {
    if (!selectedUnitId) return allTopics;
    return allTopics.filter(
      (t) => t.unitId === selectedUnitId || t.courseId === selectedUnitId
    );
  }, [selectedUnitId, allTopics]);

  // Full-text + tag search and filtering across Kenyan units and topics
  const filteredResources = useMemo(() => {
    return resources.filter((res) => {
      // Type filter
      if (selectedType !== "all" && res.type !== selectedType) {
        return false;
      }
      // Unit filter
      if (
        selectedUnitId &&
        res.unitId !== selectedUnitId &&
        res.courseId !== selectedUnitId
      ) {
        return false;
      }
      // Topic filter
      if (selectedTopicId && res.topicId !== selectedTopicId) {
        return false;
      }
      // AI summary filter
      if (hasAiSummaryFilter && !res.aiSummary) {
        return false;
      }

      // Search query across title, content, tags, unit code, topic name
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const effectiveUnitId = res.unitId || res.courseId || "";
        const unit = store.getUnit(effectiveUnitId);
        const topic = store.getTopic(res.topicId);

        const matchTitle = res.title.toLowerCase().includes(q);
        const matchContent = (res.content || "").toLowerCase().includes(q);
        const matchTags = res.tags.some((t) => t.toLowerCase().includes(q));
        const matchUnit =
          (unit?.unitCode || unit?.code || "").toLowerCase().includes(q) ||
          (unit?.title || unit?.name || "").toLowerCase().includes(q);
        const matchTopic = topic?.name.toLowerCase().includes(q);

        if (!matchTitle && !matchContent && !matchTags && !matchUnit && !matchTopic) {
          return false;
        }
      }

      return true;
    });
  }, [resources, searchQuery, selectedUnitId, selectedTopicId, selectedType, hasAiSummaryFilter]);

  // Selected resources array for confirmation dialog preview
  const selectedResourcesList = useMemo(() => {
    return resources.filter((r) => selectedIds.has(r.id));
  }, [resources, selectedIds]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedUnitId("");
    setSelectedTopicId("");
    setSelectedType("all");
    setHasAiSummaryFilter(false);
  };

  // Toggle selection for a single resource
  const toggleSelectResource = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    if (!isBatchMode) {
      setIsBatchMode(true);
    }
  };

  // Select all or deselect all currently filtered resources
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredResources.length && filteredResources.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredResources.map((r) => r.id)));
    }
  };

  // Clear batch selection and exit mode
  const handleExitBatchMode = () => {
    setSelectedIds(new Set());
    setIsBatchMode(false);
  };

  // Open confirmation dialog
  const handleOpenConfirmDialog = () => {
    if (selectedIds.size === 0) return;
    setIsConfirmDialogOpen(true);
  };

  // Execute bulk deletion
  const handleConfirmBulkDelete = () => {
    const ids: string[] = [];
    selectedIds.forEach((id) => ids.push(id));
    const count = store.deleteResources(ids);
    setIsConfirmDialogOpen(false);
    setSelectedIds(new Set());
    setIsBatchMode(false);
    setToastMessage(`Deleted ${count} ${count === 1 ? "resource" : "resources"} successfully.`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  if (isStoreLoading) {
    return <LibrarySkeleton viewMode={viewMode} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Unified Resource Library
            </h1>
            {!isOnline && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/60">
                <Database className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>Offline Available ({resources.length} saved)</span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Centralized repository for lecture notes, uploaded PDF monographs, and video lessons organized by unit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {resources.length > 0 && (
            <button
              onClick={() => {
                if (isBatchMode) {
                  handleExitBatchMode();
                } else {
                  setIsBatchMode(true);
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                isBatchMode
                  ? "bg-indigo-50 dark:bg-indigo-950/70 border-indigo-400 text-indigo-700 dark:text-indigo-300"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{isBatchMode ? "Done Selecting" : "Batch Select"}</span>
            </button>
          )}

          <button
            onClick={onOpenNewResource}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Resource</span>
          </button>
        </div>
      </div>

      {/* Toast feedback banner */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-600 dark:text-emerald-400 hover:opacity-75 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Batch Action Toolbar */}
      {isBatchMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-all">
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleSelectAll}
              className="inline-flex items-center gap-2 text-xs font-medium text-indigo-950 dark:text-indigo-200 hover:text-indigo-700 cursor-pointer"
            >
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  selectedIds.size > 0 && selectedIds.size === filteredResources.length
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : selectedIds.size > 0
                    ? "bg-indigo-200 dark:bg-indigo-900 border-indigo-600 text-indigo-700 dark:text-indigo-300"
                    : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                }`}
              >
                {selectedIds.size > 0 && selectedIds.size === filteredResources.length && (
                  <Check className="w-3 h-3 stroke-[3]" />
                )}
                {selectedIds.size > 0 && selectedIds.size < filteredResources.length && (
                  <span className="w-2 h-0.5 bg-indigo-600 dark:bg-indigo-300 block" />
                )}
              </span>
              <span>
                {selectedIds.size === filteredResources.length && filteredResources.length > 0
                  ? "Deselect All"
                  : `Select All (${filteredResources.length})`}
              </span>
            </button>

            <span className="text-slate-300 dark:text-slate-700">|</span>

            <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
              {selectedIds.size} of {filteredResources.length} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenConfirmDialog}
              disabled={selectedIds.size === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:hover:bg-rose-600 rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.size})</span>
            </button>

            <button
              onClick={handleExitBatchMode}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Exit Selection</span>
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Control Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Full-text search input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, keyword, unit code, or tag (e.g. 'BIT 2101', 'paging', 'deadlock')..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full sm:w-auto px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Formats (Notes, PDFs, Videos)</option>
            <option value="note">Typed Notes Only</option>
            <option value="pdf">PDF Documents Only</option>
            <option value="video">Video Lessons Only</option>
          </select>

          {/* Unit Filter */}
          <select
            value={selectedUnitId}
            onChange={(e) => {
              setSelectedUnitId(e.target.value);
              setSelectedTopicId("");
            }}
            className="w-full sm:w-auto px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Units</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.unitCode || u.code ? `${u.unitCode || u.code} - ` : ""}
                {u.title || u.name}
              </option>
            ))}
          </select>

          {/* Topic Filter */}
          <select
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            disabled={availableTopics.length === 0}
            className="w-full sm:w-auto px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
          >
            <option value="">All Topics in Unit</option>
            {availableTopics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Has AI Summary toggle */}
          <button
            onClick={() => setHasAiSummaryFilter(!hasAiSummaryFilter)}
            className={`w-full sm:w-auto inline-flex items-center justify-center sm:justify-start gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              hasAiSummaryFilter
                ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-500"
                : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
            }`}
          >
            <BookOpen className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span>Has AI Summary</span>
          </button>

          {(searchQuery || selectedUnitId || selectedTopicId || selectedType !== "all" || hasAiSummaryFilter) && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline px-1"
            >
              Reset Filters
            </button>
          )}

          <div className="ml-auto text-slate-400 text-xs font-medium">
            Showing {filteredResources.length} of {resources.length}
          </div>
        </div>
      </div>

      {/* Resource Display List / Grid */}
      {resources.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <FileText className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No resources yet — add your first one
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Upload lecture notes, academic PDFs, or online lecture links to organize your study materials.
          </p>
          <button
            onClick={onOpenNewResource}
            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add First Resource</span>
          </button>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <FileText className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No resources match your current filter
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search keywords or clearing unit/topic filters.
          </p>
          <button
            onClick={handleClearFilters}
            className="px-3.5 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((res) => {
            const effectiveUnitId = res.unitId || res.courseId || "";
            const unit = store.getUnit(effectiveUnitId);
            const topic = store.getTopic(res.topicId);
            const displayCode = unit?.unitCode || unit?.code || unit?.title;
            const isSelected = selectedIds.has(res.id);

            return (
              <div
                key={res.id}
                onClick={() => {
                  if (isBatchMode) {
                    toggleSelectResource(res.id);
                  } else {
                    onOpenResource(res);
                  }
                }}
                className={`relative p-4 rounded-xl transition-all cursor-pointer group flex flex-col justify-between ${
                  isSelected
                    ? "bg-indigo-50/40 dark:bg-indigo-950/30 border-2 border-indigo-600 dark:border-indigo-500 shadow-xs ring-2 ring-indigo-500/10"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-2xs"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      {/* Batch Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => toggleSelectResource(res.id, e)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                          isSelected
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : isBatchMode
                            ? "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-indigo-400"
                            : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 opacity-0 group-hover:opacity-100 hover:border-indigo-400"
                        }`}
                        title={isSelected ? "Deselect resource" : "Select resource for bulk actions"}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>

                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: unit?.color || "#6366f1" }}
                        title={displayCode}
                      />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                        {displayCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {res.aiSummary && <AIBadge label="AI Summary" size="sm" />}
                      <span className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {res.type === "pdf" && <FileSpreadsheet className="w-3.5 h-3.5 text-rose-500" />}
                        {res.type === "note" && <FileText className="w-3.5 h-3.5 text-blue-500" />}
                        {res.type === "video" && <Video className="w-3.5 h-3.5 text-amber-500" />}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2 leading-snug mb-1">
                    {res.title}
                  </h3>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-3">
                    {topic?.name}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 mb-3">
                    {res.aiSummary || res.content || (res.type === "pdf" ? "PDF Document stored with in-app preview." : res.videoUrl)}
                  </p>
                </div>

                <div>
                  {res.tags && res.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {res.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                      {res.tags.length > 3 && (
                        <span className="text-[10px] text-slate-400">+{res.tags.length - 3}</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(res.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium group-hover:underline flex items-center gap-0.5">
                      {isBatchMode ? (isSelected ? "Selected" : "Click to select") : "Open Resource"}
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List Mode */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs divide-y divide-slate-100 dark:divide-slate-800">
          {filteredResources.map((res) => {
            const effectiveUnitId = res.unitId || res.courseId || "";
            const unit = store.getUnit(effectiveUnitId);
            const topic = store.getTopic(res.topicId);
            const displayCode = unit?.unitCode || unit?.code || unit?.title;
            const isSelected = selectedIds.has(res.id);

            return (
              <div
                key={res.id}
                onClick={() => {
                  if (isBatchMode) {
                    toggleSelectResource(res.id);
                  } else {
                    onOpenResource(res);
                  }
                }}
                className={`p-3.5 sm:p-4 transition-colors cursor-pointer flex items-center justify-between gap-4 group ${
                  isSelected
                    ? "bg-indigo-50/50 dark:bg-indigo-950/40 border-l-4 border-l-indigo-600 dark:border-l-indigo-500"
                    : "hover:bg-slate-50/70 dark:hover:bg-slate-850"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Batch Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => toggleSelectResource(res.id, e)}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : isBatchMode
                        ? "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-indigo-400"
                        : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 opacity-0 group-hover:opacity-100 hover:border-indigo-400"
                    }`}
                    title={isSelected ? "Deselect resource" : "Select resource for bulk actions"}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                    {res.type === "pdf" && <FileSpreadsheet className="w-4 h-4 text-rose-500" />}
                    {res.type === "note" && <FileText className="w-4 h-4 text-blue-500" />}
                    {res.type === "video" && <Video className="w-4 h-4 text-amber-500" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {res.title}
                      </h3>
                      {res.aiSummary && <AIBadge label="AI" size="sm" />}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                        {displayCode}
                      </span>
                      <span>•</span>
                      <span className="truncate">{topic?.name}</span>
                      <span>•</span>
                      <span className="capitalize">{res.type}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    {new Date(res.createdAt).toLocaleDateString()}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk Delete Single Confirmation Dialog Modal */}
      {isConfirmDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Delete {selectedIds.size} {selectedIds.size === 1 ? "Resource" : "Resources"}?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete these selected study materials? This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Selected items list preview */}
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-2 space-y-1">
              {selectedResourcesList.slice(0, 8).map((item) => {
                const u = store.getUnit(item.unitId || item.courseId || "");
                return (
                  <div key={item.id} className="flex items-center gap-2.5 py-1.5 px-2 text-xs">
                    <span className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                      {item.type === "pdf" && <FileSpreadsheet className="w-3.5 h-3.5 text-rose-500" />}
                      {item.type === "note" && <FileText className="w-3.5 h-3.5 text-blue-500" />}
                      {item.type === "video" && <Video className="w-3.5 h-3.5 text-amber-500" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{item.title}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{u?.unitCode || u?.code || "Unit"}</p>
                    </div>
                  </div>
                );
              })}
              {selectedResourcesList.length > 8 && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center py-1 font-medium">
                  ...and {selectedResourcesList.length - 8} more
                </p>
              )}
            </div>

            {/* Modal action buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsConfirmDialogOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Bulk Delete ({selectedIds.size})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

