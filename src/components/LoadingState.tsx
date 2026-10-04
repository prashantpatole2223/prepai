import { Loader2, Sparkles } from "lucide-react";

interface LoadingStateProps {
  title?: string;
  message?: string;
  className?: string;
}

export default function LoadingState({
  title = "Processing...",
  message = "Please wait while our AI analyzes your request.",
  className = "",
}: LoadingStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-navy-900/60 border border-slate-800/80 backdrop-blur-sm ${className}`}
    >
      <div className="relative mb-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
          <Sparkles className="w-7 h-7 animate-pulse text-indigo-400" />
        </div>
        <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-navy-950 border border-slate-700">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-white mb-1.5">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm">{message}</p>
    </div>
  );
}
