interface ScoreBadgeProps {
  score: number;
  maxScore?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export default function ScoreBadge({
  score,
  maxScore = 10,
  size = "md",
  showLabel = true,
}: ScoreBadgeProps) {
  const rounded = Number(score.toFixed(1));

  let colorClasses = {
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    label: "Excellent",
  };

  if (rounded < 5) {
    colorClasses = {
      bg: "bg-rose-500/15",
      border: "border-rose-500/30",
      text: "text-rose-400",
      label: "Needs Practice",
    };
  } else if (rounded < 8) {
    colorClasses = {
      bg: "bg-amber-500/15",
      border: "border-amber-500/30",
      text: "text-amber-400",
      label: "Good Attempt",
    };
  }

  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3.5 py-1.5 text-sm",
    lg: "px-5 py-2.5 text-lg font-bold",
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl border font-semibold ${colorClasses.bg} ${colorClasses.border} ${colorClasses.text} ${sizeClasses[size]}`}
    >
      <span>
        {rounded} <span className="opacity-70 text-[0.85em]">/ {maxScore}</span>
      </span>
      {showLabel && (
        <span className="opacity-90 font-medium text-[0.85em] border-l border-current/20 pl-2">
          {colorClasses.label}
        </span>
      )}
    </div>
  );
}
