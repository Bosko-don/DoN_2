import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  X,
  Loader2,
  Check,
  AlertCircle,
  ArrowRight,
  Mic,
  MicOff,
  Volume2,
  Trash2,
} from "lucide-react";
import { store } from "../services/store";
import { classifyQuickCaptureInput } from "../services/api";
import { AIBadge } from "./AIBadge";
import { Unit, ResourceType } from "../types";

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResourceSaved?: (resourceId: string) => void;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
  onResourceSaved,
}) => {
  const [input, setInput] = useState("");
  const [isClassifying, setIsClassifying] = useState(false);
  const [classification, setClassification] = useState<any | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [selectedType, setSelectedType] = useState<ResourceType>("note");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Web Speech API states
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  // Detect browser Web Speech API support
  useEffect(() => {
    const SpeechRecognitionAPI =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    setSpeechSupported(!!SpeechRecognitionAPI);
  }, []);

  // Teardown speech recognition on modal close or unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
      setInterimTranscript("");
    }
  }, [isOpen]);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // silent in production
        }
      }
      setIsListening(false);
      setInterimTranscript("");
      return;
    }

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setError(
        "Web Speech API is not supported in this browser. Please try Google Chrome, Microsoft Edge, or Safari."
      );
      return;
    }

    setError(null);

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = "";
        let newFinal = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            newFinal += item[0].transcript + " ";
          } else {
            currentInterim += item[0].transcript;
          }
        }

        if (newFinal) {
          setInput((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${newFinal.trim()}` : newFinal.trim();
          });
        }
        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (event: any) => {
        // silent in production
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setError(
            "Microphone access was denied or restricted. Please allow microphone permissions in your browser to dictate notes."
          );
        } else if (event.error === "network") {
          setError("Network connection error encountered during voice dictation.");
        } else if (event.error !== "no-speech") {
          setError(`Speech recognition notice: ${event.error}`);
        }
        setIsListening(false);
        setInterimTranscript("");
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript("");
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      // silent in production
      setError(err?.message || "Could not access microphone for dictation.");
      setIsListening(false);
      setInterimTranscript("");
    }
  };

  if (!isOpen) return null;

  const units = store.getUnits();
  const topicsForSelectedUnit = store.getTopics(selectedUnitId);

  const handleClassify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsClassifying(true);
    setError(null);
    setClassification(null);

    try {
      const unitsData = units.map((u) => ({
        id: u.id,
        code: u.unitCode || u.code || "",
        unitCode: u.unitCode || u.code || "",
        title: u.title || u.name || "",
        name: u.title || u.name || "",
        topics: store.getTopics(u.id).map((t) => ({ id: t.id, name: t.name })),
      }));

      const res = await classifyQuickCaptureInput(input, unitsData as any);
      setClassification(res);
      setTitle(res.title || "Quick Capture Entry");
      setSelectedType(res.suggestedType || "note");

      // Verify if classified unit exists
      const targetUnitMatch = res.unitId || res.courseId;
      if (targetUnitMatch && targetUnitMatch !== "uncategorized" && units.some((u) => u.id === targetUnitMatch)) {
        setSelectedUnitId(targetUnitMatch);
        const unitTopics = store.getTopics(targetUnitMatch);
        if (res.topicId && unitTopics.some((t) => t.id === res.topicId)) {
          setSelectedTopicId(res.topicId);
        } else if (unitTopics.length > 0) {
          setSelectedTopicId(unitTopics[0].id);
        }
      } else {
        // Uncategorized
        setSelectedUnitId(units[0]?.id || "");
        const fallbackTopics = store.getTopics(units[0]?.id);
        setSelectedTopicId(fallbackTopics[0]?.id || "");
      }
    } catch (err: any) {
      // silent in production
      setError("AI classification timed out; you can select the unit and topic manually below.");
      setTitle(input.length > 40 ? input.slice(0, 37) + "..." : input);
      setSelectedUnitId(units[0]?.id || "");
      const fallbackTopics = store.getTopics(units[0]?.id);
      setSelectedTopicId(fallbackTopics[0]?.id || "");
    } finally {
      setIsClassifying(false);
    }
  };

  const handleSave = () => {
    if (!selectedUnitId || !selectedTopicId) {
      setError("Please assign a unit and topic before saving.");
      return;
    }

    const isUrl = input.trim().startsWith("http://") || input.trim().startsWith("https://");
    const newRes = store.addResource({
      unitId: selectedUnitId,
      courseId: selectedUnitId,
      topicId: selectedTopicId,
      type: selectedType,
      title: title.trim() || "Quick Note",
      content: input.trim(),
      videoUrl: selectedType === "video" && isUrl ? input.trim() : undefined,
      tags: classification?.tags || ["quick-capture"],
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setInput("");
      setClassification(null);
      onClose();
      if (onResourceSaved) onResourceSaved(newRes.id);
    }, 650);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">Quick Capture</h3>
            <AIBadge label="Auto-Classify" size="sm" />
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Jot down a quick thought, paste a video/lecture link, or capture a study reminder. Gemini will automatically analyze and route it into the right academic unit and topic.
          </p>

          <form onSubmit={handleClassify} className="space-y-3">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={4}
                placeholder="e.g. Remember Coffman condition 4 (circular wait) proof from Tuesday's BIT 2101 lecture, or click 'Dictate with Mic' to speak..."
                className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 resize-none transition-all ${
                  isListening
                    ? "border-rose-400 dark:border-rose-700 ring-2 ring-rose-400/30"
                    : "border-slate-300 dark:border-slate-700 focus:ring-indigo-500/30 focus:border-indigo-500"
                }`}
                disabled={isClassifying || savedSuccess}
                autoFocus
              />

              {/* Dictation Live Status Pill */}
              {isListening && (
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-semibold animate-pulse shadow-2xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                  </span>
                  <span>Listening...</span>
                </div>
              )}
            </div>

            {/* Live Streaming Interim Transcript preview */}
            {interimTranscript && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60 text-xs text-indigo-700 dark:text-indigo-300 italic">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">"{interimTranscript}..."</span>
              </div>
            )}

            {!classification && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                {/* Voice Dictation Button & Utilities */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleListening}
                    disabled={isClassifying || savedSuccess || !speechSupported}
                    title={
                      !speechSupported
                        ? "Web Speech API not supported in this browser"
                        : isListening
                        ? "Click to stop dictation"
                        : "Click to dictate notes using your microphone"
                    }
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isListening
                        ? "bg-rose-600 hover:bg-rose-700 text-white shadow-xs animate-pulse ring-2 ring-rose-400/40"
                        : speechSupported
                        ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80"
                        : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed"
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-3.5 h-3.5" />
                        <span>Stop Dictating</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Dictate with Mic</span>
                      </>
                    )}
                  </button>

                  {isListening ? (
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                      Listening to speech...
                    </span>
                  ) : !speechSupported ? (
                    <span className="text-[10px] text-slate-400">
                      (Speech API not supported in this browser)
                    </span>
                  ) : null}

                  {!isListening && input.trim() && (
                    <button
                      type="button"
                      onClick={() => setInput("")}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer ml-1"
                      title="Clear captured text"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isClassifying || !input.trim() || savedSuccess}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  {isClassifying ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-3.5 h-3.5" />
                      Auto-Classify &amp; Sort
                    </>
                  )}
                </button>
              </div>
            )}
          </form>

          {error && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Classification Result & Verification */}
          {classification && (
            <div className="space-y-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    AI Classification Result
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      classification.isUncategorized
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
                    }`}
                  >
                    {classification.isUncategorized ? "Uncategorized" : "Matched"}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  {classification.confidenceExplanation}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Resource Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Resource Type
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value as ResourceType)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="note">Typed Note</option>
                      <option value="video">Video Lesson</option>
                      <option value="pdf">PDF Document</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Which unit is this for?
                    </label>
                    <select
                      value={selectedUnitId}
                      onChange={(e) => {
                        setSelectedUnitId(e.target.value);
                        const newTopics = store.getTopics(e.target.value);
                        setSelectedTopicId(newTopics[0]?.id || "");
                      }}
                      className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.unitCode || u.code ? `${u.unitCode || u.code} - ` : ""}
                          {u.title || u.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Which topic is this for?
                    </label>
                    <select
                      value={selectedTopicId}
                      onChange={(e) => setSelectedTopicId(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {topicsForSelectedUnit.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setClassification(null);
                      setError(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Edit Raw Input
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={savedSuccess}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                  >
                    {savedSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Saved to Unit!
                      </>
                    ) : (
                      <>
                        <span>Confirm &amp; Save</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
