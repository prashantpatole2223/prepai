"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  History as HistoryIcon,
  Play,
  FileText,
  Calendar,
  Sparkles,
  ArrowRight,
  Flame,
  Loader2,
  AlertCircle,
  Clock,
  PlusCircle,
} from "lucide-react";
import ScoreBadge from "@/components/ScoreBadge";

interface InterviewListItem {
  id: string;
  role: string;
  skills: string[];
  difficulty: "EASY" | "MEDIUM" | "HARD";
  status: "IN_PROGRESS" | "COMPLETED";
  overallScore: number | null;
  createdAt: string;
  totalQuestions: number;
}

export default function HistoryPage() {
  const [interviews, setInterviews] = useState<InterviewListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/interviews");
        if (!res.ok) {
          throw new Error("Failed to load interview history");
        }
        const data: InterviewListItem[] = await res.json();
        setInterviews(data);
      } catch {
        setError("Unable to load interview history. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          <p className="text-sm">Loading interview history...</p>
        </div>
      </div>
    );
  }

  const difficultyColors = {
    EASY: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
    MEDIUM: "text-amber-400 border-amber-500/20 bg-amber-500/10",
    HARD: "text-rose-400 border-rose-500/20 bg-rose-500/10",
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <HistoryIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Interview History</h1>
              <p className="text-sm text-slate-400">
                Review your past mock interviews, scores, and detailed evaluation feedback
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/interview/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Interview</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {interviews.length === 0 ? (
        <div className="p-12 rounded-2xl bg-navy-900/60 border border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">No interviews taken yet</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Start your first AI-generated mock interview to test your technical skills and receive a comprehensive performance report.
          </p>
          <Link
            href="/interview/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
          >
            <span>Start Your First Interview</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.map((item) => {
            const isCompleted = item.status === "COMPLETED";
            const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            });

            return (
              <div
                key={item.id}
                className="p-5 sm:p-6 rounded-2xl bg-navy-900/80 border border-slate-800 hover:border-slate-700 shadow-lg transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left meta */}
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${
                        isCompleted
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {isCompleted ? "COMPLETED" : "IN PROGRESS"}
                    </span>

                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border uppercase flex items-center gap-1 ${
                        difficultyColors[item.difficulty]
                      }`}
                    >
                      <Flame className="w-3 h-3" />
                      {item.difficulty}
                    </span>

                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {dateStr}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {item.role}
                  </h3>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {item.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right Action & Score */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                  {isCompleted && item.overallScore !== null ? (
                    <ScoreBadge score={item.overallScore} size="md" />
                  ) : (
                    <span className="text-xs text-amber-400 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5" /> {item.totalQuestions} questions
                    </span>
                  )}

                  <Link
                    href={isCompleted ? `/interview/${item.id}/report` : `/interview/${item.id}`}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      isCompleted
                        ? "bg-slate-800 text-indigo-300 hover:bg-slate-700 hover:text-white border border-slate-700"
                        : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20"
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Report</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Resume Interview</span>
                      </>
                    )}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
