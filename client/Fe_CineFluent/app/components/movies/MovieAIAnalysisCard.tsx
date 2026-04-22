import { I_Video_AI_Analysis } from "@/app/lib/types/video";

export function MovieAIAnalysisCard({
  analysis,
}: {
  analysis: I_Video_AI_Analysis | null;
}) {
  const grammarDistribution = analysis?.grammar_distribution || [];

  if (!analysis) {
    return (
      <section className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5 text-slate-200">
        <h2 className="text-lg font-semibold text-white">AI Movie Analysis</h2>
        <p className="mt-2 text-sm text-slate-400">
          AI analysis chưa có dữ liệu lưu sẵn cho phim này. Hãy vào admin, tải subtitle tiếng Anh, sau đó bấm nút phân tích ngữ pháp AI để lưu kết quả vào database.
        </p>
      </section>
    );
  }

  if (analysis.status === "FAILED") {
    return (
      <section className="rounded-2xl border border-amber-700/60 bg-amber-950/30 p-5 text-slate-200">
        <h2 className="text-lg font-semibold text-white">AI Movie Analysis</h2>
        <p className="mt-2 text-sm text-amber-100">
          Backend đã nhận subtitle, nhưng AI chưa phân tích thành công cho phim này.
        </p>
        <p className="mt-2 text-sm text-amber-200/80">
          {analysis.error_message || "Không có thông tin lỗi chi tiết."}
        </p>
      </section>
    );
  }

  if (analysis.status === "PROCESSING") {
    return (
      <section className="rounded-2xl border border-sky-700/50 bg-sky-950/20 p-5 text-slate-200">
        <h2 className="text-lg font-semibold text-white">AI Movie Analysis</h2>
        <p className="mt-2 text-sm text-sky-100">
          Hệ thống đang phân tích ngữ pháp và cập nhật metadata VTT cho phim này.
        </p>
        <p className="mt-2 text-sm text-sky-200/80">
          Trong lúc này quiz học tập sẽ tạm ngưng để tránh dùng dữ liệu cũ.
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
            Phân tích hiện tại tập trung vào grammar tags được AI nhận diện từ toàn bộ subtitle tiếng Anh của phim.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Segments
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {analysis.segment_count}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Tổng số subtitle AI đã phân tích
          </p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Grammar Patterns
          </p>
          <div className="mt-3 space-y-3">
            {grammarDistribution.length ? (
              grammarDistribution.slice(0, 5).map((item) => (
                <div key={item.tag_id}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-200">{item.label}</span>
                    <span className="text-slate-400">{Math.round(item.ratio * 100)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                    <div
                      className="h-full rounded-full bg-sky-400"
                      style={{ width: `${Math.max(item.ratio * 100, 4)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <span className="text-sm text-slate-400">Chưa có dữ liệu</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
