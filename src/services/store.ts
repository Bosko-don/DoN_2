import {
  Unit,
  Course,
  Topic,
  Resource,
  Result,
  Quiz,
  User,
  AccentTheme,
  AssessmentType,
  TimetableEntry,
  DayOfWeek,
  DAYS_OF_WEEK,
  UnitTask,
  TaskPriority,
  TaskType,
} from "../types";
import {
  persistUnitToFirestore,
  deleteUnitFromFirestore,
  subscribeToFirestoreUnits,
  persistTimetableEntryToFirestore,
  deleteTimetableEntryFromFirestore,
  subscribeToFirestoreTimetable,
  deleteResourcePdf,
} from "./firebase";

export const PLACEHOLDER_USER: User = {
  id: "student_u01",
  name: "Samuel Ombaso",
  email: "s.ombaso@students.uonbi.ac.ke",
  university: "University of Nairobi (UoN)",
  major: "BSc. Business Information Technology (BIT)",
  yearOfStudy: 3,
  semester: "Semester 1",
  term: "Year 3, Semester 1",
  accentTheme: "calm",
};

// Production initial state: strictly clean slate with no sample/mock data
export const INITIAL_UNITS: Unit[] = [];
export const INITIAL_COURSES = INITIAL_UNITS;

const INITIAL_TOPICS: Topic[] = [];

export const INITIAL_RESOURCES: Resource[] = [];
export const INITIAL_RESULTS: Result[] = [];
export const INITIAL_TIMETABLE: TimetableEntry[] = [];
export const INITIAL_TASKS: UnitTask[] = [];

const STORAGE_KEYS = {
  UNITS: "don_academic_units_v3_prod",
  TOPICS: "don_academic_topics_v3_prod",
  RESOURCES: "don_academic_resources_v3_prod",
  RESULTS: "don_academic_results_v3_prod",
  QUIZZES: "don_academic_quizzes_v3_prod",
  TIMETABLE: "don_academic_timetable_v3_prod",
  TASKS: "don_academic_tasks_v3_prod",
  ACCENT_THEME: "don_accent_theme",
  USER_PROFILE: "don_academic_user_profile_v1",
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((l) => {
    try {
      l();
    } catch (e) {
      // silent in production
    }
  });
}

class AcademicStore {
  private units: Unit[] = [];
  private topics: Topic[] = [];
  private resources: Resource[] = [];
  private results: Result[] = [];
  private quizzes: Quiz[] = [];
  private timetable: TimetableEntry[] = [];
  private tasks: UnitTask[] = [];
  private user: User = { ...PLACEHOLDER_USER };

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedUnits = localStorage.getItem(STORAGE_KEYS.UNITS);
      if (storedUnits) {
        this.units = JSON.parse(storedUnits);
      } else {
        // Check for backwards compatibility with v1
        const legacyCourses = localStorage.getItem("don_academic_courses_v1");
        if (legacyCourses) {
          const parsed = JSON.parse(legacyCourses);
          this.units = parsed.map((c: any, index: number) => ({
            ...c,
            unitCode: c.code || `BIT ${2100 + index}`,
            code: c.code || `BIT ${2100 + index}`,
            title: c.title || "Academic Unit",
            name: c.title || "Academic Unit",
            yearOfStudy: c.yearOfStudy || 2,
            semester: c.semester || "Semester 1",
            term: c.term || "Year 2, Semester 1",
          }));
        } else {
          this.units = INITIAL_UNITS;
        }
      }

      const storedTopics = localStorage.getItem(STORAGE_KEYS.TOPICS);
      if (storedTopics) {
        const parsed: Topic[] = JSON.parse(storedTopics);
        this.topics = parsed.map((t) => {
          if (typeof t.progress === "number") return t;
          const matchInitial = INITIAL_TOPICS.find((it) => it.id === t.id);
          return {
            ...t,
            progress: matchInitial?.progress !== undefined ? matchInitial.progress : undefined,
          };
        });
      } else {
        this.topics = INITIAL_TOPICS;
      }

