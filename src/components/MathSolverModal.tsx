import React, { useState } from "react";
import {
  Calculator,
  BookOpen,
  Check,
  Copy,
  AlertCircle,
  Lightbulb,
  X,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { AIBadge } from "./AIBadge";
import { store } from "../services/store";
import { solveMathProblem } from "../services/api";
import { MathSolution } from "../types";

interface MathSolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUnitId?: string;
}

const EXAMPLE_PROBLEMS = [
  {
    label: "Calculus (Derivatives & Tangents)",
    text: "Find the equation of the tangent line to the curve f(x) = 3x^3 - 5x + 2 at x = 2.",
    unitCode: "SMA 2101",
    topic: "Differential Calculus",
  },
  {
    label: "Linear Algebra (Eigenvalues)",
    text: "Find the eigenvalues and corresponding eigenvectors for matrix A = [[4, 1], [2, 3]].",
    unitCode: "SMA 2104",
    topic: "Linear Algebra & Matrices",
  },
  {
    label: "Applied Physics / Dynamics",
    text: "A projectile is launched from ground level with initial velocity 25 m/s at an angle of 35 degrees. Calculate its maximum height and total flight time (g = 9.81 m/s^2).",
    unitCode: "SPH 2101",
    topic: "Classical Mechanics & Kinematics",
  },
  {
    label: "Digital Logic / Boolean Algebra",
    text: "Simplify the Boolean function F(A, B, C) = A'B + AB'C' + ABC using Boolean laws and verification.",
    unitCode: "BIT 2102",
    topic: "Digital Electronics & Boolean Logic",
  },
];

export const MathSolverModal: React.FC<MathSolverModalProps> = ({
  isOpen,
  onClose,
  defaultUnitId,
}) => {
  const units = store.getUnits();
  const [selectedUnitId, setSelectedUnitId] = useState<string>(defaultUnitId || units[0]?.id || "");
  const [problemText, setProblemText] = useState<string>("");
  const [topicName, setTopicName] = useState<string>("");
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [solution, setSolution] = useState<MathSolution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedAnswer, setCopiedAnswer] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentUnit = units.find((u) => u.id === selectedUnitId);
  const unitCode = currentUnit?.unitCode || currentUnit?.code;
  const unitTitle = currentUnit?.title || currentUnit?.name;

  const handleSolve = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!problemText.trim()) {
      setError("Please enter or paste a mathematical or STEM problem to solve.");
      return;
    }

    setIsSolving(true);
    setError(null);

    try {
      const res = await solveMathProblem(
        problemText.trim(),
        unitTitle,
        unitCode,
        topicName.trim() || undefined
      );

      setSolution({
        problem: res.problem,
        topic: res.topic,
        finalAnswer: res.finalAnswer,
        steps: res.steps,
        examTips: res.examTips,
        generatedAt: res.generatedAt,
        isSimulated: res.isSimulated,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to solve problem. Please check your query and try again.");
    } finally {
      setIsSolving(false);
    }
  };

  const handleApplyExample = (example: typeof EXAMPLE_PROBLEMS[0]) => {
    setProblemText(example.text);
    setTopicName(example.topic);
    const matched = units.find(
      (u) => (u.unitCode || u.code) === example.unitCode || u.title.includes(example.topic)
    );
    if (matched) {
      setSelectedUnitId(matched.id);
    }
    setError(null);
  };

  const handleCopySolution = () => {
    if (!solution) return;
    const formatted = `[DoN Math Solution: ${solution.topic || "Applied Math"}]
Problem: ${solution.problem}

Final Answer:
${solution.finalAnswer}

Step-by-Step Reasoning:
${solution.steps
  .map(
    (s) =>
      `Step ${s.stepNumber}: ${s.title}\n${s.latex ? `Formula: ${s.latex}\n` : ""}${s.explanation}`
  )
  .join("\n\n")}

${
  solution.examTips && solution.examTips.length > 0
    ? `CAT & Final Exam Strategy:\n${solution.examTips.map((t, idx) => `${idx + 1}. ${t}`).join("\n")}`
    : ""
}
Solved with Diary of a Nerd (DoN)`;

    navigator.clipboard.writeText(formatted);
    setCopiedAnswer(true);
    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-4xl max-h-[96vh] sm:max-h-[92vh] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in-50 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Step-by-Step Math &amp; STEM Solver
                </h2>
                <AIBadge label="Gemini Reasoning" size="sm" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Detailed derivations, step-by-step logic, and Kenyan CAT &amp; Final Exam tips
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-6">
          {/* Input Form */}
          <form onSubmit={handleSolve} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Unit Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Academic Unit
                </label>
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">General University Math / STEM</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.unitCode || u.code ? `[${u.unitCode || u.code}] ` : ""}
                      {u.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic Focus */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Topic or Sub-Discipline (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Calculus, Differential Equations, Boolean Logic"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Problem Statement */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Problem Statement, Formula, or Question
                </label>
                <span className="text-[11px] text-slate-400">Supports text, equations, and expressions</span>
              </div>
              <textarea
                rows={3}
                placeholder="Enter your problem here, e.g.: Find the derivative of f(x) = (3x^2 + 1) / (2x - 5) using the quotient rule."
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                className="w-full text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:font-sans placeholder:text-slate-400"
              />
            </div>

            {/* Quick Example Chips */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                Load Typical University CAT &amp; Exam Practice Problems:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_PROBLEMS.map((ex, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyExample(ex)}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-300 transition-colors text-left"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Bar */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="submit"
                disabled={isSolving || !problemText.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSolving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing &amp; Deriving Steps...</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4 text-white" />
                    <span>Solve Step-by-Step</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Solution Display */}
          {solution && (
            <div className="space-y-5 border-t border-slate-200 dark:border-slate-800 pt-5">
              {/* Solution Header & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-indigo-50/70 dark:bg-indigo-950/40 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/60">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                      Final Verified Answer
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200">
                      {solution.topic || "Applied Math"}
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white font-mono">
                    {solution.finalAnswer}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopySolution}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
                  >
                    {copiedAnswer ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Solution</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Step-by-Step Walkthrough */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Step-by-Step Derivation &amp; Reasoning
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {solution.steps.length} {solution.steps.length === 1 ? "Step" : "Steps"} Detailed
                  </span>
                </div>

                <div className="space-y-3">
                  {solution.steps.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 transition-all hover:border-slate-300 dark:hover:border-slate-700 space-y-2"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] shrink-0 mt-0.5">
                          {step.stepNumber}
                        </span>
                        <div className="flex-1">
                          <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                            {step.title}
                          </h4>
                          {step.latex && (
                            <div className="mt-1.5 px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 font-mono text-xs text-indigo-700 dark:text-indigo-300 overflow-x-auto">
                              {step.latex}
                            </div>
                          )}
                          <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {step.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exam & CAT Strategic Tips */}
              {solution.examTips && solution.examTips.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-850 dark:text-amber-300">
                    <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>CAT &amp; Final Exam Scoring Strategy</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 list-disc list-inside">
                    {solution.examTips.map((tip, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Structured for Continuous Assessment Tests (CATs) and Final Exams</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
