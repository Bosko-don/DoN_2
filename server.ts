// Ensure tsx ambient __dirname does not leak into ESM modules/plugins like vite-plugin-pwa
if (typeof (globalThis as any).__dirname === "string") {
  delete (globalThis as any).__dirname;
}
if (typeof (global as any).__dirname === "string") {
  delete (global as any).__dirname;
}

import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Helper to get Gemini client lazily
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Resilient model cascade: if 503 high demand occurs on gemini-3.8-flash, try alternative models
const CANDIDATE_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.1-pro-preview",
  "gemini-flash-latest",
];

async function generateWithFallback(
  ai: GoogleGenAI,
  callConfig: {
    contents: string;
    config?: any;
  }
) {
  let lastError: any = null;
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        ...callConfig,
        model: modelName,
      });
      return { response, modelUsed: modelName };
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || JSON.stringify(err);
      const isTemporaryDemand =
        errMsg.includes("503") ||
        errMsg.includes("high demand") ||
        errMsg.includes("UNAVAILABLE") ||
        errMsg.includes("429") ||
        errMsg.includes("RESOURCE_EXHAUSTED") ||
        errMsg.includes("Overloaded");

      if (isTemporaryDemand) {
        continue;
      }
      // If it's a permanent configuration error, throw directly
      throw err;
    }
  }
  throw lastError;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", geminiConfigured: Boolean(process.env.GEMINI_API_KEY) });
});

// Feature 2: AI note/PDF summarizer with "Explain it simpler" toggle support
app.post("/api/ai/summarize", async (req, res) => {
  const { title, content, type, unitName, unitCode, simpler } = req.body;
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return res.status(400).json({ error: "Content is required for summarization." });
  }

  const isSimpler = Boolean(simpler);

  try {
    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is not configured. Please set GEMINI_API_KEY in your environment.",
      });
    }

    const prompt = isSimpler
      ? `You are an intuitive academic tutor explaining complex university concepts to a student in the Kenyan university system who clicked "Explain it simpler".
Break down the following study material (${type || "note"} titled "${title || "Untitled"}"${unitCode ? ` for unit ${unitCode}` : ""}) using clean, vivid analogies, plain-English conceptual intuition, and zero unnecessary jargon.

CRITICAL TERMINOLOGY RULES:
- Refer strictly to "unit" and "topic".
- NEVER use generic or US-style terms like "subject", "class", or "grade level".
- Refer to university evaluations as CATs (Continuous Assessment Tests) and Final Exams.

Resource Content:
${content.slice(0, 30000)}

Format your output using clean Markdown with exactly these three sections:
### Plain English Intuition (Explain It Simpler)
(A warm, conversational, crystal-clear 2-3 sentence overview using an intuitive real-world analogy)

### Big Picture Analogies & Core Ideas
(Bulleted breakdown using everyday analogies explaining what problem this solves and how it works)

### Quick Revision Rules for CATs & Exams
(Numbered list of 3-4 memorable rules of thumb to ace upcoming CATs and the Final Exam without getting lost in abstraction)`
      : `You are an academic learning assistant for university students adhering to the Kenyan university curriculum structure.
Analyze the following academic study resource (${type || "note"} titled "${title || "Untitled"}"${unitCode ? ` for unit ${unitCode}` : ""}) and produce a clean, skimmable, rigorous academic summary.

CRITICAL TERMINOLOGY RULES:
- Refer strictly to "unit" and "topic".
- NEVER use generic or US-style terms like "subject", "class", or "grade level".
- Assessment preparation refers to Continuous Assessment Tests ("CATs") and "Final Exams".

Resource Content:
${content.slice(0, 30000)}

Format your output using clean Markdown with exactly these three sections:
### Executive Summary
(A concise, dense 2-3 sentence overview of the central thesis/topic of this unit material)

### Core Theoretical Concepts
(Bulleted breakdown with bold key terms and clear academic definitions)

### Key Takeaways for CAT & Final Exam Review
(Numbered list of 3-5 high-yield revision points or exam focus items for this unit topic)`;

    const { response } = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: isSimpler
          ? "You are an award-winning university educator in Kenya renowned for simplifying difficult mathematical, scientific, and computing theories into intuitive everyday concepts. Always refer to 'unit' and 'topic', never 'subject' or 'class'. Refer to evaluations as CATs and Final Exams."
          : "You are an expert university academic lecturer and coach in Kenya. Provide rigorous, clear, and highly skimmable study summaries. Always refer to 'unit' and 'topic', never 'subject' or 'class'. Refer to evaluations as CATs and Final Exams.",
        temperature: isSimpler ? 0.5 : 0.3,
      },
    });

    const summary = response.text || "No summary generated.";
    return res.json({ summary, generatedAt: new Date().toISOString(), simpler: isSimpler });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || "Failed to generate AI summary. Please try again.",
    });
  }
});

