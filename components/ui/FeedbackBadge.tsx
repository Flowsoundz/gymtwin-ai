import type { DifficultyFeedback } from "@/types";

type FeedbackBadgeProps = {
  feedback: DifficultyFeedback;
};

export function FeedbackBadge({ feedback }: FeedbackBadgeProps) {
  const badgeClass =
    feedback === "perfect"
      ? "bg-purple-950/50 text-purple-400 border border-purple-900/30"
      : feedback === "too_easy"
        ? "bg-blue-950/50 text-blue-400 border border-blue-900/30"
        : feedback === "too_hard"
          ? "bg-red-950/50 text-red-400 border border-red-900/30"
          : "bg-slate-950 text-slate-500";

  const text = feedback ? feedback.replace("_", " ") : "None Stored";

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${badgeClass}`}>
      {text}
    </span>
  );
}
