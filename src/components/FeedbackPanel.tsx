import { CheckCircle2, AlertTriangle, Lightbulb, BookOpen } from "lucide-react";
import ScoreBadge from "./ScoreBadge";

export interface FeedbackData {
  score: number;
  strengths: string[];
  weaknesses: string[];
  idealAnswer: string;
  tips: string[];
}

interface FeedbackPanelProps {
  feedback: FeedbackData;
  score: number;
}

export default function FeedbackPanel({ feedback, score }: FeedbackPanelProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Score Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-lg">
        <div>
          <h3 className="text-base font-bold text-white">AI Answer Evaluation</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluated on correctness (50%), depth (30%), and communication (20%)
          </p>
        </div>
        <ScoreBadge score={score} size="lg" />
      </div>

      {/* Grid: Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-3">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Key Strengths</span>
          </div>
          {feedback.strengths && feedback.strengths.length > 0 ? (
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              {feedback.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400/80 mt-1 shrink-0">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">No specific strengths noted for this attempt.</p>
          )}
        </div>

        {/* Weaknesses / Missing Points */}
        <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-3">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Areas to Improve</span>
          </div>
          {feedback.weaknesses && feedback.weaknesses.length > 0 ? (
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              {feedback.weaknesses.map((weak, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400/80 mt-1 shrink-0">•</span>
                  <span>{weak}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">No major omissions detected.</p>
          )}
        </div>
      </div>

      {/* Actionable Tips */}
      {feedback.tips && feedback.tips.length > 0 && (
        <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm mb-3">
            <Lightbulb className="w-4 h-4 shrink-0" />
            <span>Actionable Tips for Real Interviews</span>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
            {feedback.tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold shrink-0">{idx + 1}.</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Model / Ideal Answer */}
      {feedback.idealAnswer && (
        <div className="p-5 rounded-2xl bg-navy-900/90 border border-slate-800">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm mb-2.5">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Concise Model Answer</span>
          </div>
          <div className="p-4 rounded-xl bg-navy-950 border border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            {feedback.idealAnswer}
          </div>
        </div>
      )}
    </div>
  );
}