// Feature 5: AI-generated recommendations based on weak topics
app.post("/api/ai/recommendations", async (req, res) => {
  const { weakTopics, unitName, courseName, unitCode, availableResources } = req.body;
  const targetUnitName = unitName || courseName || "Academic Unit";

  if (!weakTopics || !Array.isArray(weakTopics) || weakTopics.length === 0) {
    return res.json({
      generalGuidance: "Log assessment results across your units to unlock AI-powered topic diagnostic recommendations.",
      recommendations: [],
      generatedAt: new Date().toISOString(),
    });
  }

  try {
    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is not configured. Please set GEMINI_API_KEY in your environment.",
      });
    }

    const prompt = `You are an academic advisor for university students in the Kenyan university system.
The student is enrolled in the unit "${unitCode ? `${unitCode}: ` : ""}${targetUnitName}".
Here is their performance data on their weakest topics across Continuous Assessment Tests (CATs) and exams:
${JSON.stringify(weakTopics, null, 2)}

Here are the resources currently saved in their unit library for these topics:
${JSON.stringify(availableResources, null, 2)}

CRITICAL TERMINOLOGY INSTRUCTIONS:
- Refer strictly to "unit" and "topic".
- NEVER use generic or US-style terms like "subject" or "class".
- Continuous assessments must be termed "CAT" (Continuous Assessment Test) and semester evaluations as "Final Exam".

Provide tailored, diagnostic recommendations pointing the student directly to their tagged resources to reinforce understanding before upcoming CATs and the Final Exam.`;

    const { response } = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            generalGuidance: {
              type: Type.STRING,
              description: "Overall high-level academic study strategy for this unit.",
            },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topicName: { type: Type.STRING },
                  urgency: { type: Type.STRING, description: "'High Priority' or 'Moderate Priority'" },
                  scoreAnalysis: { type: Type.STRING, description: "Diagnostic explanation of current performance gap in CATs/exams." },
                  actionableAdvice: { type: Type.STRING, description: "Specific study instructions pointing to unit notes/PDFs/videos." },
                  recommendedResourceIds: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Matching resource IDs to study.",
                  },
                },
                required: ["topicName", "urgency", "scoreAnalysis", "actionableAdvice"],
              },
            },
          },
          required: ["generalGuidance", "recommendations"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      generalGuidance: parsed.generalGuidance || "Focus on foundational topics with regular revision.",
      recommendations: parsed.recommendations || [],
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || "Failed to generate AI recommendations. Please try again.",
    });
  }
});

// Feature 6: Auto-generated revision quizzes from notes
app.post("/api/ai/generate-quiz", async (req, res) => {
  const { title, content, unitName, courseName, unitCode, topicName, questionCount = 4 } = req.body;
  const targetUnitName = unitName || courseName || "Academic Unit";
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return res.status(400).json({ error: "Content is required to generate quiz." });
  }

  try {
    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is not configured. Please set GEMINI_API_KEY in your environment.",
      });
    }

    const prompt = `You are a university lecturer preparing a rigorous revision multiple-choice assessment for university students in unit "${unitCode ? `${unitCode}: ` : ""}${targetUnitName}" on the topic "${topicName || "Topic"}".
Based strictly on the following unit study material ("${title || "Study Note"}"):
${content.slice(0, 30000)}

CRITICAL TERMINOLOGY INSTRUCTIONS:
- Refer strictly to "unit" and "topic".
- NEVER use generic or US-style terms like "subject", "class", or "grade level".
- Frame questions and explanations in the context of preparing for university CATs (Continuous Assessment Tests) and Final Exams.

Generate ${questionCount} challenging, high-quality multiple choice questions.
For each question:
- State a clear, substantive question testing conceptual grasp (not trivial trivia).
- Provide 4 distinct options (A, B, C, D).
- Specify the 0-based index of the correct option (0, 1, 2, or 3).
- Provide a clear, educational academic explanation of why the correct option is right and others are incorrect.`;

    const { response } = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quizTitle: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctAnswerIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                },
                required: ["question", "options", "correctAnswerIndex", "explanation"],
              },
            },
          },
          required: ["quizTitle", "questions"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      quizTitle: parsed.quizTitle || `Revision: ${title}`,
      questions: parsed.questions || [],
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || "Failed to generate revision quiz. Please try again.",
    });
  }
});

// Feature 13: Quick-capture box auto-classification
app.post("/api/ai/quick-capture-classify", async (req, res) => {
  const { input, units, courses } = req.body;
  const unitList = units || courses || [];
  if (!input || typeof input !== "string" || input.trim().length === 0) {
    return res.status(400).json({ error: "Input text is required." });
  }

  try {
    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is not configured. Please set GEMINI_API_KEY in your environment.",
      });
    }

    const prompt = `You are an automated academic organizer for a university student in the Kenyan university system.
The student rapidly entered this raw thought, link, or note:
"""${input}"""

Here is the student's current list of academic units (with unit codes) and their syllabus topics:
${JSON.stringify(unitList, null, 2)}

CRITICAL TERMINOLOGY INSTRUCTIONS:
- Refer strictly to "unit" and "topic".
- NEVER use generic or US-style terms like "subject" or "class".

Task:
1. Determine the best matching unit ID and topic ID based on the content.
2. If the entry does not clearly belong to any existing unit/topic with high confidence, set unitId to "uncategorized" and topicId to "uncategorized", with isUncategorized set to true.
3. Suggest an academic, descriptive title for this note/resource (max 60 characters).
4. Determine the suggested resource type ("note" for typed ideas/equations/reminders, "video" if it looks like a YouTube/lecture recording URL, or "pdf" if referring to a document).
5. Suggest 1 to 3 relevant academic tags.
6. Provide a concise 1-sentence confidence explanation referencing the unit or topic.`;

    const { response } = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            suggestedType: { type: Type.STRING, enum: ["note", "video", "pdf"] },
            unitId: { type: Type.STRING },
            courseId: { type: Type.STRING },
            topicId: { type: Type.STRING },
            isUncategorized: { type: Type.BOOLEAN },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            confidenceExplanation: { type: Type.STRING },
          },
          required: ["title", "suggestedType", "unitId", "topicId", "isUncategorized", "confidenceExplanation"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    if (!parsed.courseId && parsed.unitId) {
      parsed.courseId = parsed.unitId;
    }
    return res.json(parsed);
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || "Failed to auto-sort quick capture. Please try again.",
    });
  }
});

