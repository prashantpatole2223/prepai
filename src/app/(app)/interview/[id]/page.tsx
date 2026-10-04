"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react";
import QuestionCard from "@/components/QuestionCard";
import FeedbackPanel, { FeedbackData } from "@/components/FeedbackPanel";
import LoadingState from "@/components/LoadingState";

interface AnswerRecord {
  id: string;
  questionId: string;
  userAnswer: string;
  score: number;
  feedback: FeedbackData;
}

interface QuestionRecord {
  id: string;
  order: number;
  text: string;
  topic: string;
  answer?: AnswerRecord | null;
}

interface InterviewRecord {
  id: string;
  role: string;
  skills: string[];
  difficulty: "EASY" | "MEDIUM" | "HARD";
  totalQuestions: number;
  status: "IN_PROGRESS" | "COMPLETED";
  questions: QuestionRecord[];
}

export default function LiveInterviewPage() {
  const router = useRouter();
  const params = useParams();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<InterviewRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Current question index in questions array (0-indexed)
  const [currentIndex, setCurrentIndex] = useState(0);

  // Answer text for current question
  const [userAnswer, setUserAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Evaluation response for current question (if just answered)
  const [currentFeedback, setCurrentFeedback] = useState<FeedbackData | null>(null);
  const [currentScore, setCurrentScore] = useState<number | null>(null);

  // Load interview data
  useEffect(() => {
    async function loadInterview() {
      try {
        const res = await fetch(`/api/interviews/${interviewId}`);
        if (!res.ok) {
          throw new Error("Failed to load interview");
        }
        const data: InterviewRecord = await res.json();

        // If already completed, jump straight to the report
        if (data.status === "COMPLETED") {
          router.replace(`/interview/${interviewId}/report`);
          return;
        }

        setInterview(data);

        // Resume at first unanswered question (SPEC Section 7)
        const firstUnansweredIndex = data.questions.findIndex((q) => !q.answer);
        if (firstUnansweredIndex !== -1) {
          setCurrentIndex(firstUnansweredIndex);
        } else {
          // If all questions are answered, ready to finish
          setCurrentIndex(data.questions.length - 1);
        }
      } catch {
        setError("Could not find or load this interview.");
      } finally {
        setLoading(false);
      }
    }

    if (interviewId) {
      loadInterview();
    }
  }, [interviewId, router]);

  // Sync state when currentIndex changes
  useEffect(() => {
    if (!interview) return;
    const currentQ = interview.questions[currentIndex];
    if (currentQ?.answer) {
      setUserAnswer(currentQ.answer.userAnswer);
      setCurrentFeedback(currentQ.answer.feedback);
      setCurrentScore(currentQ.answer.score);
    } else {
      setUserAnswer("");
      setCurrentFeedback(null);
      setCurrentScore(null);
    }
    setSubmitError(null);
  }, [currentIndex, interview]);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interview) return;
    const currentQ = interview.questions[currentIndex];
    if (!currentQ || !userAnswer.trim()) return;

    setSubmitError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/interviews/${interview.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQ.id,
          userAnswer: userAnswer.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Failed to submit answer. Please try again.");
        setSubmitting(false);
        return;
      }

      // Update state with answer and evaluation feedback
      setCurrentScore(data.score);
      setCurrentFeedback(data.feedback);

      // Update local interview record
      setInterview((prev) => {
        if (!prev) return null;
        const updatedQuestions = [...prev.questions];
        updatedQuestions[currentIndex] = {
          ...updatedQuestions[currentIndex],
          answer: {
            id: `temp-${Date.now()}`,
            questionId: currentQ.id,
            userAnswer: userAnswer.trim(),
            score: data.score,
            feedback: data.feedback,
          },
        };
        return {
          ...prev,
          questions: updatedQuestions,
        };
      });
    } catch {
      setSubmitError("Network error occurred while evaluating your answer.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextOrFinish = () => {
    if (!interview) return;
    const isLast = currentIndex === interview.questions.length - 1;

    if (isLast) {
      // Redirect to report page (which will finalize the interview if not already done)
      router.push(`/interview/${interview.id}/report`);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <LoadingState
          title="Loading interview session..."
          message="Preparing your questions and previous answers."
          className="max-w-md w-full py-12"
        />
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-2xl bg-navy-900 border border-slate-800 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Interview Not Found</h2>
          <p className="text-sm text-slate-400">
            {error || "The interview you requested could not be loaded."}
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = interview.questions[currentIndex];
  const isAnswered = !!currentFeedback || !!currentQuestion?.answer;
  const isLastQuestion = currentIndex === interview.questions.length - 1;
  const answeredCount = interview.questions.filter((q) => !!q.answer).length;
  const progressPercent = Math.round((answeredCount / interview.totalQuestions) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Top Header & Progress */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              {interview.role} Mock Interview
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Question {currentIndex + 1} of {interview.totalQuestions}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">
              {answeredCount}/{interview.totalQuestions} Completed
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 rounded-full"
            style={{ width: `${Math.max(5, progressPercent)}%` }}
          />
        </div>

        {/* Step dots for quick navigation */}
        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-1">
          {interview.questions.map((q, idx) => {
            const hasAnswer = !!q.answer;
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isCurrent
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : hasAnswer
                    ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/40"
                    : "bg-navy-900 text-slate-500 border border-slate-800 hover:text-slate-300"
                }`}
              >
                {hasAnswer && <CheckCircle className="w-3 h-3" />}
                <span>Q{idx + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <QuestionCard
          order={currentQuestion.order}
          totalQuestions={interview.totalQuestions}
          topic={currentQuestion.topic}
          text={currentQuestion.text}
          difficulty={interview.difficulty}
        />
      )}

      {/* Answer Form or Feedback Panel */}
      <div className="mt-6">
        {submitting ? (
          <LoadingState
            title="Evaluating your answer..."
            message="Gemini AI is assessing correctness, depth, and communication skills against technical rubrics."
            className="py-12"
          />
        ) : isAnswered && currentFeedback && currentScore !== null ? (
          <div className="space-y-6">
            {/* Candidate's submitted answer review */}
            <div className="p-5 rounded-2xl bg-navy-900/60 border border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Your Answer
              </span>
              <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                {userAnswer}
              </p>
            </div>

            {/* AI Evaluation */}
            <FeedbackPanel
              score={currentScore}
              feedback={currentFeedback}
            />

            {/* Next / Finish CTA button */}
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleNextOrFinish}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] transition-all shadow-lg shadow-indigo-600/25"
              >
                <span>{isLastQuestion ? "Finish & See Report" : "Next Question"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitAnswer} className="space-y-4">
            {submitError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-rose-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="bg-navy-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="userAnswer"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Your Technical Answer
                </label>
                <span
                  className={`text-xs ${
                    userAnswer.length > 3800 ? "text-amber-400 font-semibold" : "text-slate-500"
                  }`}
                >
                  {userAnswer.length} / 4000
                </span>
              </div>

              <textarea
                id="userAnswer"
                rows={7}
                required
                maxLength={4000}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Explain clearly with concepts, practical considerations, and trade-offs. 2-6 sentences recommended..."
                className="w-full px-4 py-3 rounded-xl bg-navy-950 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm leading-relaxed transition-colors resize-y"
              />

              <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Evaluated in real-time by AI with constructive feedback</span>
                </p>

                <button
                  type="submit"
                  disabled={submitting || !userAnswer.trim()}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all shadow-lg shadow-indigo-600/25"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Evaluating...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Answer</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
