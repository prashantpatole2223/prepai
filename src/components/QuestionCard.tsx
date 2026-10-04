import { HelpCircle, Tag, Flame } from "lucide-react";

interface QuestionCardProps {
  order: number;
  totalQuestions: number;
  topic: string;
  text: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
}

export default function QuestionCard({
  order,
  totalQuestions,
  topic,
  text,
  difficulty,
}: QuestionCardProps) {
  const difficultyColors = {
    EASY: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    HARD: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  return (
    <div className="p-6 sm:p-7 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-xl backdrop-blur-sm">
      {/* Meta header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600/15 border border-indigo-500/25 text-indigo-400 text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            Question {order} of {totalQuestions}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
            <Tag className="w-3 h-3 text-indigo-400" />
            {topic}
          </span>
        </div>

        {difficulty && (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium uppercase tracking-wider ${
              difficultyColors[difficulty] || ""
            }`}
          >
            <Flame className="w-3 h-3" />
            {difficulty}
          </span>
        )}
      </div>

      {/* Question Text */}
      <p className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
        {text}
      </p>
    </div>
  );
}