// Feature 14: Citation generator (APA & MLA styles)
app.post("/api/ai/citation", async (req, res) => {
  const { title, authors, year, publication, urlOrDoi, sourceType } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Source title is required." });
  }

  try {
    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is not configured. Please set GEMINI_API_KEY in your environment.",
      });
    }

    const prompt = `You are an academic librarian and citation specialist.
Generate precise, correctly formatted academic citations in both APA (7th edition) and MLA (9th edition) styles for the following source details:

Source Type: ${sourceType || "Academic Paper / Book"}
Title: ${title}
Author(s): ${authors || "Not specified"}
Year / Publication Date: ${year || "n.d."}
Publication / Journal / Publisher: ${publication || "Not specified"}
URL or DOI: ${urlOrDoi || "None"}

Return strict JSON with both formatted citations as plain text.`;

    const { response } = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            apa: { type: Type.STRING, description: "Full formatted APA 7th edition citation." },
            mla: { type: Type.STRING, description: "Full formatted MLA 9th edition citation." },
            inTextAPA: { type: Type.STRING, description: "In-text APA citation, e.g. (Smith, 2024)." },
            inTextMLA: { type: Type.STRING, description: "In-text MLA citation, e.g. (Smith 42)." },
          },
          required: ["apa", "mla"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      ...parsed,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || "Failed to generate citation. Please try again.",
    });
  }
});

// Feature 17: Step-by-step Math & STEM Problem Solver with reasoning
app.post("/api/ai/math-solve", async (req, res) => {
  const { problem, unitName, unitCode, topic } = req.body;
  if (!problem || typeof problem !== "string" || problem.trim().length === 0) {
    return res.status(400).json({ error: "Problem text or mathematical expression is required." });
  }

  const trimmedProblem = problem.trim();

  try {
    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is not configured. Please set GEMINI_API_KEY in your environment.",
      });
    }

    const prompt = `You are an expert university mathematics and engineering lecturer in Kenya.
Solve the following university-level math/STEM problem with rigorous step-by-step reasoning, clear explanations, clean LaTeX representations where helpful, and strategic CAT/Final Exam tips for Kenyan university students.

CRITICAL TERMINOLOGY RULES:
- Use "unit" and "topic".
- NEVER use "subject" or "class" or "grade level".
- Refer to evaluations as CATs (Continuous Assessment Tests) and Final Exams.

Unit Context: ${unitName ? `${unitName} (${unitCode || ""})` : "University STEM Unit"}
Topic: ${topic || "Mathematics / Engineering Analysis"}
Problem:
${trimmedProblem}

Output strict JSON with:
- topic: specific sub-field or topic name
- finalAnswer: clear, concise statement of the final verified answer or result
- steps: array of sequential steps, each with:
    stepNumber: integer
    title: concise step heading (e.g., "Differentiate both sides using the chain rule")
    latex: optional math expression or formula string (valid LaTeX, e.g. "f'(x) = 3x^2 + 2")
    explanation: pedagogical plain-English rationale for WHY this step is performed
- examTips: array of 2-3 strategic tips for scoring maximum marks on similar problems in CATs and Final Exams.`;

    const { response } = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction:
          "You are a master university mathematics professor and tutor for Kenyan university engineering and science students. Provide crystal-clear step-by-step derivations with both LaTeX and conceptual reasoning. Always reference unit CATs and Final Exams.",
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            finalAnswer: { type: Type.STRING },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  latex: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ["stepNumber", "title", "explanation"],
              },
            },
            examTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["finalAnswer", "steps"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      problem: trimmedProblem,
      topic: parsed.topic || topic || "Applied Mathematics",
      finalAnswer: parsed.finalAnswer || "Solution resolved.",
      steps: Array.isArray(parsed.steps) ? parsed.steps : [],
      examTips: Array.isArray(parsed.examTips) ? parsed.examTips : [],
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || "Failed to solve math problem. Please check your query and try again.",
    });
  }
});

// Vite middleware in dev or static files in production
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const http = await import("http");
    const server = http.createServer(app);
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  }
}

setupVite().catch(() => {
  process.exit(1);
});
