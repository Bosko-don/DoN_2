import React, { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { Resource, QuizQuestion } from "../types";
import { store } from "../services/store";
import { generateAIQuiz } from "../services/api";
import { AIBadge } from "./AIBadge";

interface QuizRunnerModalProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
  onQuizCompleted: () => void;
}

export const QuizRunnerModal: React.FC<QuizRunnerModalProps> = ({
  resource,
  isOpen,
  onClose,
  onQuizCompleted,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [savedToTracker, setSavedToTracker] = useState(false);

  useEffect(() => {
    if (isOpen && resource) {
      loadQuiz();
    }
  }, [isOpen, resource?.id]);

  if (!isOpen || !resource) return null;

  const effectiveUnitId = resource.unitId || resource.courseId || "";
  const unit = store.getUnit(effectiveUnitId);
  const topic = store.getTopic(resource.topicId);
  const displayCode = unit?.unitCode || unit?.code || unit?.title || "Unit";

  const loadQuiz = async () => {
    setLoading(true);
    setError(null);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setIsCompleted(false);
    setSavedToTracker(false);

    try {
      const res = await generateAIQuiz(
        resource.title,
        resource.content || resource.title,
        displayCode,
        topic?.name || "Topic",
        4
      );

      setQuizTitle(res.quizTitle || `Revision Quiz: ${resource.title}`);
      setQuestions(res.questions);
    } catch (e: any) {
      setError(e.message || "Failed to generate quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    // Prevent re-selection once answered
    if (selectedAnswers[currentIndex] !== undefined) return;

    const newAnswers = { ...selectedAnswers, [currentIndex]: optionIndex };
    setSelectedAnswers(newAnswers);

    // If this was the final question, finalize and save to Results tracker automatically
    if (currentIndex === questions.length - 1) {
      let correct = 0;
      questions.forEach((q, idx) => {
        if (newAnswers[idx] === q.correctAnswerIndex) {
          correct += 1;
        }
      });

      // Save to results tracker with Kenyan structure
      store.addResult({
        unitId: effectiveUnitId,
        courseId: effectiveUnitId,
        topicId: resource.topicId,
        assessmentName: `Revision Quiz: ${resource.title.slice(0, 32)}`,
        assessmentType: "Assignment",
        score: correct,
        maxScore: questions.length,
        date: new Date().toISOString().split("T")[0],
        source: "auto_quiz",
        notes: `AI generated revision quiz testing "${topic?.name}" for unit ${displayCode}. Scored ${correct}/${questions.length}.`,
      });

      setSavedToTracker(true);
      onQuizCompleted();
    }
  };

  const currentQuestion = questions[currentIndex];
  const answeredCurrent = selectedAnswers[currentIndex] !== undefined;
  const currentSelected = selectedAnswers[currentIndex];
  const isCurrentCorrect = answeredCurrent && currentSelected === currentQuestion?.correctAnswerIndex;

  // Score calculation
  const totalCorrect = Object.keys(selectedAnswers).filter(
    (idx) => selectedAnswers[Number(idx)] === questions[Number(idx)]?.correctAnswerIndex
  ).length;

  const percentageScore = questions.length > 0 ? Math.round((totalCorrect / questions.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden max-h-[96vh] sm:max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white truncate">
              Interactive Revision Quiz
            </h2>
            <AIBadge label="Auto-Generated" size="sm" />
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <div>
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                  Synthesizing Multiple-Choice Questions...
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Gemini is analyzing "{resource.title}" for {displayCode} conceptual checks.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="py-10 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{error}</p>
              <button
                onClick={loadQuiz}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
              >
                Retry Generation
              </button>
            </div>
          ) : isCompleted ? (
            /* Quiz Completed View */
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
                <Trophy className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Quiz Completed!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Based on: {resource.title} ({displayCode})
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 max-w-sm mx-auto">
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {percentageScore}%
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {totalCorrect} of {questions.length} questions correct
                </div>
              </div>

              {savedToTracker && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Score saved directly to CATs &amp; Exams Tracker under "{topic?.name}"</span>
                </div>
              )}

              <div className="flex items-center justify-center gap-3 pt-3">
                <button
                  onClick={loadQuiz}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake Quiz</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Close &amp; View Analytics
                </button>
              </div>
            </div>
          ) : (
            /* Active Question View */
            <div className="space-y-5">
              {/* Progress indicator */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500 dark:text-slate-400">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-slate-400">
                  Score: {totalCorrect} / {Object.keys(selectedAnswers).length}
                </span>
              </div>

              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>

              {/* Question Text */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                  {currentQuestion?.question}
                </p>
              </div>

              {/* Multiple Choice Options */}
              <div className="space-y-2.5">
                {currentQuestion?.options.map((option, optIdx) => {
                  const isSelected = currentSelected === optIdx;
                  const isCorrectAnswer = optIdx === currentQuestion.correctAnswerIndex;

                  let optClass =
                    "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200";

                  if (answeredCurrent) {
                    if (isCorrectAnswer) {
                      optClass =
                        "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-semibold";
                    } else if (isSelected && !isCorrectAnswer) {
                      optClass =
                        "border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200";
                    } else {
                      optClass = "opacity-50 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900";
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(optIdx)}
                      disabled={answeredCurrent}
                      className={`w-full text-left p-3.5 rounded-lg border text-xs sm:text-sm transition-all flex items-start gap-3 cursor-pointer ${optClass}`}
                    >
                      <span className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center font-bold text-xs border border-current">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="flex-1 mt-0.5 leading-snug">{option}</span>

                      {answeredCurrent && (
                        <span className="shrink-0 mt-0.5">
                          {isCorrectAnswer ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          ) : isSelected ? (
                            <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                          ) : null}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Immediate Feedback & Explanation */}
              {answeredCurrent && (
                <div
                  className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                    isCurrentCorrect
                      ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                      : "bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>
                      {isCurrentCorrect ? "Correct!" : "Conceptual Review Needed"}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}

              {/* Next Question / Finish Button */}
              {answeredCurrent && (
                <div className="flex flex-col sm:flex-row justify-end pt-2">
                  {currentIndex < questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentIndex(currentIndex + 1)}
                      className="w-full sm:w-auto justify-center inline-flex items-center gap-1.5 px-4 py-2.5 sm:py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
                    >
                      <span>Next Question</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsCompleted(true)}
                      className="w-full sm:w-auto justify-center inline-flex items-center gap-1.5 px-4 py-2.5 sm:py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
                    >
                      <span>View Quiz Results</span>
                      <Trophy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
