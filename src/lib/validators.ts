import { z } from "zod";

// ==========================================
// User & Auth Input Validators
// ==========================================

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").max(100),
  skills: z
    .array(z.string().min(1).max(40, "Skill name must be 40 characters or fewer"))
    .max(15, "You can specify up to 15 skills"),
  experienceLevel: z.enum(["FRESHER", "JUNIOR", "MID", "SENIOR"]),
  targetRole: z.string().max(100).optional().nullable(),
});

// ==========================================
// Interview Input Validators
// ==========================================

export const createInterviewSchema = z.object({
  role: z.string().min(2, "Role must be at least 2 characters").max(100),
  skills: z
    .array(z.string().min(1).max(50))
    .min(1, "Please provide at least 1 skill")
    .max(8, "Maximum 8 skills allowed for an interview"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  totalQuestions: z.union([z.literal(3), z.literal(5), z.literal(8)]),
});

export const submitAnswerSchema = z.object({
  questionId: z.string().min(1, "questionId is required"),
  userAnswer: z
    .string()
    .min(1, "Answer cannot be empty")
    .max(4000, "Answer cannot exceed 4000 characters"),
});

// ==========================================
// AI Output Validators
// ==========================================

// 8.1 Questions Output Schema
export const generatedQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      text: z.string().min(10, "Question must be at least 10 characters"),
      topic: z.string().min(1, "Topic is required"),
    })
  ),
});

export type GeneratedQuestions = z.infer<typeof generatedQuestionsSchema>;

// 8.2 Evaluation Output Schema
export const answerFeedbackSchema = z.object({
  score: z.number().min(0).max(10),
  strengths: z.array(z.string()).max(4),
  weaknesses: z.array(z.string()).max(4),
  idealAnswer: z.string().min(1, "Ideal answer cannot be empty"),
  tips: z.array(z.string()).max(4),
});

export type AnswerFeedback = z.infer<typeof answerFeedbackSchema>;

// 8.3 Final Report Output Schema
export const finalReportSchema = z.object({
  summary: z.string().min(10),
  topStrengths: z.array(z.string()),
  areasToImprove: z.array(z.string()),
  topicScores: z.array(
    z.object({
      topic: z.string(),
      score: z.number(),
    })
  ),
  studyPlan: z.array(
    z.object({
      action: z.string(),
      reason: z.string(),
    })
  ),
  readinessLevel: z.enum([
    "NOT_READY",
    "NEEDS_PRACTICE",
    "ALMOST_READY",
    "INTERVIEW_READY",
  ]),
});

export type FinalReport = z.infer<typeof finalReportSchema>;
