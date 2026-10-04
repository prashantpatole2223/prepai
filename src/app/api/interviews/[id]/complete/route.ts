import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { finalReportSchema } from "@/lib/validators";
import { buildReportPrompt } from "@/lib/prompts";
import { generateJson, AIError } from "@/lib/gemini";
import { checkAiRateLimit } from "@/lib/ratelimit";
import { Prisma } from "@prisma/client";

export const maxDuration = 60;

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch interview with questions and answers
    const interview = await prisma.interview.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: {
            answer: true,
          },
        },
      },
    });

    if (!interview) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }

    // 2. If already COMPLETED, return the stored report (idempotent, SPEC Section 6)
    if (interview.status === "COMPLETED" && interview.report) {
      return NextResponse.json(interview.report);
    }

    // 3. Verify all questions must be answered
    const unanswered = interview.questions.filter((q) => !q.answer);
    if (unanswered.length > 0) {
      return NextResponse.json(
        { error: "All questions must be answered before completing the interview" },
        { status: 400 }
      );
    }

    // Rate limit check
    const rateLimit = checkAiRateLimit(session.user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests, wait a moment" },
        { status: 429 }
      );
    }

    // 4. Compute overallScore as the average of answer scores, rounded to 1 decimal
    const totalScore = interview.questions.reduce(
      (sum, q) => sum + (q.answer?.score || 0),
      0
    );
    const overallScore = Number(
      (totalScore / interview.questions.length).toFixed(1)
    );

    // 5. Compute actual per-topic average scores (SPEC Section 8.3)
    const topicStats = new Map<string, { total: number; count: number }>();
    for (const q of interview.questions) {
      const stats = topicStats.get(q.topic) || { total: 0, count: 0 };
      topicStats.set(q.topic, {
        total: stats.total + (q.answer?.score || 0),
        count: stats.count + 1,
      });
    }

    const calculatedTopicScores = Array.from(topicStats.entries()).map(
      ([topic, stats]) => ({
        topic,
        score: Number((stats.total / stats.count).toFixed(1)),
      })
    );

    // 6. Build prompt input
    const results = interview.questions.map((q) => {
      const fb = q.answer?.feedback as { weaknesses?: string[] } | null;
      return {
        topic: q.topic,
        question: q.text,
        score: q.answer?.score || 0,
        weaknesses: fb?.weaknesses || [],
      };
    });

    const prompt = buildReportPrompt({
      role: interview.role,
      difficulty: interview.difficulty,
      results,
    });

    // 7. Call Gemini for final report (temperature 0.2)
    const aiReport = await generateJson(prompt, finalReportSchema, 0.2);

    // Overwrite topicScores with calculated averages (SPEC Section 8.3)
    aiReport.topicScores = calculatedTopicScores;

    // 8. Save report, overallScore, status=COMPLETED, completedAt
    const updatedInterview = await prisma.interview.update({
      where: { id: interview.id },
      data: {
        overallScore,
        report: aiReport as unknown as Prisma.InputJsonValue,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    return NextResponse.json(updatedInterview.report);
  } catch (error) {
    console.error("POST /api/interviews/[id]/complete error:", error);

    if (error instanceof AIError) {
      return NextResponse.json(
        {
          error:
            error.message ||
            (error.statusCode === 429
              ? "Too many requests, wait a moment"
              : "AI response failed, please try again"),
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate interview report. Please try again." },
      { status: 500 }
    );
  }
}
