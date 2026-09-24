export type AccentTheme = "calm" | "focus" | "energize";

export interface User {
  id: string;
  name: string;
  email: string;
  university: string;
  major: string;
  yearOfStudy: number; // 1, 2, 3, 4, 5+
  semester: "Semester 1" | "Semester 2";
  term?: string; // e.g. "Year 3, Semester 1"
  accentTheme?: AccentTheme;
}

export type Semester = "Semester 1" | "Semester 2";

export interface Unit {
  id: string;
  userId: string;
  unitCode?: string; // e.g. "BIT 2101", "CCS 3105" (optional/standard for Kenyan units)
  code?: string; // alias for unitCode
  title: string; // unit name, e.g. "Operating Systems & Systems Programming"
  name?: string; // alias for title
  description: string;
  yearOfStudy: number; // Year of study: 1, 2, 3, 4, 5+
  semester: Semester; // Semester 1 or Semester 2
  term?: string; // Display string, e.g. "Year 2, Semester 1"
  color: string;
  createdAt: string;
  updatedAt?: string;
}

// Backwards compatibility alias: Course refers to Unit in Kenyan university system
export type Course = Unit;

export interface Topic {
  id: string;
  userId: string;
  unitId: string; // Kenyan university unit ID
  courseId?: string; // alias for backwards compatibility
  name: string; // e.g. "Concurrency, Semaphores & Deadlock"
  description?: string;
  progress?: number; // Completion percentage (0 - 100%)
  createdAt: string;
}

export type ResourceType = "note" | "pdf" | "video";

export interface Resource {
  id: string;
  userId: string;
  unitId: string; // Kenyan university unit ID
  courseId?: string; // alias for backwards compatibility
  topicId: string;
  type: ResourceType;
  title: string;
  content: string; // Note markdown/text, or extracted PDF text, or video notes
  fileUrl?: string; // Data URL or storage URL for PDF
  fileName?: string;
  fileSize?: string;
  storagePath?: string; // Firebase Storage object path for organized asset tracking and cleanup
  videoUrl?: string; // URL for video lesson
  tags: string[];
  aiSummary?: string;
  aiSummaryDate?: string;
  aiSummarySimple?: string;
  aiSummarySimpleDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MathStep {
  stepNumber: number;
  title: string;
  latex?: string;
  explanation: string;
}

export interface MathSolution {
  problem: string;
  topic?: string;
  finalAnswer: string;
  steps: MathStep[];
  examTips?: string[];
  generatedAt: string;
  isSimulated?: boolean;
}

export type AssessmentType = "CAT 1" | "CAT 2" | "Practical CAT" | "Assignment" | "Quiz" | "Final Exam";

export interface Result {
  id: string;
  userId: string;
  unitId: string; // Kenyan university unit ID
  courseId?: string; // alias for backwards compatibility
  topicId: string;
  assessmentType: AssessmentType; // e.g. "CAT 1", "CAT 2", "Final Exam"
  assessmentName: string; // e.g. "CAT 1: Concurrency & Semaphores", "Final Exam"
  score: number;
  maxScore: number;
  percentage: number;
  date: string; // YYYY-MM-DD
  source: "manual" | "auto_quiz";
  quizId?: string;
  notes?: string;
  createdAt: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  userId: string;
  unitId: string; // Kenyan university unit ID
  courseId?: string; // alias
  topicId: string;
  resourceId?: string;
  title: string;
  questions: QuizQuestion[];
  completedAt?: string;
  score?: number;
  totalQuestions: number;
  createdAt: string;
}

export interface AIRecommendation {
  topicName: string;
  urgency: string;
  scoreAnalysis: string;
  actionableAdvice: string;
  recommendedResourceIds?: string[];
}

export interface QuickCaptureClassification {
  title: string;
  suggestedType: ResourceType;
  unitId: string; // Kenyan university unit ID
  courseId?: string; // alias
  topicId: string;
  isUncategorized: boolean;
  tags?: string[];
  confidenceExplanation: string;
}

export interface CitationData {
  title: string;
  authors: string;
  year: string;
  publication: string;
  urlOrDoi: string;
  sourceType: string;
}

export interface CitationResult {
  apa: string;
  mla: string;
  inTextAPA?: string;
  inTextMLA?: string;
  generatedAt?: string;
}

export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export interface TimetableEntry {
  id: string;
  userId: string;
  unitId: string; // Links directly to Unit records (Feature 3)
  day: DayOfWeek;
  startTime: string; // "08:00" in 24h format
  endTime: string; // "10:00" in 24h format
  venue?: string; // e.g. "LT 2B", "Lab 4", "Main Campus Hall 3" (optional)
  lecturer?: string; // e.g. "Dr. Njoroge" (optional)
  notes?: string; // e.g. "Weekly tutorial session" (optional)
  color?: string; // custom or inherits unit color
  createdAt: string;
  updatedAt?: string;
}

export type TaskPriority = "low" | "medium" | "high";
export type TaskType = "assignment" | "cat_prep" | "reading" | "lab_report" | "revision";

export interface UnitTask {
  id: string;
  userId: string;
  unitId: string;
  title: string;
  description?: string;
  dueDate?: string; // YYYY-MM-DD
  priority: TaskPriority;
  type: TaskType;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

