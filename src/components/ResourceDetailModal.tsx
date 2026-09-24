import React, { useState } from "react";
import {
  X,
  BookOpen,
  FileSpreadsheet,
  FileText,
  Video,
  Download,
  Share2,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  HelpCircle,
  Eye,
  Trash2,
} from "lucide-react";
import { Resource } from "../types";
import { store } from "../services/store";
import { summarizeResource } from "../services/api";
import { AIBadge } from "./AIBadge";
import { PDFViewer } from "./PDFViewer";
import { NoteMarkdownRenderer } from "./NoteEditor";

interface ResourceDetailModalProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
  onStartQuiz: (resource: Resource) => void;
  onResourceUpdated: () => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  resource,
  isOpen,
  onClose,
  onStartQuiz,
  onResourceUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<"content" | "summary">("content");
  const [summaryMode, setSummaryMode] = useState<"academic" | "simple">("academic");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  if (!isOpen || !resource) return null;

  const effectiveUnitId = resource.unitId || resource.courseId || "";
  const unit = store.getUnit(effectiveUnitId);
  const topic = store.getTopic(resource.topicId);
  const displayCode = unit?.unitCode || unit?.code || unit?.title || "Unit";

  // Handle AI Summarization with Kenyan Unit & Topic context and optional "Explain it simpler" mode
  const handleGenerateSummary = async (simpler: boolean = false) => {
    setIsSummarizing(true);
    setSummaryError(null);
    try {
      const summaryText = resource.content || resource.title;
      const res = await summarizeResource(
        resource.title,
        summaryText,
        resource.type,
        unit?.title,
        unit?.unitCode || unit?.code,
        simpler
      );

      if (simpler) {
        store.updateResource(resource.id, {
          aiSummarySimple: res.summary,
          aiSummarySimpleDate: res.generatedAt,
        });
        setSummaryMode("simple");
      } else {
        store.updateResource(resource.id, {
          aiSummary: res.summary,
          aiSummaryDate: res.generatedAt,
        });
        setSummaryMode("academic");
      }

      setActiveTab("summary");
      onResourceUpdated();
    } catch (e: any) {
      setSummaryError(e.message || "Failed to generate summary. Please check your connection and try again.");
    } finally {
      setIsSummarizing(false);
    }
  };

  // Export as text/markdown
  const handleExportText = () => {
    const textToExport = `# ${resource.title}
Unit: ${displayCode} - ${unit?.title || ""}
Topic: ${topic?.name || "Topic"}
Type: ${resource.type.toUpperCase()}
Date: ${new Date(resource.createdAt).toLocaleDateString()}
Tags: ${resource.tags.join(", ")}

---
## CONTENT
${resource.content || "(No content)"}

${
  resource.aiSummary
    ? `---
## AI SUMMARY
${resource.aiSummary}
`
    : ""
}
`;

    const blob = new Blob([textToExport], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${resource.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_export.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy formatted shareable text block
  const handleCopyShareableBlock = () => {
    const block = `[DoN Study Resource] ${resource.title}
Unit: ${displayCode} | Topic: ${topic?.name || "Topic"}
${
  resource.aiSummary
    ? `\nAI Summary:\n${resource.aiSummary}\n`
    : resource.videoUrl
    ? `\nVideo URL: ${resource.videoUrl}\n`
    : `\nContent Excerpt:\n${resource.content.slice(0, 300)}...\n`
}
Organized in Diary of a Nerd`;

    navigator.clipboard.writeText(block);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Shareable link
  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}/#resource-${resource.id}`;
    navigator.clipboard.writeText(shareUrl);
    setShareFeedback("Resource reference copied to clipboard!");
    setTimeout(() => setShareFeedback(null), 2500);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${resource.title}"?`)) {
      store.deleteResource(resource.id);
      onResourceUpdated();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div
        className={`w-full ${
          resource.type === "pdf" ? "max-w-5xl" : "max-w-4xl"
        } max-h-[94vh] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-200`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
              {resource.type === "pdf" && <FileSpreadsheet className="w-5 h-5 text-rose-500" />}
              {resource.type === "note" && <FileText className="w-5 h-5 text-blue-500" />}
              {resource.type === "video" && <Video className="w-5 h-5 text-amber-500" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                {resource.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                  {displayCode}
                </span>
                <span>•</span>
                <span className="truncate">{topic?.name}</span>
                <span>•</span>
                <span className="capitalize">{resource.type}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Delete resource"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-slate-100/60 dark:bg-slate-850/60 border-b border-slate-200 dark:border-slate-800 text-xs">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("content")}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === "content"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Resource Material
            </button>
            <button
              onClick={() => setActiveTab("summary")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === "summary"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>AI Summary</span>
              {resource.aiSummary && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </button>
          </div>

          {/* AI Features & Export Toolbar */}
          <div className="flex items-center gap-2">
            {/* Generate or Re-generate AI Summary */}
            <button
              onClick={() => handleGenerateSummary(false)}
              disabled={isSummarizing}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/60 rounded-md transition-colors disabled:opacity-60 cursor-pointer"
              title="Generate clean, skimmable academic summary with Gemini"
            >
              {isSummarizing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Summarizing...</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{resource.aiSummary ? "Update Summary" : "Generate AI Summary"}</span>
                </>
              )}
            </button>

            {/* Auto-generate Revision Quiz for CAT & Exam Prep */}
            <button
              onClick={() => onStartQuiz(resource)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/60 rounded-md transition-colors cursor-pointer"
              title="Generate multiple-choice revision quiz for CAT and exam prep"
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Revision Quiz</span>
            </button>

            {/* Export & Share Actions */}
            <button
              onClick={handleExportText}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-300 dark:border-slate-700 rounded-md transition-colors"
              title="Export resource as Markdown/Text"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={handleCopyShareableBlock}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-300 dark:border-slate-700 rounded-md transition-colors"
              title="Copy shareable summary block"
            >
              {copySuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{copySuccess ? "Copied" : "Copy Text"}</span>
            </button>

            <button
              onClick={handleShareLink}
              className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded hover:bg-slate-200/50"
              title="Share reference link"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {shareFeedback && (
          <div className="px-5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs text-center border-b border-indigo-100">
            {shareFeedback}
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 p-5 overflow-y-auto">
          {activeTab === "content" ? (
            <div className="space-y-4">
              {/* In-App PDF Viewer (Canvas & Native Iframe Dual Mode) */}
              {resource.type === "pdf" && (
                <div className="space-y-4">
                  {resource.fileUrl ? (
                    <PDFViewer
                      fileUrl={resource.fileUrl}
                      fileName={resource.fileName}
                      fileSize={resource.fileSize}
                      title={resource.title}
                    />
                  ) : (
                    <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs border border-dashed border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                      <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        No Document URL Available
                      </p>
                      <p className="mt-1">
                        This PDF resource does not have an attached file stream or data URI.
                      </p>
                    </div>
                  )}

                  {resource.content && (
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs space-y-2 shadow-2xs">
                      <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span>Accompanying Document Synopsis &amp; Study Notes</span>
                        {displayCode && (
                          <span className="font-mono text-[11px] text-slate-400">
                            Unit: {displayCode}
                          </span>
                        )}
                      </div>
                      <NoteMarkdownRenderer content={resource.content} />
                    </div>
                  )}
                </div>
              )}

              {/* Video Lesson Preview */}
              {resource.type === "video" && (
                <div className="space-y-3">
                  {resource.videoUrl && (
                    <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-750 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-amber-500" />
                        <span className="text-slate-600 dark:text-slate-400">Video Link:</span>
                        <a
                          href={resource.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline max-w-md truncate flex items-center gap-1"
                        >
                          {resource.videoUrl}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-lg bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                    <div className="font-semibold text-slate-700 dark:text-slate-300 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                      Lecture Timestamps &amp; Key Concepts
                    </div>
                    <NoteMarkdownRenderer content={resource.content || ""} />
                  </div>
                </div>
              )}

              {/* Typed Note Content */}
              {resource.type === "note" && (
                <div className="p-5 rounded-lg bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <NoteMarkdownRenderer content={resource.content || ""} />
                </div>
              )}

              {/* Tags Section */}
              {resource.tags && resource.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  <span className="text-xs text-slate-400 font-medium">Tags:</span>
                  {resource.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* AI Summary Tab */
            <div className="space-y-4">
              {summaryError && (
                <div className="p-3 text-xs rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
                  {summaryError}
                </div>
              )}
              {(resource.aiSummary || resource.aiSummarySimple) ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <AIBadge label="Gemini AI Summary" />
                      <span className="text-[11px] text-slate-400">
                        {summaryMode === "simple"
                          ? resource.aiSummarySimpleDate
                            ? `Generated on ${new Date(resource.aiSummarySimpleDate).toLocaleDateString()}`
                            : ""
                          : resource.aiSummaryDate
                          ? `Generated on ${new Date(resource.aiSummaryDate).toLocaleDateString()}`
                          : ""}
                      </span>
                    </div>

                    {/* Mode Toggle: Academic Synthesis vs Explain It Simpler */}
                    <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300/80 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => {
                          setSummaryMode("academic");
                          if (!resource.aiSummary) handleGenerateSummary(false);
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          summaryMode === "academic"
                            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                        }`}
                      >
                        Academic Synthesis
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSummaryMode("simple");
                          if (!resource.aiSummarySimple) handleGenerateSummary(true);
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          summaryMode === "simple"
                            ? "bg-indigo-600 text-white shadow-2xs font-semibold"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                        }`}
                        title="Explain complex concepts using everyday analogies and plain-English intuition"
                      >
                        <BookOpen className="w-3 h-3 text-amber-300" />
                        <span>Explain It Simpler</span>
                      </button>
                    </div>
                  </div>

                  {summaryMode === "simple" ? (
                    resource.aiSummarySimple ? (
                      <div className="p-5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 text-xs sm:text-sm text-slate-800 dark:text-slate-200 space-y-3 whitespace-pre-wrap leading-relaxed font-sans">
                        {resource.aiSummarySimple}
                      </div>
                    ) : (
                      <div className="p-6 text-center space-y-2 border border-dashed rounded-xl border-indigo-200 dark:border-indigo-900 bg-indigo-50/30">
                        <BookOpen className="w-6 h-6 text-indigo-500 mx-auto" />
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                          Generate Plain-English Intuition Summary
                        </p>
                        <button
                          type="button"
                          onClick={() => handleGenerateSummary(true)}
                          disabled={isSummarizing}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                        >
                          {isSummarizing ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Generate Simplified Summary</span>
                            </>
                          )}
                        </button>
                      </div>
                    )
                  ) : resource.aiSummary ? (
                    <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 space-y-3 whitespace-pre-wrap leading-relaxed font-sans">
                      {resource.aiSummary}
                    </div>
                  ) : (
                    <div className="p-6 text-center space-y-2 border border-dashed rounded-xl border-slate-200 dark:border-slate-800">
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Academic synthesis not generated yet.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleGenerateSummary(false)}
                        disabled={isSummarizing}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                      >
                        Generate Academic Synthesis
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-10 text-center space-y-3 border border-dashed rounded-xl border-slate-300 dark:border-slate-800">
                  <BookOpen className="w-8 h-8 text-indigo-500 mx-auto opacity-70" />
                  <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                    No AI Summary Generated Yet
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Gemini analyzes this study material to extract key theoretical takeaways, core formulas, and exam focus items.
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => handleGenerateSummary(false)}
                      disabled={isSummarizing}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                    >
                      {isSummarizing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Generating Summary...
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-3.5 h-3.5" />
                          Generate Academic Summary
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleGenerateSummary(true)}
                      disabled={isSummarizing}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/60 rounded-lg transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Explain It Simpler
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
