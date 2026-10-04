"use client";

import { useEffect, useState } from "react";
import { User, Briefcase, Award, Sparkles, CheckCircle2, AlertCircle, Loader2, Save } from "lucide-react";
import SkillInput from "@/components/SkillInput";

type ExperienceLevel = "FRESHER" | "JUNIOR" | "MID" | "SENIOR";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  skills: string[];
  experienceLevel: ExperienceLevel;
  targetRole: string | null;
}

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string; description: string }[] = [
  { value: "FRESHER", label: "Fresher / Student", description: "0-1 years, foundational knowledge" },
  { value: "JUNIOR", label: "Junior Developer", description: "1-2 years experience" },
  { value: "MID", label: "Mid-Level Engineer", description: "3-5 years experience" },
  { value: "SENIOR", label: "Senior Engineer", description: "5+ years, architecture & leadership" },
];

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("FRESHER");
  const [targetRole, setTargetRole] = useState("");

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) {
          throw new Error("Failed to load profile");
        }
        const data: ProfileData = await res.json();
        setName(data.name || "");
        setEmail(data.email || "");
        setSkills(data.skills || []);
        setExperienceLevel(data.experienceLevel || "FRESHER");
        setTargetRole(data.targetRole || "");
      } catch {
        setMessage({ type: "error", text: "Unable to load profile data." });
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          skills,
          experienceLevel,
          targetRole: targetRole.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to save profile." });
      } else {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setName(data.name);
        setSkills(data.skills);
        setExperienceLevel(data.experienceLevel);
        setTargetRole(data.targetRole || "");
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred while saving profile." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          <p className="text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Your Profile</h1>
            <p className="text-sm text-slate-400">
              Manage your experience, target role, and skills to personalize interview questions
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
              : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Information Card */}
        <div className="bg-navy-900/80 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" />
            <span>Personal Information</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-4 py-2.5 rounded-xl bg-navy-950 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                disabled
                value={email}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-sm cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">Email address cannot be changed</p>
            </div>
          </div>
        </div>

        {/* Career & Skills Card */}
        <div className="bg-navy-900/80 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-6">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-400" />
            <span>Career & Interview Focus</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="targetRole"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2"
              >
                Target Role
              </label>
              <input
                id="targetRole"
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full px-4 py-2.5 rounded-xl bg-navy-950 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-colors"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Default role used when starting a new mock interview
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                className="w-full px-4 py-2.5 rounded-xl bg-navy-950 border border-slate-700/80 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-colors"
              >
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-navy-950 text-white">
                    {opt.label} ({opt.description})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
              <span>Your Skills & Technologies</span>
              <span className="text-indigo-400 font-normal lowercase flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> used to tailor AI questions
              </span>
            </label>
            <SkillInput
              skills={skills}
              onChange={setSkills}
              maxSkills={15}
              maxCharLength={40}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all shadow-lg shadow-indigo-600/25"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
