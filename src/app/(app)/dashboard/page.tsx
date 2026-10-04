"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  PlusCircle,
  TrendingUp,
  Award,
  CheckCircle,
  ArrowRight,
  Play,
  FileText,
  Calendar,
  Sparkles,
  Loader2,
  Clock,
} from "lucide-react";
import ProgressChart, { ProgressChartItem } from "@/components/ProgressChart";
import ScoreBadge from "@/components/ScoreBadge";

interface InterviewItem {
  id: string;
  role: string;
  skills: string[];
  difficulty: "EASY" | "MEDIUM" | "HARD";
  status: "IN_PROGRESS" | "COMPLETED";
  overallScore: number | null;
  createdAt: string;
  totalQuestions: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const res = await fetch("/api/interviews");
        if (res.ok) {
          const data: InterviewItem[] = await res.json();
          setInterviews(data);
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          <p className="text-sm">Loading your dashboard metrics...</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const completed = interviews.filter((i) => i.status === "COMPLETED" && i.overallScore !== null);
  const totalInterviews = interviews.length;
  const completedCount = completed.length;

  const avgScore =
    completedCount > 0
      ? Number((completed.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) / completedCount).toFixed(1))
      : 0;

  const bestScore =
    completedCount > 0
      ? Math.max(...completed.map((i) => i.overallScore || 0))
      : 0;

  // Chart data: oldest first so chronological trend renders left-to-right
  const chartData: ProgressChartItem[] = completed
    .slice()
    .reverse()
    .map((item) => ({
      id: item.id,
      date: new Date(item.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      score: item.overallScore || 0,
      role: item.role,
    }));

  const recentThree = interviews.slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-navy-900 via-indigo-950/40 to-navy-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Interview Readiness Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back, {session?.user?.name || "Candidate"}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Sharpen your technical articulation, conquer scenario questions, and benchmark your progress.
          </p>
        </div>

        <Link
          href="/interview/new"
          className="relative z-10 flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all self-start sm:self-auto shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Start New Interview</span>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Interviews */}
        <div className="p-5 rounded-2xl bg-navy-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Interviews Taken
            </span>
            <div className="p-2 rounded-xl bg-indigo-600/15 text-indigo-400 border border-indigo-500/25">
              <LayoutDashboard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{totalInterviews}</div>
          <p className="text-xs text-slate-500 mt-1">
            {completedCount} completed sessions
          </p>
        </div>

        {/* Average Score */}
        <div className="p-5 rounded-2xl bg-navy-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Average Score
            </span>
            <div className="p-2 rounded-xl bg-emerald-600/15 text-emerald-400 border border-emerald-500/25">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {completedCount > 0 ? avgScore : "—"}{" "}
            {completedCount > 0 && <span className="text-sm font-normal text-slate-500">/ 10</span>}
          </div>
          <p className="text-xs text-slate-500 mt-1">Across all completed interviews</p>
        </div>

        {/* Best Score */}
        <div className="p-5 rounded-2xl bg-navy-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Best Score
            </span>
            <div className="p-2 rounded-xl bg-amber-600/15 text-amber-400 border border-amber-500/25">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {completedCount > 0 ? bestScore.toFixed(1) : "—"}{" "}
            {completedCount > 0 && <span className="text-sm font-normal text-slate-500">/ 10</span>}
          </div>
          <p className="text-xs text-slate-500 mt-1">Peak performance recorded</p>
        </div>

        {/* Completion Rate */}
        <div className="p-5 rounded-2xl bg-navy-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Completion Rate
            </span>
            <div className="p-2 rounded-xl bg-violet-600/15 text-violet-400 border border-violet-500/25">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {totalInterviews > 0
              ? `${Math.round((completedCount / totalInterviews) * 100)}%`
              : "0%"}
          </div>
          <p className="text-xs text-slate-500 mt-1">Finished from start to report</p>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="p-6 sm:p-7 rounded-2xl bg-navy-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>Score Progression Over Time</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Chronological score trajectories across completed sessions
            </p>
          </div>
        </div>

        <ProgressChart data={chartData} />
      </div>

      {/* Recent Interviews */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Recent Interviews</h2>
            <p className="text-xs text-slate-400">Your latest practice sessions</p>
          </div>
          {interviews.length > 3 && (
            <Link
              href="/history"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>View all ({interviews.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {recentThree.length === 0 ? (
          <div className="p-8 rounded-2xl bg-navy-900/60 border border-slate-800 text-center space-y-3">
            <p className="text-sm text-slate-400">You haven&apos;t started any interviews yet.</p>
            <Link
              href="/interview/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Configure your first interview</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentThree.map((item) => {
              const isCompleted = item.status === "COMPLETED";
              const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-2xl bg-navy-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          isCompleted
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {isCompleted ? "COMPLETED" : "IN PROGRESS"}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {dateStr}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      {item.role}
                    </h3>
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {item.skills.slice(0, 4).map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {isCompleted && item.overallScore !== null ? (
                      <ScoreBadge score={item.overallScore} size="sm" />
                    ) : (
                      <span className="text-xs text-amber-400 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5" /> In Progress
                      </span>
                    )}

                    <Link
                      href={isCompleted ? `/interview/${item.id}/report` : `/interview/${item.id}`}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isCompleted
                          ? "bg-slate-800 text-indigo-300 hover:bg-slate-700 hover:text-white border border-slate-700"
                          : "bg-indigo-600 text-white hover:bg-indigo-500"
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <FileText className="w-3.5 h-3.5" />
                          <span>Report</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Resume</span>
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
    </div>
  );
}
