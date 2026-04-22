"use client";

import { I_Video_AI_Analysis } from "@/app/lib/types/video";

function getTone(level?: string, surface: "dark" | "light" = "dark") {
  const isLight = surface === "light";

  switch (level) {
    case "Beginner":
      return isLight
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
    case "Intermediate":
      return isLight
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-amber-400/30 bg-amber-500/15 text-amber-100";
    case "Advanced":
      return isLight
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-rose-400/30 bg-rose-500/15 text-rose-100";
    default:
      return isLight
        ? "border-slate-200 bg-slate-50 text-slate-600"
        : "border-slate-500/30 bg-slate-700/60 text-slate-200";
  }
}

function getDisplayLabel(analysis: I_Video_AI_Analysis) {
  if (analysis.movie_level === "Grammar Optimized") {
    return {
      primary: "Grammar AI",
      secondary: `${analysis.segment_count} segments`,
      tertiary: `${analysis.dominant_grammar_tags?.length || 0} tags`,
    };
  }

  return {
    primary: analysis.movie_level,
    secondary: analysis.movie_cefr_range,
    tertiary: `Score ${analysis.movie_score.toFixed(2)}`,
  };
}

export function MovieDifficultyBadge({
  analysis,
  compact = false,
  surface = "dark",
}: {
  analysis?: I_Video_AI_Analysis | null;
  compact?: boolean;
  surface?: "dark" | "light";
}) {
  if (!analysis) {
    return null;
  }

  if (analysis.status === "PROCESSING") {
    const processingTone =
      surface === "light"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : "border-sky-400/30 bg-sky-500/15 text-sky-100";

    if (compact) {
      return (
        <div
          className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${processingTone}`}
        >
          <span>AI đang phân tích</span>
          <span className="opacity-80">·</span>
          <span>Đang cập nhật metadata</span>
        </div>
      );
    }

    return (
      <div
        className={`inline-flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${processingTone}`}
      >
        <span>AI đang phân tích</span>
        <span className="opacity-80">Đang làm mới VTT</span>
      </div>
    );
  }

  if (analysis.status && analysis.status !== "READY") {
    return null;
  }

  const tone = getTone(analysis.movie_level, surface);
  const label = getDisplayLabel(analysis);

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone}`}
      >
        <span>{label.primary}</span>
        <span className="opacity-80">·</span>
        <span>{label.secondary}</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${tone}`}
    >
      <span>{label.primary}</span>
      <span className="opacity-80">{label.secondary}</span>
      <span className="opacity-80">{label.tertiary}</span>
    </div>
  );
}
