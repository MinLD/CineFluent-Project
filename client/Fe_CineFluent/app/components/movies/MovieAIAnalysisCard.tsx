import { I_Video_AI_Analysis } from "@/app/lib/types/video";

const ratioItems = [
  { key: "easy", label: "Easy", color: "bg-emerald-500" },
  { key: "medium", label: "Medium", color: "bg-amber-500" },
  { key: "hard", label: "Hard", color: "bg-rose-500" },
] as const;

function formatPercent(value?: number) {
  return `${Math.round((value || 0) * 100)}%`;
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remain = safeSeconds % 60;
  return `${minutes}:${remain.toString().padStart(2, "0")}`;
}

export function MovieAIAnalysisCard({
  analysis,
}: {
  analysis: I_Video_AI_Analysis | null;
}) {
  if (!analysis) {
    return (
      <section className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5 text-slate-200">
        <h2 className="text-lg font-semibold text-white">AI Movie Analysis</h2>
        <p className="mt-2 text-sm text-slate-400">
          AI analysis chua co du lieu luu san cho phim nay. Hay vao admin, tai
          subtitle tieng Anh, sau do bam nut phan tich do kho phim de luu ket
          qua vao database.
        </p>
      </section>
    );
  }

  if (analysis.status === "FAILED") {
    return (
      <section className="rounded-2xl border border-amber-700/60 bg-amber-950/30 p-5 text-slate-200">
        <h2 className="text-lg font-semibold text-white">AI Movie Analysis</h2>
        <p className="mt-2 text-sm text-amber-100">
          Backend da nhan subtitle, nhung AI chua phan tich thanh cong cho phim
          nay.
        </p>
        <p className="mt-2 text-sm text-amber-200/80">
          {analysis.error_message || "Khong co thong tin loi chi tiet."}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5 text-slate-200">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">AI Movie Analysis</h2>
          <p className="mt-1 text-sm text-slate-400">
            Subtitle difficulty duoc tong hop tu toan bo loi thoai tieng Anh cua
            phim.
          </p>
        </div>

        <div className="rounded-xl border border-slate-600 bg-slate-900/60 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Movie Score
          </p>
          <p className="text-2xl font-bold text-white">
            {analysis.movie_score.toFixed(2)}
          </p>
          <p className="text-sm text-sky-300">
            {analysis.movie_level} · {analysis.movie_cefr_range}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Segments
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {analysis.segment_count}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Tong so subtitle AI da phan tich
          </p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Difficulty Mix
          </p>
          <div className="mt-3 space-y-3">
            {ratioItems.map((item) => (
              <div key={item.key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="text-slate-300">
                    {formatPercent(analysis.difficulty_ratios?.[item.key])}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-700">
                  <div
                    className={`h-2 rounded-full ${item.color}`}
                    style={{
                      width: formatPercent(analysis.difficulty_ratios?.[item.key]),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Grammar Patterns
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {analysis.dominant_grammar_tags?.length ? (
              analysis.dominant_grammar_tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-200"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-400">Chua co du lieu</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-slate-700 bg-slate-900/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Top Hard Segments</h3>
            <p className="mt-1 text-sm text-slate-400">
              Nhung subtitle kho nhat de nguoi hoc can nhac truoc khi xem.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {analysis.top_hard_segments?.length ? (
            analysis.top_hard_segments.slice(0, 5).map((segment) => (
              <div
                key={segment.scene_id}
                className="rounded-xl border border-slate-700 bg-slate-950/50 p-4"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span>{formatTime(segment.start_time)}</span>
                  <span>→</span>
                  <span>{formatTime(segment.end_time)}</span>
                  <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-rose-200">
                    {segment.pred_label.toUpperCase()}
                  </span>
                  <span className="rounded-full bg-slate-700 px-2 py-0.5 text-slate-200">
                    {segment.pred_cefr}
                  </span>
                  <span>Score {segment.pred_score.toFixed(2)}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-100">
                  {segment.subtitle_text_clean}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Grammar:{" "}
                  <span className="font-medium text-sky-300">
                    {segment.pred_grammar_tag}
                  </span>
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">
              Chua co segment kho nao duoc tra ve.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
