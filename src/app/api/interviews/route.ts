import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createInterviewSchema, generatedQuestionsSchema } from "@/lib/validators";
import { buildQuestionGenerationPrompt } from "@/lib/prompts";
import { generateJson, AIError } from "@/lib/gemini";
import { checkAiRateLimit } from "@/lib/ratelimit";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const interviews = await prisma.interview.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        role: true,
        skills: true,
        difficulty: true,
        status: true,
        overallScore: true,
        createdAt: true,
        totalQuestions: true,
      },
    });

    return NextResponse.json(interviews);
  } catch (error) {
    console.error("GET /api/interviews error:", error);
    return NextResponse.json(
      { error: "Failed to fetch interviews" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = createInterviewSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { role, skills, difficulty, totalQuestions } = result.data;

    // Rate limit check
    const rateLimit = checkAiRateLimit(session.user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests, wait a moment" },
        { status: 429 }
      );
    }

    // 1. Build prompt and call Gemini
    const prompt = buildQuestionGenerationPrompt({
      role,
      skills,
      difficulty,
      count: totalQuestions,
    });

    const aiResponse = await generateJson(prompt, generatedQuestionsSchema, 0.7);

    if (!aiResponse.questions || aiResponse.questions.length === 0) {
      return NextResponse.json(
        { error: "AI response failed, please try again" },
        { status: 502 }
      );
    }

    const finalQuestions = aiResponse.questions.slice(0, totalQuestions);

    // 2. Create Interview and Questions in a single transaction
    const newInterview = await prisma.$transaction(async (tx) => {
      const interview = await tx.interview.create({
        data: {
          userId: session.user.id,
          role,
          skills,
          difficulty,
          totalQuestions: finalQuestions.length,
          status: "IN_PROGRESS",
        },
      });

      const questionsToCreate = finalQuestions.map((q, idx) => ({
        interviewId: interview.id,
        order: idx + 1,
        text: q.text,
        topic: q.topic,
      }));

      await tx.question.createMany({
        data: questionsToCreate,
      });

      return interview;
    });

    return NextResponse.json({ id: newInterview.id }, { status: 201 });
  } catch (error) {
    console.error("POST /api/interviews error:", error);

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
      { error: "Failed to create interview. Please try again." },
      { status: 500 }
    );
  }
}
