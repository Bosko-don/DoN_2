import React, { useState } from "react";
import {
  Calculator,
  BookOpen,
  Check,
  Copy,
  AlertCircle,
  Lightbulb,
  Loader2,
  HelpCircle,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import { AIBadge } from "./AIBadge";
import { store } from "../services/store";
import { solveMathProblem } from "../services/api";
import { MathSolution } from "../types";

const PRESET_PROBLEMS = [
  {
    category: "Calculus & Analysis",
    title: "Tangents & Derivatives",
    problem: "Find the equation of the tangent line to the curve y = 3x^3 - 5x + 2 at the point where x = 2.",
    unitCode: "SMA 2101",
    topic: "Differential Calculus",
  },
  {
    category: "Linear Algebra",
    title: "Eigenvalues & Eigenvectors",
    problem: "Find the eigenvalues and corresponding eigenvectors for the 2x2 matrix A = [[4, 1], [2, 3]].",
    unitCode: "SMA 2104",
    topic: "Linear Algebra & Matrices",
  },
  {
    category: "Engineering Physics",
    title: "Projectile Kinematics",
    problem: "A projectile is launched from ground level with initial velocity 25 m/s at an angle of 35 degrees above the horizontal. Calculate its maximum height and total time of flight (assume g = 9.81 m/s^2).",
    unitCode: "SPH 2101",
    topic: "Classical Mechanics & Kinematics",
  },
  {
    category: "Computing & Logic",
    title: "Boolean Minimization",
    problem: "Simplify the Boolean function F(A, B, C) = A'B + AB'C' + ABC using Boolean algebraic laws and verify each step.",
    unitCode: "BIT 2102",
    topic: "Digital Electronics & Logic",
  },
];

export const MathSolverView: React.FC = () => {
  const units = store.getUnits();
  const [selectedUnitId, setSelectedUnitId] = useState<string>(units[0]?.id || "");
  const [problemText, setProblemText] = useState<string>("");
  const [topicName, setTopicName] = useState<string>("");
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [solution, setSolution] = useState<MathSolution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedAnswer, setCopiedAnswer] = useState<boolean>(false);

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

  const handleApplyPreset = (preset: typeof PRESET_PROBLEMS[0]) => {
    setProblemText(preset.problem);
    setTopicName(preset.topic);
    const matched = units.find(
      (u) => (u.unitCode || u.code) === preset.unitCode || u.title.toLowerCase().includes(preset.category.toLowerCase())
    );
    if (matched) {
      setSelectedUnitId(matched.id);
    }
    setError(null);
  };

  const handleCopySolution = () => {
    if (!solution) return;
    const formatted = `[DoN Step-by-Step Math Solution: ${solution.topic || "Applied Math"}]
Problem:
${solution.problem}

Final Verified Answer:
${solution.finalAnswer}

Step-by-Step Derivations:
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
Generated with Diary of a Nerd (DoN)`;

    navigator.clipboard.writeText(formatted);
    setCopiedAnswer(true);
    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Step-by-Step Math &amp; STEM Solver
            </h1>
            <AIBadge label="Gemini Reasoning" size="sm" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Detailed derivations, pedagogical reasoning, and CAT &amp; Final Exam tips for Kenyan university students.
          </p>
        </div>
      </div>

      {/* Main Grid: Input Column + Output Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Calculator className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Enter Problem Statement
              </h2>
            </div>

            <form onSubmit={handleSolve} className="space-y-4">
              {/* Unit Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Academic Unit
                </label>
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">General University Mathematics &amp; STEM</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.unitCode || u.code ? `[${u.unitCode || u.code}] ` : ""}
                      {u.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Topic / Sub-Discipline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Differential Calculus, Linear Algebra, Boolean Logic"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Problem Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Math Problem or Question
                  </label>
                  <span className="text-[10px] text-slate-400">Plain text or formulas</span>
                </div>
                <textarea
                  rows={5}
                  placeholder="Type or paste your math/physics/logic problem here..."
                  value={problemText}
                  onChange={(e) => setProblemText(e.target.value)}
                  className="w-full text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:font-sans placeholder:text-slate-400"
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSolving || !problemText.trim()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSolving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deriving Step-by-Step Proof...</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4 text-white" />
                    <span>Solve Step-by-Step with Reasoning</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Preset Problem Cards */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Sample University CAT &amp; Exam Questions:
            </span>
            <div className="space-y-2">
              {PRESET_PROBLEMS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-850 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-750 text-left transition-colors group"
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {preset.category}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {preset.unitCode}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 line-clamp-2">
                    {preset.title}: {preset.problem}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Output Column (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          {solution ? (
            <div className="space-y-4">
              {/* Answer Banner */}
              <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Verified Final Answer
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {solution.topic || "Applied Math"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopySolution}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition-colors cursor-pointer"
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

                <div className="p-3.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 font-mono text-sm font-semibold text-indigo-950 dark:text-indigo-200 overflow-x-auto">
                  {solution.finalAnswer}
                </div>
              </div>

              {/* Step By Step Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Step-by-Step Mathematical Derivation
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {solution.steps.length} sequential steps
                  </span>
                </div>

                <div className="space-y-3">
                  {solution.steps.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs shrink-0 mt-0.5 shadow-2xs">
                          {step.stepNumber}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                            {step.title}
                          </h4>

                          {step.latex && (
                            <div className="my-2 px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-indigo-700 dark:text-indigo-300 overflow-x-auto">
                              {step.latex}
                            </div>
                          )}

                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {step.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CAT & Final Exam Strategic Tips */}
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
          ) : (
            <div className="p-12 text-center rounded-xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
              <Calculator className="w-10 h-10 text-slate-400 mx-auto opacity-60" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Ready to Solve
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Type an equation or problem on the left, or select one of the university exam samples to generate full mathematical derivations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
