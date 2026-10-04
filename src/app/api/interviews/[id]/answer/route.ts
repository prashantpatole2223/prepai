import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { submitAnswerSchema, answerFeedbackSchema } from "@/lib/validators";
import { buildEvaluationPrompt } from "@/lib/prompts";
import { generateJson, AIError } from "@/lib/gemini";
import { checkAiRateLimit } from "@/lib/ratelimit";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = submitAnswerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { questionId, userAnswer: rawAnswer } = result.data;
    // Truncate to 4000 chars server-side (SPEC Section 9)
    const userAnswer = rawAnswer.slice(0, 4000).trim();

    // 1. Verify interview belongs to user and is IN_PROGRESS
    const interview = await prisma.interview.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!interview) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }

    if (interview.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Interview is already completed" },
        { status: 400 }
      );
    }

    // 2. Verify question belongs to this interview
    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        interviewId: interview.id,
      },
      include: {
        answer: true,
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found in this interview" },
        { status: 404 }
      );
    }

    // 3. Verify question is not already answered
    if (question.answer) {
      return NextResponse.json(
        { error: "This question has already been answered" },
        { status: 409 }
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

    // 4. Call Gemini with evaluation prompt (temp 0.2)
    const prompt = buildEvaluationPrompt({
      role: interview.role,
      difficulty: interview.difficulty,
      question: question.text,
      topic: question.topic,
      userAnswer,
    });

    const feedbackResult = await generateJson(
      prompt,
      answerFeedbackSchema,
      0.2
    );

    // 5. Save answer in database
    const createdAnswer = await prisma.answer.create({
      data: {
        questionId: question.id,
        userAnswer,
        score: feedbackResult.score,
        feedback: feedbackResult,
      },
    });

    return NextResponse.json({
      score: createdAnswer.score,
      feedback: feedbackResult,
    });
  } catch (error) {
    console.error("POST /api/interviews/[id]/answer error:", error);

    if (error instanceof AIError) {
      return NextResponse.json(
        {
          error:
            error.statusCode === 429
              ? "Too many requests, wait a moment"
              : "AI response failed, please try again",
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Failed to evaluate answer. Please try again." },
      { status: 500 }
    );
  }
}
