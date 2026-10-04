"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  LayoutDashboard,
  Target,
  ListTodo,
  Layers,
  HelpCircle,
  Clock,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import LoadingState from "@/components/LoadingState";
import ScoreBadge from "@/components/ScoreBadge";
import { FeedbackData } from "@/components/FeedbackPanel";

interface QuestionWithAnswer {
  id: string;
  order: number;
  text: string;
  topic: string;
  answer?: {
    userAnswer: string;
    score: number;
    feedback: FeedbackData;
  } | null;
}

interface ReportData {
  summary: string;
  topStrengths: string[];
  areasToImprove: string[];
  topicScores: Array<{ topic: string; score: number }>;
  studyPlan: Array<{ action: string; reason: string }>;
  readinessLevel: "NOT_READY" | "NEEDS_PRACTICE" | "ALMOST_READY" | "INTERVIEW_READY";
}

interface InterviewWithReport {
  id: string;
  role: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  totalQuestions: number;
  status: "IN_PROGRESS" | "COMPLETED";
  overallScore: number | null;
  report: ReportData | null;
  completedAt: string | null;
  questions: QuestionWithAnswer[];
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<InterviewWithReport | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded accordion state for questions review
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  const toggleExpand = (qId: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const fetchOrCompleteReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // First fetch interview
      const getRes = await fetch(`/api/interviews/${interviewId}`);
      if (!getRes.ok) {
        throw new Error("Interview not found");
      }
      const data: InterviewWithReport = await getRes.json();
      setInterview(data);

      if (data.status === "COMPLETED" && data.report) {
        setReport(data.report);
        setLoading(false);
        return;
      }

      // If not completed yet, trigger completion
      const completeRes = await fetch(`/api/interviews/${interviewId}/complete`, {
        method: "POST",
      });

      const completeData = await completeRes.json();

      if (!completeRes.ok) {
        setError(
          completeData.error ||
            (completeRes.status === 502
              ? "The AI service is busy right now, please try again in a few seconds."
              : "Failed to finalize interview report.")
        );
        setLoading(false);
        return;
      }

      setReport(completeData);

      // Re-fetch updated interview with overall score
      const refreshedRes = await fetch(`/api/interviews/${interviewId}`);
      if (refreshedRes.ok) {
        const refreshedData = await refreshedRes.json();
        setInterview(refreshedData);
      }
    } catch {
      setError("An error occurred while compiling your final evaluation.");
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  useEffect(() => {
    if (interviewId) {
      fetchOrCompleteReport();
    }
  }, [interviewId, fetchOrCompleteReport]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <LoadingState
          title="Synthesizing Your Comprehensive Report..."
          message="Gemini AI is analyzing your performance across all questions, calculating topic competencies, and curating an action-oriented study roadmap."
          className="max-w-md w-full py-12"
        />
      </div>
    );
  }