      const storedResources = localStorage.getItem(STORAGE_KEYS.RESOURCES);
      if (storedResources) {
        this.resources = JSON.parse(storedResources);
      } else {
        this.resources = INITIAL_RESOURCES;
      }

      const storedResults = localStorage.getItem(STORAGE_KEYS.RESULTS);
      if (storedResults) {
        this.results = JSON.parse(storedResults);
      } else {
        this.results = INITIAL_RESULTS;
      }

      const storedQuizzes = localStorage.getItem(STORAGE_KEYS.QUIZZES);
      this.quizzes = storedQuizzes ? JSON.parse(storedQuizzes) : [];

      const storedTimetable = localStorage.getItem(STORAGE_KEYS.TIMETABLE);
      if (storedTimetable) {
        this.timetable = JSON.parse(storedTimetable);
      } else {
        this.timetable = INITIAL_TIMETABLE;
      }

      const storedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (storedTasks) {
        this.tasks = JSON.parse(storedTasks);
      } else {
        this.tasks = INITIAL_TASKS;
      }

      const storedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (storedProfile) {
        try {
          this.user = { ...this.user, ...JSON.parse(storedProfile) };
        } catch {
          // silent
        }
      }

      const storedTheme = localStorage.getItem(STORAGE_KEYS.ACCENT_THEME);
      if (storedTheme === "calm" || storedTheme === "focus" || storedTheme === "energize") {
        this.user.accentTheme = storedTheme;
      }
    } catch (e) {
      // silent in production
      this.units = INITIAL_UNITS;
      this.topics = INITIAL_TOPICS;
      this.resources = INITIAL_RESOURCES;
      this.results = INITIAL_RESULTS;
      this.quizzes = [];
      this.timetable = INITIAL_TIMETABLE;
      this.tasks = INITIAL_TASKS;
      this.user = { ...PLACEHOLDER_USER };
    }

    // Initialize real-time synchronization with Firestore 'units' collection
    if (typeof window !== "undefined") {
      try {
        subscribeToFirestoreUnits((firestoreUnits) => {
          if (firestoreUnits && firestoreUnits.length > 0) {
            let hasChanges = false;
            firestoreUnits.forEach((fu) => {
              const existingIdx = this.units.findIndex((u) => u.id === fu.id);
              const mapped: Unit = {
                id: fu.id,
                userId: fu.userId || PLACEHOLDER_USER.id,
                unitCode: fu.unitCode || fu.code || undefined,
                code: fu.code || fu.unitCode || undefined,
                title: fu.title || fu.name || "Untitled Unit",
                name: fu.title || fu.name || "Untitled Unit",
                description: fu.description || "",
                yearOfStudy: fu.yearOfStudy || 1,
                semester: fu.semester || "Semester 1",
                term: fu.term || `Year ${fu.yearOfStudy || 1}, ${fu.semester || "Semester 1"}`,
                color: fu.color || "#2563eb",
                createdAt: fu.createdAt || new Date().toISOString(),
              };

              if (existingIdx >= 0) {
                // Update existing unit if properties differ
                if (
                  this.units[existingIdx].unitCode !== mapped.unitCode ||
                  this.units[existingIdx].title !== mapped.title ||
                  this.units[existingIdx].description !== mapped.description
                ) {
                  this.units[existingIdx] = { ...this.units[existingIdx], ...mapped };
                  hasChanges = true;
                }
              } else {
                // Insert unit from Firestore
                this.units.unshift(mapped);
                hasChanges = true;
              }
            });

            if (hasChanges) {
              try {
                localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(this.units));
              } catch (e) {
                // silent in production
              }
              notifyListeners();
            }
          }
        });

        // Initialize real-time synchronization with Firestore 'timetable' collection
        subscribeToFirestoreTimetable((firestoreTimetable) => {
          if (firestoreTimetable && firestoreTimetable.length > 0) {
            let hasChanges = false;
            firestoreTimetable.forEach((ft) => {
              const existingIdx = this.timetable.findIndex((t) => t.id === ft.id);
              const mapped: TimetableEntry = {
                id: ft.id,
                userId: ft.userId || PLACEHOLDER_USER.id,
                unitId: ft.unitId,
                day: ft.day,
                startTime: ft.startTime,
                endTime: ft.endTime,
                venue: ft.venue || undefined,
                lecturer: ft.lecturer || undefined,
                notes: ft.notes || undefined,
                color: ft.color || undefined,
                createdAt: ft.createdAt || new Date().toISOString(),
                updatedAt: ft.updatedAt,
              };

              if (existingIdx >= 0) {
                if (
                  this.timetable[existingIdx].unitId !== mapped.unitId ||
                  this.timetable[existingIdx].day !== mapped.day ||
                  this.timetable[existingIdx].startTime !== mapped.startTime ||
                  this.timetable[existingIdx].endTime !== mapped.endTime ||
                  this.timetable[existingIdx].venue !== mapped.venue ||
                  this.timetable[existingIdx].lecturer !== mapped.lecturer
                ) {
                  this.timetable[existingIdx] = { ...this.timetable[existingIdx], ...mapped };
                  hasChanges = true;
                }
              } else {
                this.timetable.push(mapped);
                hasChanges = true;
              }
            });

            if (hasChanges) {
              try {
                localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(this.timetable));
              } catch (e) {
                // silent in production
              }
              notifyListeners();
            }
          }
        });
      } catch (err) {
        // silent in production
      }
    }
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(this.units));
      localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(this.topics));
      localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(this.resources));
      localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(this.results));
      localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(this.quizzes));
      localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(this.timetable));
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(this.tasks));
    } catch (e) {
      // silent in production
    }
    notifyListeners();
  }

  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  // --- Units (Kenyan University Structure) ---
  getUnits(): Unit[] {
    return [...this.units];
  }

  // Backwards compatibility alias
  getCourses(): Unit[] {
    return this.getUnits();
  }

  getUnit(id: string): Unit | undefined {
    return this.units.find((u) => u.id === id);
  }

  // Backwards compatibility alias
  getCourse(id: string): Unit | undefined {
    return this.getUnit(id);
  }

  addUnit(data: Omit<Unit, "id" | "userId" | "createdAt">): Unit {
    const rawUnitCode = (data.unitCode || data.code || "").trim();
    const unitCode = rawUnitCode ? rawUnitCode.toUpperCase() : undefined;
    const title = data.title || data.name || "Untitled Unit";
    const yearOfStudy = data.yearOfStudy || 1;
    const semester = data.semester || "Semester 1";
    const newUnit: Unit = {
      ...data,
      id: "unit_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      userId: PLACEHOLDER_USER.id,
      unitCode,
      code: unitCode,
      title,
      name: title,
      yearOfStudy,
      semester,
      term: `Year ${yearOfStudy}, ${semester}`,
      createdAt: new Date().toISOString(),
    };
    this.units.unshift(newUnit);
    this.save();

    // Persist to Cloud Firestore 'units' collection asynchronously
    persistUnitToFirestore(newUnit).catch((err) => {
      // silent in production
    });

    return newUnit;
  }

  // Backwards compatibility alias
  addCourse(data: any): Unit {
    return this.addUnit(data);
  }

  deleteUnit(id: string) {
    this.units = this.units.filter((u) => u.id !== id);
    this.topics = this.topics.filter((t) => t.unitId !== id && t.courseId !== id);
    this.resources = this.resources.filter((r) => r.unitId !== id && r.courseId !== id);
    this.results = this.results.filter((res) => res.unitId !== id && res.courseId !== id);
    this.timetable = this.timetable.filter((t) => t.unitId !== id);
    this.tasks = this.tasks.filter((t) => t.unitId !== id);
    this.save();

    // Delete from Cloud Firestore 'units' collection
    deleteUnitFromFirestore(id).catch((err) => {
      // silent in production
    });
  }

  // Backwards compatibility alias
  deleteCourse(id: string) {
    this.deleteUnit(id);
  }

  // --- Topics ---
  getTopics(unitId?: string): Topic[] {
    if (unitId) {
      return this.topics.filter((t) => t.unitId === unitId || t.courseId === unitId);
    }
    return [...this.topics];
  }

  getTopic(id: string): Topic | undefined {
    return this.topics.find((t) => t.id === id);
  }

  addTopic(data: Omit<Topic, "id" | "userId" | "createdAt">): Topic {
    const effectiveUnitId = data.unitId || data.courseId || "";
    const newTopic: Topic = {
      ...data,
      id: "topic_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      userId: PLACEHOLDER_USER.id,
      unitId: effectiveUnitId,
      courseId: effectiveUnitId,
      createdAt: new Date().toISOString(),
    };
    this.topics.push(newTopic);
    this.save();
    return newTopic;
  }

  deleteTopic(id: string) {
    this.topics = this.topics.filter((t) => t.id !== id);
    this.resources = this.resources.filter((r) => r.topicId !== id);
    this.results = this.results.filter((res) => res.topicId !== id);
    this.save();
  }

  updateTopic(id: string, updates: Partial<Omit<Topic, "id" | "userId" | "createdAt">>): Topic | undefined {
    const idx = this.topics.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;
    this.topics[idx] = {
      ...this.topics[idx],
      ...updates,
    };
    this.save();
    return this.topics[idx];
  }

  updateTopicProgress(id: string, progress: number): Topic | undefined {
    const clamped = Math.max(0, Math.min(100, Math.round(progress)));
    return this.updateTopic(id, { progress: clamped });
  }

  getTopicCompletion(topicId: string): number {
    const topic = this.topics.find((t) => t.id === topicId);
    if (!topic) return 0;
    if (typeof topic.progress === "number") {
      return topic.progress;
    }
    // Calculate composite completion if not explicitly set
    const topicResources = this.resources.filter((r) => r.topicId === topicId);
    const topicResults = this.results.filter((res) => res.topicId === topicId);
    const topicQuizzes = this.quizzes.filter((q) => q.topicId === topicId);

    let score = 0;
    if (topicResources.length > 0) score += 30;
    if (topicResources.some((r) => r.type === "note")) score += 15;
    if (topicResources.some((r) => r.type === "pdf")) score += 15;
    if (topicResources.some((r) => !!r.aiSummary)) score += 15;
    if (topicResults.length > 0) score += 15;
    if (topicQuizzes.some((q) => !!q.completedAt)) score += 10;
    return Math.min(100, score);
  }

  // --- Resources ---
  getResources(): Resource[] {
    return [...this.resources];
  }

  getResource(id: string): Resource | undefined {
    return this.resources.find((r) => r.id === id);
  }

  addResource(data: Omit<Resource, "id" | "userId" | "createdAt" | "updatedAt">): Resource {
    const effectiveUnitId = data.unitId || data.courseId || "";
    const newRes: Resource = {
      ...data,
      id: "res_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      userId: PLACEHOLDER_USER.id,
      unitId: effectiveUnitId,
      courseId: effectiveUnitId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.resources.unshift(newRes);
    this.save();
    return newRes;
  }

  updateResource(id: string, updates: Partial<Resource>): Resource | undefined {
    const idx = this.resources.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    const effectiveUnitId = updates.unitId || updates.courseId || this.resources[idx].unitId;
    this.resources[idx] = {
      ...this.resources[idx],
      ...updates,
      unitId: effectiveUnitId,
      courseId: effectiveUnitId,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.resources[idx];
  }

  deleteResource(id: string) {
    const target = this.resources.find((r) => r.id === id);
    if (target) {
      const storageTarget = target.storagePath || (target.fileUrl && target.fileUrl.includes("firebasestorage") ? target.fileUrl : undefined);
      if (storageTarget) {
        deleteResourcePdf(storageTarget).catch(() => {});
      }
    }
    this.resources = this.resources.filter((r) => r.id !== id);
    this.save();
  }

  deleteResources(ids: string[]): number {
    if (!ids || ids.length === 0) return 0;
    const idSet = new Set(ids);
    const targets = this.resources.filter((r) => idSet.has(r.id));
    targets.forEach((target) => {
      const storageTarget = target.storagePath || (target.fileUrl && target.fileUrl.includes("firebasestorage") ? target.fileUrl : undefined);
      if (storageTarget) {
        deleteResourcePdf(storageTarget).catch(() => {});
      }
    });
    const initialLen = this.resources.length;
    this.resources = this.resources.filter((r) => !idSet.has(r.id));
    const deletedCount = initialLen - this.resources.length;
    if (deletedCount > 0) {
      this.save();
    }
    return deletedCount;
  }

  // --- Results (CATs & Final Exams) ---
  getResults(unitId?: string, topicId?: string): Result[] {
    let filtered = [...this.results];
    if (unitId) {
      filtered = filtered.filter((r) => r.unitId === unitId || r.courseId === unitId);
    }
    if (topicId) {
      filtered = filtered.filter((r) => r.topicId === topicId);
    }
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  addResult(data: Omit<Result, "id" | "userId" | "percentage" | "createdAt">): Result {
    const percentage = Math.round((data.score / (data.maxScore || 1)) * 100);
    const effectiveUnitId = data.unitId || data.courseId || "";
    const assessmentType = data.assessmentType || (data.assessmentName.toLowerCase().includes("final") ? "Final Exam" : "CAT 1");
    const newResult: Result = {
      ...data,
      id: "score_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      userId: PLACEHOLDER_USER.id,
      unitId: effectiveUnitId,
      courseId: effectiveUnitId,
      assessmentType,
      percentage,
      createdAt: new Date().toISOString(),
    };
    this.results.unshift(newResult);
    this.save();
    return newResult;
  }

  deleteResult(id: string) {
    this.results = this.results.filter((r) => r.id !== id);
    this.save();
  }

  // --- Quizzes ---
  getQuizzes(): Quiz[] {
    return [...this.quizzes];
  }

  addQuiz(data: Omit<Quiz, "id" | "userId" | "createdAt">): Quiz {
    const effectiveUnitId = data.unitId || data.courseId || "";
    const newQuiz: Quiz = {
      ...data,
      id: "quiz_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      userId: PLACEHOLDER_USER.id,
      unitId: effectiveUnitId,
      courseId: effectiveUnitId,
      createdAt: new Date().toISOString(),
    };
    this.quizzes.unshift(newQuiz);
    this.save();
    return newQuiz;
  }

  updateQuiz(id: string, updates: Partial<Quiz>): Quiz | undefined {
    const idx = this.quizzes.findIndex((q) => q.id === id);
    if (idx === -1) return undefined;
    this.quizzes[idx] = { ...this.quizzes[idx], ...updates };
    this.save();
    return this.quizzes[idx];
  }

  // Helper analytics for Kenyan university performance & weak topics
  getTopicPerformanceStats() {
    const statsMap: Record<
      string,
      {
        topicId: string;
        topicName: string;
        unitId: string;
        courseId: string;
        unitCode: string;
        courseCode: string;
        unitTitle: string;
        yearOfStudy: number;
        semester: string;
        totalScore: number;
        count: number;
      }
    > = {};

    this.results.forEach((r) => {
      const topic = this.getTopic(r.topicId);
      const unit = this.getUnit(r.unitId || r.courseId || "");
      const targetUnitId = r.unitId || r.courseId || "";
      if (!statsMap[r.topicId]) {
        const uCode = unit?.unitCode || unit?.code || "Unit";
        const uTitle = unit?.title || unit?.name || "Unit";
        statsMap[r.topicId] = {
          topicId: r.topicId,
          topicName: topic ? topic.name : "Topic",
          unitId: targetUnitId,
          courseId: targetUnitId,
          unitCode: uCode,
          courseCode: uCode,
          unitTitle: uTitle,
          yearOfStudy: unit?.yearOfStudy || 1,
          semester: unit?.semester || "Semester 1",
          totalScore: 0,
          count: 0,
        };
      }
      statsMap[r.topicId].totalScore += r.percentage;
      statsMap[r.topicId].count += 1;
    });

    return Object.values(statsMap).map((item) => ({
      ...item,
      avgScore: Math.round(item.totalScore / (item.count || 1)),
    }));
  }

  // --- Timetable (Weekly School Schedule Linked to Units) ---
  getTimetable(): TimetableEntry[] {
    const DAY_ORDER: Record<DayOfWeek, number> = {
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
      Sunday: 7,
    };
    return [...this.timetable].sort((a, b) => {
      const d = DAY_ORDER[a.day] - DAY_ORDER[b.day];
      if (d !== 0) return d;
      return a.startTime.localeCompare(b.startTime);
    });
  }

  getTimetableByDay(day: DayOfWeek): TimetableEntry[] {
    return this.timetable
      .filter((t) => t.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  getTodayLessons(targetDate?: Date): {
    todayName: DayOfWeek;
    dateFormatted: string;
    lessons: TimetableEntry[];
    allWeekCount: number;
  } {
    const d = targetDate || new Date();
    const dayMap: DayOfWeek[] = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const todayName = dayMap[d.getDay()];

    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    const dateFormatted = d.toLocaleDateString("en-US", options);
    const lessons = this.getTimetableByDay(todayName);

    return {
      todayName,
      dateFormatted,
      lessons,
      allWeekCount: this.timetable.length,
    };
  }

  getTimetableEntry(id: string): TimetableEntry | undefined {
    return this.timetable.find((t) => t.id === id);
  }

  addTimetableEntry(data: Omit<TimetableEntry, "id" | "userId" | "createdAt">): TimetableEntry {
    const newEntry: TimetableEntry = {
      ...data,
      id: "tt_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      userId: PLACEHOLDER_USER.id,
      venue: data.venue?.trim() || undefined,
      lecturer: data.lecturer?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    this.timetable.push(newEntry);
    this.save();

    // Persist to Cloud Firestore 'timetable' collection asynchronously
    persistTimetableEntryToFirestore(newEntry).catch((err) => {
      // silent in production
    });

    return newEntry;
  }

  updateTimetableEntry(
    id: string,
    updates: Partial<Omit<TimetableEntry, "id" | "userId" | "createdAt">>
  ): TimetableEntry | undefined {
    const index = this.timetable.findIndex((t) => t.id === id);
    if (index === -1) return undefined;

    const existing = this.timetable[index];
    const updated: TimetableEntry = {
      ...existing,
      ...updates,
      venue: updates.venue !== undefined ? updates.venue.trim() || undefined : existing.venue,
      lecturer: updates.lecturer !== undefined ? updates.lecturer.trim() || undefined : existing.lecturer,
      notes: updates.notes !== undefined ? updates.notes.trim() || undefined : existing.notes,
      updatedAt: new Date().toISOString(),
    };

    this.timetable[index] = updated;
    this.save();

    // Persist to Cloud Firestore
    persistTimetableEntryToFirestore(updated).catch((err) => {
      // silent in production
    });

    return updated;
  }

  deleteTimetableEntry(id: string): boolean {
    const initialLen = this.timetable.length;
    this.timetable = this.timetable.filter((t) => t.id !== id);
    if (this.timetable.length !== initialLen) {
      this.save();
      deleteTimetableEntryFromFirestore(id).catch((err) => {
        // silent in production
      });
      return true;
    }
    return false;
  }

  resetToDefaults() {
    this.units = INITIAL_UNITS;
    this.topics = INITIAL_TOPICS;
    this.resources = INITIAL_RESOURCES;
    this.results = INITIAL_RESULTS;
    this.quizzes = [];
    this.timetable = INITIAL_TIMETABLE;
    this.tasks = INITIAL_TASKS;
    this.save();
  }

  // --- Academic Unit Tasks & Summary ---
  getTasks(unitId?: string): UnitTask[] {
    if (unitId) {
      return this.tasks.filter((t) => t.unitId === unitId);
    }
    return [...this.tasks];
  }

  getPendingTasks(unitId?: string): UnitTask[] {
    return this.getTasks(unitId).filter((t) => !t.completed);
  }

  getCompletedTasks(unitId?: string): UnitTask[] {
    return this.getTasks(unitId).filter((t) => t.completed);
  }

  addTask(data: Omit<UnitTask, "id" | "userId" | "createdAt" | "completed">): UnitTask {
    const newTask: UnitTask = {
      ...data,
      id: "task_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      userId: PLACEHOLDER_USER.id,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    this.tasks.unshift(newTask);
    this.save();
    return newTask;
  }

  toggleTask(id: string): UnitTask | undefined {
    const idx = this.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;
    const isNowCompleted = !this.tasks[idx].completed;
    this.tasks[idx] = {
      ...this.tasks[idx],
      completed: isNowCompleted,
      completedAt: isNowCompleted ? new Date().toISOString() : undefined,
    };
    this.save();
    return this.tasks[idx];
  }

  updateTask(
    id: string,
    updates: Partial<Omit<UnitTask, "id" | "userId" | "createdAt">>
  ): UnitTask | undefined {
    const idx = this.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;
    this.tasks[idx] = {
      ...this.tasks[idx],
      ...updates,
    };
    this.save();
    return this.tasks[idx];
  }

  deleteTask(id: string): boolean {
    const prevLen = this.tasks.length;
    this.tasks = this.tasks.filter((t) => t.id !== id);
    if (this.tasks.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  getUnitSummary(unitId: string) {
    const unit = this.getUnit(unitId);
    const unitResources = this.resources.filter(
      (r) => r.unitId === unitId || r.courseId === unitId
    );
    const unitTasks = this.tasks.filter((t) => t.unitId === unitId);
    const pendingTasks = unitTasks.filter((t) => !t.completed);
    const completedTasks = unitTasks.filter((t) => t.completed);

    const resourcesByType = {
      notes: unitResources.filter((r) => r.type === "note").length,
      pdfs: unitResources.filter((r) => r.type === "pdf").length,
      videos: unitResources.filter((r) => r.type === "video").length,
    };

    return {
      unit,
      resourceCount: unitResources.length,
      resourcesByType,
      resources: unitResources,
      pendingTasksCount: pendingTasks.length,
      completedTasksCount: completedTasks.length,
      totalTasksCount: unitTasks.length,
      pendingTasks,
      completedTasks,
      allTasks: unitTasks,
    };
  }

  getAllUnitsSummary() {
    return this.units.map((unit) => this.getUnitSummary(unit.id));
  }

  getUser(): User {
    return { ...this.user };
  }

  updateUser(updates: Partial<User>): User {
    this.user = { ...this.user, ...updates };
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(this.user));
    } catch {
      // silent
    }
    notifyListeners();
    return { ...this.user };
  }

  getAccentTheme(): AccentTheme {
    const saved = localStorage.getItem(STORAGE_KEYS.ACCENT_THEME);
    if (saved === "calm" || saved === "focus" || saved === "energize") {
      return saved;
    }
    return this.user.accentTheme || "calm";
  }

  setAccentTheme(theme: AccentTheme): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCENT_THEME, theme);
      sessionStorage.setItem(STORAGE_KEYS.ACCENT_THEME, theme);
    } catch {
      // silent
    }
    this.user.accentTheme = theme;
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(this.user));
    } catch {
      // silent
    }
    notifyListeners();
  }
}

export const store = new AcademicStore();
