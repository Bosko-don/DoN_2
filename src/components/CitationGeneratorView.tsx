import React, { useState } from "react";
import {
  Quote,
  Copy,
  Check,
  BookOpen,
  Loader2,
  FolderArchive,
  RefreshCw,
} from "lucide-react";
import { store } from "../services/store";
import { generateAICitation } from "../services/api";
import { CitationData, CitationResult, Resource } from "../types";
import { AIBadge } from "./AIBadge";

export const CitationGeneratorView: React.FC = () => {
  const resources = store.getResources();

  const [selectedResourceId, setSelectedResourceId] = useState<string>("");
  const [sourceType, setSourceType] = useState("Journal Article / Academic Paper");
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [year, setYear] = useState("");
  const [publication, setPublication] = useState("");
  const [urlOrDoi, setUrlOrDoi] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [citationResult, setCitationResult] = useState<CitationResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleSelectResource = (resId: string) => {
    setSelectedResourceId(resId);
    if (!resId) return;

    const res = store.getResource(resId);
    if (res) {
      setTitle(res.title);
      setUrlOrDoi(res.videoUrl || res.fileUrl || "https://don-academics.internal/" + res.id);
      setSourceType(
        res.type === "pdf"
          ? "Academic Monograph / PDF"
          : res.type === "video"
          ? "Online Lecture / Video Recording"
          : "Lecture Notes & Synthesis"
      );
      setYear(new Date(res.createdAt).getFullYear().toString());
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsGenerating(true);
    setError(null);
    try {
      const data: CitationData = {
        title: title.trim(),
        authors: authors.trim(),
        year: year.trim(),
        publication: publication.trim(),
        urlOrDoi: urlOrDoi.trim(),
        sourceType,
      };

      const result = await generateAICitation(data);
      setCitationResult(result);
    } catch (e: any) {
      setError(e?.message || "Citation generation failed. Please check details and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Academic Citation Generator
            </h1>
            <AIBadge label="APA & MLA" size="sm" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Instant APA 7th Edition and MLA 9th Edition citations for papers, slides, and lectures.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Source details form */}
        <div className="lg:col-span-6 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Source Metadata
            </h2>
            <span className="text-[11px] text-slate-400">Auto-fill or manual</span>
          </div>

          {/* Quick populate from library */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select from Saved Library Resources
            </label>
            <select
              value={selectedResourceId}
              onChange={(e) => handleSelectResource(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            >
              <option value="">-- Choose a resource to auto-fill --</option>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  [{r.type.toUpperCase()}] {r.title}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleGenerate} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Source Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Operating Systems: Three Easy Pieces"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Authors / Creators
                </label>
                <input
                  type="text"
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                  placeholder="e.g. Remzi H. Arpaci-Dusseau"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Year of Publication
                </label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g. 2024"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Journal, Book, or Publisher
              </label>
              <input
                type="text"
                value={publication}
                onChange={(e) => setPublication(e.target.value)}
                placeholder="e.g. Arpaci-Dusseau Books, Stanford Press, MIT OCW"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Source Format
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                <option value="Journal Article / Academic Paper">Journal Article / Academic Paper</option>
                <option value="Book / Textbook">Book / Textbook</option>
                <option value="Academic Monograph / PDF">Academic Monograph / PDF</option>
                <option value="Online Lecture / Video Recording">Online Lecture / Video Recording</option>
                <option value="Lecture Notes & Synthesis">Lecture Notes & Synthesis</option>
                <option value="Website / Digital Report">Website / Digital Report</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                DOI or URL Link
              </label>
              <input
                type="text"
                value={urlOrDoi}
                onChange={(e) => setUrlOrDoi(e.target.value)}
                placeholder="https://doi.org/... or webpage link"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div className="pt-2">
              {error && (
                <div className="p-3 text-xs rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isGenerating || !title.trim()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Formatting Citations with AI...</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    <span>Generate APA & MLA Citations</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right column: Generated Citations with One-Click Copy */}
        <div className="lg:col-span-6 space-y-4">
          {citationResult ? (
            <div className="space-y-4">
              {/* APA 7th Edition Card */}
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                      APA 7th Edition
                    </span>
                    <AIBadge label="Standard" size="sm" />
                  </div>
                  <button
                    onClick={() => copyToClipboard(citationResult.apa, "apa")}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    {copiedKey === "apa" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy APA</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-serif leading-relaxed select-all">
                  {citationResult.apa}
                </div>

                {citationResult.inTextAPA && (
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span>In-text: <span className="font-mono text-slate-700 dark:text-slate-300">{citationResult.inTextAPA}</span></span>
                    <button
                      onClick={() => copyToClipboard(citationResult.inTextAPA || "", "inTextAPA")}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {copiedKey === "inTextAPA" ? "Copied" : "Copy In-text"}
                    </button>
                  </div>
                )}
              </div>

              {/* MLA 9th Edition Card */}
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                      MLA 9th Edition
                    </span>
                    <AIBadge label="Standard" size="sm" />
                  </div>
                  <button
                    onClick={() => copyToClipboard(citationResult.mla, "mla")}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    {copiedKey === "mla" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy MLA</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-serif leading-relaxed select-all">
                  {citationResult.mla}
                </div>

                {citationResult.inTextMLA && (
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span>In-text: <span className="font-mono text-slate-700 dark:text-slate-300">{citationResult.inTextMLA}</span></span>
                    <button
                      onClick={() => copyToClipboard(citationResult.inTextMLA || "", "inTextMLA")}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {copiedKey === "inTextMLA" ? "Copied" : "Copy In-text"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400 space-y-2">
              <Quote className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Generate Academic Citations
              </p>
              <p>Fill in the metadata on the left to produce formatted APA and MLA references.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