  if (error || !interview || !report) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-2xl bg-navy-900 border border-slate-800 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Report Generation Issue</h2>
          <p className="text-sm text-slate-400">
            {error || "Could not generate or load report."}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => fetchOrCompleteReport()}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => router.push(`/interview/${interviewId}`)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Resume Interview
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const readinessMeta = {
    NOT_READY: {
      label: "Needs Substantial Preparation",
      badge: "bg-rose-500/15 border-rose-500/30 text-rose-400",
    },
    NEEDS_PRACTICE: {
      label: "Needs Targeted Practice",
      badge: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    },
    ALMOST_READY: {
      label: "Almost Interview Ready",
      badge: "bg-blue-500/15 border-blue-500/30 text-blue-400",
    },
    INTERVIEW_READY: {
      label: "Strong & Interview Ready",
      badge: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    },
  }[report.readinessLevel] || {
    label: report.readinessLevel,
    badge: "bg-indigo-500/15 border-indigo-500/30 text-indigo-400",
  };

  const finalScore = interview.overallScore ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Top Banner & Quick Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>Interview Performance Report</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {interview.role} Mock Assessment
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-3">
            <span>Difficulty: <span className="text-slate-200 uppercase font-semibold">{interview.difficulty}</span></span>
            <span>•</span>
            <span>{interview.totalQuestions} Questions</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/interview/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Practice Again</span>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white bg-navy-900 border border-slate-800 hover:bg-slate-800 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Hero Score & Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className="md:col-span-1 p-6 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-xl flex flex-col items-center justify-center text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Overall Score
          </span>
          <div className="text-5xl sm:text-6xl font-black text-white tracking-tight">
            {finalScore.toFixed(1)}
            <span className="text-xl sm:text-2xl text-slate-500 font-semibold"> / 10</span>
          </div>

          <div className={`mt-4 px-3.5 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${readinessMeta.badge}`}>
            {readinessMeta.label}
          </div>

          <p className="text-[11px] text-slate-500 mt-3">
            Computed from {interview.questions.length} evaluated technical answers
          </p>
        </div>

        {/* Executive Summary */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-xl flex flex-col justify-center">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Executive Evaluation</span>
          </div>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
            {report.summary}
          </p>
        </div>
      </div>

      {/* Strengths & Areas to Improve */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Strengths */}
        <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/25 shadow-xl">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-4">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Demonstrated Strengths</span>
          </div>
          <ul className="space-y-2.5 text-sm text-slate-200">
            {report.topStrengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas to Improve */}
        <div className="p-6 rounded-2xl bg-amber-950/20 border border-amber-500/25 shadow-xl">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-4">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>Target Areas for Improvement</span>
          </div>
          <ul className="space-y-2.5 text-sm text-slate-200">
            {report.areasToImprove.map((area, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Topic Competency Breakdown */}
      {report.topicScores && report.topicScores.length > 0 && (
        <div className="p-6 sm:p-7 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Skill & Topic Competencies</span>
          </div>

          <div className="space-y-3.5">
            {report.topicScores.map((ts, idx) => {
              const scorePct = Math.round((ts.score / 10) * 100);
              const barColor =
                ts.score >= 8
                  ? "from-emerald-500 to-teal-400"
                  : ts.score >= 5
                  ? "from-amber-500 to-yellow-400"
                  : "from-rose-500 to-pink-500";

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-medium text-slate-200">{ts.topic}</span>
                    <span className="font-bold text-slate-300">
                      {ts.score.toFixed(1)} <span className="text-slate-500 font-normal">/ 10</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(4, scorePct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Personalized Study Roadmap */}
      {report.studyPlan && report.studyPlan.length > 0 && (
        <div className="p-6 sm:p-7 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <ListTodo className="w-4 h-4 text-indigo-400" />
            <span>Recommended Actionable Study Plan</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {report.studyPlan.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-navy-950 border border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs mb-1.5">
                    <Target className="w-3.5 h-3.5 shrink-0" />
                    <span>Step {idx + 1}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white leading-snug mb-1.5">
                    {item.action}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question by Question Detailed Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            <span>Question-by-Question Deep Dive</span>
          </h3>
          <span className="text-xs text-slate-400">
            {interview.questions.length} questions evaluated
          </span>
        </div>

        <div className="space-y-3">
          {interview.questions.map((q) => {
            const isExpanded = !!expandedQuestions[q.id];
            const answer = q.answer;
            const score = answer?.score ?? 0;

            return (
              <div
                key={q.id}
                className="rounded-2xl bg-navy-900/80 border border-slate-800 overflow-hidden shadow-md transition-all"
              >
                {/* Header row */}
                <button
                  type="button"
                  onClick={() => toggleExpand(q.id)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3 pr-4">
                    <span className="shrink-0 w-7 h-7 rounded-lg bg-indigo-600/15 text-indigo-400 font-bold text-xs flex items-center justify-center">
                      Q{q.order}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-0.5">
                        {q.topic}
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-slate-200 line-clamp-1">
                        {q.text}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {answer && <ScoreBadge score={score} size="sm" />}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && answer && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 space-y-4">
                    {/* Full question */}
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                        Full Question
                      </span>
                      <p className="text-sm text-slate-200 leading-relaxed font-medium">
                        {q.text}
                      </p>
                    </div>

                    {/* Candidate's answer */}
                    <div className="p-3.5 rounded-xl bg-navy-950 border border-slate-800">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                        Your Submitted Answer
                      </span>
                      <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {answer.userAnswer}
                      </p>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                        <span className="text-xs font-semibold text-emerald-400 block mb-1.5 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Strengths
                        </span>
                        <ul className="space-y-1 text-xs text-slate-300">
                          {answer.feedback.strengths?.map((s, i) => (
                            <li key={i}>• {s}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20">
                        <span className="text-xs font-semibold text-amber-400 block mb-1.5 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" /> Weaknesses
                        </span>
                        <ul className="space-y-1 text-xs text-slate-300">
                          {answer.feedback.weaknesses?.map((w, i) => (
                            <li key={i}>• {w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Ideal answer */}
                    {answer.feedback.idealAnswer && (
                      <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20">
                        <span className="text-xs font-semibold text-indigo-300 block mb-1.5">
                          Model Answer
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {answer.feedback.idealAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Navigation CTA */}
      <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>

        <Link
          href="/interview/new"
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all"
        >
          <span>Start Another Interview</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
