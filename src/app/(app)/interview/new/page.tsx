"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, AlertCircle, Briefcase, Zap, HelpCircle } from "lucide-react";
import SkillInput from "@/components/SkillInput";
import LoadingState from "@/components/LoadingState";

type Difficulty = "EASY" | "MEDIUM" | "HARD";
type QuestionCount = 3 | 5 | 8;

export default function NewInterviewPage() {
  const router = useRouter();

  const [role, setRole] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [totalQuestions, setTotalQuestions] = useState<QuestionCount>(5);

  const [profileLoading, setProfileLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const profile = await res.json();
          if (profile.targetRole) {
            setRole(profile.targetRole);
          }
          if (Array.isArray(profile.skills) && profile.skills.length > 0) {
            // Take up to 8 skills for the interview
            setSkills(profile.skills.slice(0, 8));
          }
        }
      } catch {
        // Fallback silently if profile could not be loaded
      } finally {
        setProfileLoading(false);
      }
    }

    loadUserProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!role.trim()) {
      setError("Please specify a target role");
      return;
    }

    if (skills.length === 0) {
      setError("Please include at least 1 skill to be tested on");
      return;
    }

    if (skills.length > 8) {
      setError("Maximum 8 skills allowed for a single interview session");
      return;
    }

    setGenerating(true);

    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: role.trim(),
          skills,
          difficulty,
          totalQuestions,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate interview. Please try again.");
        setGenerating(false);
        return;
      }

      router.push(`/interview/${data.id}`);
    } catch {
      setError("Network error while creating interview. Please try again.");
      setGenerating(false);
    }
  };

  if (generating) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <LoadingState
          title="Generating your interview questions..."
          message={`Gemini AI is crafting ${totalQuestions} scenario and technical questions for a ${difficulty.toLowerCase()} ${role} interview.`}
          className="max-w-md w-full py-12"
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>New AI Simulation</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Configure Your Mock Interview
        </h1>
        <p className="text-sm text-slate-400 mt-1.5">
          Customize the role, target skills, and difficulty level. AI will generate dynamic, non-standard questions.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Configuration Form */}
      <form onSubmit={handleSubmit} className="bg-navy-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Role */}
        <div>
          <label
            htmlFor="role"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5"
          >
            <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
            <span>Target Role</span>
          </label>
          <input
            id="role"
            type="text"
            required
            disabled={profileLoading}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Senior Frontend Engineer, Full-Stack Developer, DevOps Specialist"
            className="w-full px-4 py-2.5 rounded-xl bg-navy-950 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-colors"
          />
        </div>

        {/* Skills */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Skills to Test (1 - 8)</span>
            </span>
            <span className="text-slate-400 font-normal lowercase">
              {skills.length}/8 selected
            </span>
          </label>
          <SkillInput
            skills={skills}
            onChange={setSkills}
            maxSkills={8}
            maxCharLength={40}
            disabled={profileLoading}
          />
        </div>

        {/* Difficulty & Question Count */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
          {/* Difficulty */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["EASY", "MEDIUM", "HARD"] as Difficulty[]).map((level) => {
                const isSelected = difficulty === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all ${
                      isSelected
                        ? level === "EASY"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500"
                          : level === "MEDIUM"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500"
                          : "bg-rose-500/20 text-rose-300 border-rose-500"
                        : "bg-navy-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Number of questions */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Questions Count</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([3, 5, 8] as QuestionCount[]).map((count) => {
                const isSelected = totalQuestions === count;
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setTotalQuestions(count)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? "bg-indigo-600/25 text-indigo-300 border-indigo-500"
                        : "bg-navy-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                    }`}
                  >
                    {count} Questions
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-800/80 flex justify-end">
          <button
            type="submit"
            disabled={profileLoading || generating || skills.length === 0 || !role.trim()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all shadow-lg shadow-indigo-600/25"
          >
            <span>Start Interview</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
