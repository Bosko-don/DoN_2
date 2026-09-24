import { QuickCaptureClassification, CitationData, CitationResult, QuizQuestion } from "../types";

export interface SummarizeResponse {
  summary: string;
  generatedAt: string;
  simpler?: boolean;
  isSimulated?: boolean;
}

export interface MathSolveResponse {
  problem: string;
  topic: string;
  finalAnswer: string;
  steps: Array<{
    stepNumber: number;
    title: string;
    latex?: string;
    explanation: string;
  }>;
  examTips?: string[];
  generatedAt: string;
  isSimulated?: boolean;
}

export interface RecommendationItem {
  topicName: string;
  urgency: string;
  scoreAnalysis: string;
  actionableAdvice: string;
  recommendedResourceIds?: string[];
}

export interface RecommendationsResponse {
  generalGuidance: string;
  recommendations: RecommendationItem[];
  generatedAt: string;
  isSimulated?: boolean;
}

export interface GenerateQuizResponse {
  quizTitle: string;
  questions: QuizQuestion[];
  generatedAt: string;
  isSimulated?: boolean;
}

function assertOnline() {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error(
      "You are currently offline. Online AI features require an active internet connection. Your saved library notes and items remain fully accessible offline."
    );
  }
}

export async function summarizeResource(
  title: string,
  content: string,
  type: string,
  unitName?: string,
  unitCode?: string,
  simpler: boolean = false
): Promise<SummarizeResponse> {
  assertOnline();
  let res: Response;
  try {
    res = await fetch("/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, type, unitName, unitCode, simpler }),
    });
  } catch (err: any) {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      assertOnline();
    }
    throw err;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Summarization failed" }));
    throw new Error(err.error || "Failed to generate summary");
  }
  return res.json();
}

export async function solveMathProblem(
  problem: string,
  unitName?: string,
  unitCode?: string,
  topic?: string
): Promise<MathSolveResponse> {
  assertOnline();
  let res: Response;
  try {
    res = await fetch("/api/ai/math-solve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problem, unitName, unitCode, topic }),
    });
  } catch (err: any) {
    if (typeof navigator !== "undefined" && !navigator.onLine) assertOnline();
    throw err;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Math solve request failed" }));
    throw new Error(err.error || "Failed to solve problem");
  }
  return res.json();
}

export async function fetchAIRecommendations(
  weakTopics: Array<{ topicName: string; avgScore: number; assessmentsCount: number }>,
  unitName: string,
  availableResources: Array<{ id: string; title: string; type: string; topicName: string }>,
  unitCode?: string
): Promise<RecommendationsResponse> {
  assertOnline();
  let res: Response;
  try {
    res = await fetch("/api/ai/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weakTopics,
        unitName,
        courseName: unitName,
        unitCode,
        availableResources,
      }),
    });
  } catch (err: any) {
    if (typeof navigator !== "undefined" && !navigator.onLine) assertOnline();
    throw err;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Recommendation query failed" }));
    throw new Error(err.error || "Failed to generate recommendations");
  }
  return res.json();
}

export async function generateAIQuiz(
  title: string,
  content: string,
  unitName: string,
  topicName: string,
  questionCount: number = 4,
  unitCode?: string
): Promise<GenerateQuizResponse> {
  assertOnline();
  let res: Response;
  try {
    res = await fetch("/api/ai/generate-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        unitName,
        courseName: unitName,
        unitCode,
        topicName,
        questionCount,
      }),
    });
  } catch (err: any) {
    if (typeof navigator !== "undefined" && !navigator.onLine) assertOnline();
    throw err;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Quiz generation failed" }));
    throw new Error(err.error || "Failed to generate quiz");
  }
  return res.json();
}

export async function classifyQuickCaptureInput(
  input: string,
  units: Array<{
    id: string;
    code?: string;
    unitCode?: string;
    title?: string;
    name?: string;
    topics?: Array<{ id: string; name: string }>;
  }>
): Promise<QuickCaptureClassification> {
  assertOnline();
  let res: Response;
  try {
    res = await fetch("/api/ai/quick-capture-classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input,
        units,
        courses: units.map((u) => ({
          id: u.id,
          code: u.unitCode || u.code || "",
          title: u.title || u.name || "",
          topics: u.topics || [],
        })),
      }),
    });
  } catch (err: any) {
    if (typeof navigator !== "undefined" && !navigator.onLine) assertOnline();
    throw err;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Quick capture classification failed" }));
    throw new Error(err.error || "Failed to auto-sort quick capture");
  }
  return res.json();
}

export async function generateAICitation(data: CitationData): Promise<CitationResult> {
  assertOnline();
  let res: Response;
  try {
    res = await fetch("/api/ai/citation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (err: any) {
    if (typeof navigator !== "undefined" && !navigator.onLine) assertOnline();
    throw err;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Citation generation failed" }));
    throw new Error(err.error || "Failed to generate citation");
  }
  return res.json();
}
