import React, { useState, useEffect } from "react";
import { X, Plus, Check } from "lucide-react";
import { store } from "../services/store";
import { AssessmentType } from "../types";

interface LogScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  defaultCourseId?: string;
  defaultTopicId?: string;
}

export const LogScoreModal: React.FC<LogScoreModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  defaultCourseId,
  defaultTopicId,
}) => {
  const units = store.getUnits();

  const [unitId, setUnitId] = useState(defaultCourseId || units[0]?.id || "");
  const [topicId, setTopicId] = useState(
    defaultTopicId || store.getTopics(defaultCourseId || units[0]?.id)[0]?.id || ""
  );

  const [assessmentType, setAssessmentType] = useState<AssessmentType>("CAT 1");
  const [assessmentName, setAssessmentName] = useState("CAT 1 Assessment");
  const [score, setScore] = useState<string>("");
  const [maxScore, setMaxScore] = useState<string>("30"); // Default 30 marks for Kenyan CATs
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Sync defaults when modal opens
  useEffect(() => {
    if (isOpen) {
      const activeUnitId = defaultCourseId || units[0]?.id || "";
      setUnitId(activeUnitId);
      const unitTopics = store.getTopics(activeUnitId);
      setTopicId(defaultTopicId || unitTopics[0]?.id || "");
      setError(null);
    }
  }, [isOpen, defaultCourseId, defaultTopicId]);

  // Dynamically update default title & max score based on selected Kenyan assessment type
  const handleAssessmentTypeChange = (type: AssessmentType) => {
    setAssessmentType(type);
    const selectedUnit = store.getUnit(unitId);
    const selectedTopic = store.getTopic(topicId);
    const topicLabel = selectedTopic ? `: ${selectedTopic.name}` : "";

    if (type === "CAT 1") {
      setAssessmentName(`CAT 1${topicLabel}`);
      setMaxScore("30");
    } else if (type === "CAT 2") {
      setAssessmentName(`CAT 2${topicLabel}`);
      setMaxScore("30");
    } else if (type === "Final Exam") {
      setAssessmentName(`Final Examination: ${selectedUnit?.unitCode || selectedUnit?.title || "Unit"}`);
      setMaxScore("70");
    } else if (type === "Practical CAT") {
      setAssessmentName(`Practical CAT${topicLabel}`);
      setMaxScore("30");
    } else if (type === "Assignment") {
      setAssessmentName(`Coursework Assignment${topicLabel}`);
      setMaxScore("10");
    } else if (type === "Quiz") {
      setAssessmentName(`Quiz${topicLabel}`);
      setMaxScore("10");
    }
  };

  if (!isOpen) return null;

  const topics = store.getTopics(unitId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessmentName.trim()) {
      setError("Assessment title is required.");
      return;
    }
    if (!unitId || !topicId) {
      setError("Please select both an academic unit and a topic.");
      return;
    }

    const numScore = parseFloat(score);
    const numMax = parseFloat(maxScore);

    if (isNaN(numScore) || isNaN(numMax) || numMax <= 0 || numScore < 0) {
      setError("Please enter valid numeric score and maximum marks.");
      return;
    }

    if (numScore > numMax) {
      setError(`Marks obtained (${numScore}) cannot exceed maximum possible marks (${numMax}).`);
      return;
    }

    store.addResult({
      unitId,
      courseId: unitId,
      topicId,
      assessmentName: assessmentName.trim(),
      assessmentType,
      score: numScore,
      maxScore: numMax,
      date,
      source: "manual",
      notes: notes.trim() || undefined,
    });

    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md max-h-[96vh] sm:max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Log CAT / Final Exam Score
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Record Kenyan university Continuous Assessment Tests (CATs) or Final Exams.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 text-xs border border-rose-200 dark:border-rose-800">
              {error}
            </div>
          )}

          {/* Assessment Type Selection (CAT 1, CAT 2, Practical, Final Exam) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Assessment Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["CAT 1", "CAT 2", "Quiz", "Practical CAT", "Assignment", "Final Exam"] as AssessmentType[]).map(
                (type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleAssessmentTypeChange(type)}
                    className={`px-2 py-1.5 rounded-md text-[11px] font-medium border text-center transition-colors ${
                      assessmentType === type
                        ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 font-semibold"
                        : "border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {type}
                  </button>
                )
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Assessment Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={assessmentName}
              onChange={(e) => setAssessmentName(e.target.value)}
              placeholder="e.g. CAT 1: Concurrency & Semaphores"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Which unit is this for? <span className="text-rose-500">*</span>
              </label>
              <select
                value={unitId}
                onChange={(e) => {
                  setUnitId(e.target.value);
                  const firstTopic = store.getTopics(e.target.value)[0];
                  setTopicId(firstTopic ? firstTopic.id : "");
                }}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                required
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Topic Tested <span className="text-rose-500">*</span>
              </label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                required
              >
                {topics.length === 0 ? (
                  <option value="">No topics in this unit</option>
                ) : (
                  topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Marks Obtained <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max={maxScore || "100"}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder={assessmentType === "Final Exam" ? "56" : "24"}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Max Marks <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                placeholder="30"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Percentage
              </label>
              <div className="px-3 py-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono font-bold text-center border border-slate-200 dark:border-slate-700">
                {score && maxScore && parseFloat(maxScore) > 0
                  ? `${Math.round((parseFloat(score) / parseFloat(maxScore)) * 100)}%`
                  : "—"}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Assessment Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Lecturer Feedback / Revision Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Lost marks on Banker's algorithm matrix calculation; review safety vectors."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 resize-none"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 text-xs text-center text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 sm:border-transparent rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto justify-center inline-flex items-center gap-1.5 px-4 py-2 sm:py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Marks</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
