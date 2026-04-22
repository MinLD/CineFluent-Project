"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";

import { getGrammarTagLabel } from "@/app/lib/constants/grammar";
import { FeApiProxyUrl } from "@/app/lib/services/api_client";
import { I_Subtitle, I_Video, I_Video_AI_Analysis } from "@/app/lib/types/video";

type Props = {
  video: I_Video;
  setClose: () => void;
};

export default function AdminVideoAiModal({ video, setClose }: Props) {
  const [analysisState, setAnalysisState] = useState<I_Video_AI_Analysis | null>(
    video.ai_analysis ?? null,
  );
  const [subtitleVttUrl, setSubtitleVttUrl] = useState<string | null>(
    video.subtitle_vtt_url || null,
  );
  const [subtitles, setSubtitles] = useState<I_Subtitle[]>([]);
  const [isLoadingDistribution, setIsLoadingDistribution] = useState(false);
  const [isPollingStatus, setIsPollingStatus] = useState(false);

  useEffect(() => {
    setAnalysisState(video.ai_analysis ?? null);
    setSubtitleVttUrl(video.subtitle_vtt_url || null);
  }, [video.id, video.ai_analysis, video.subtitle_vtt_url]);

  useEffect(() => {
    if (analysisState?.status !== "PROCESSING") {
      return;
    }

    let isMounted = true;

    const fetchLatestAnalysis = async () => {
      setIsPollingStatus(true);

      try {
        const response = await fetch(`${FeApiProxyUrl}/videos/${video.id}`);
        if (!response.ok) {
          throw new Error("Không thể tải trạng thái AI mới nhất");
        }

        const payload = await response.json();
        if (!isMounted) {
          return;
        }

        const nextVideo = payload?.data as I_Video | undefined;
        setAnalysisState(nextVideo?.ai_analysis ?? null);
        setSubtitleVttUrl(nextVideo?.subtitle_vtt_url || null);
      } catch (error) {
        console.error("Failed to poll AI analysis status:", error);
      } finally {
        if (isMounted) {
          setIsPollingStatus(false);
        }
      }
    };

    fetchLatestAnalysis();
    const intervalId = window.setInterval(fetchLatestAnalysis, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [analysisState?.status, video.id]);

  useEffect(() => {
    if (!subtitleVttUrl || !analysisState || analysisState.status !== "READY") {
      setSubtitles([]);
      return;
    }

    let isMounted = true;
    const worker = new Worker(new URL("@/app/utils/vtt.worker.ts", import.meta.url));

    const fetchDistribution = async () => {
      setIsLoadingDistribution(true);

      try {
        const response = await fetch(`${FeApiProxyUrl}${subtitleVttUrl}`);
        if (!response.ok) {
          throw new Error("Không thể tải VTT metadata");
        }

        const vttText = await response.text();

        worker.onmessage = (event) => {
          if (!isMounted) {
            worker.terminate();
            return;
          }

          if (event.data.success) {
            setSubtitles(event.data.subtitles || []);
          } else {
            console.error("Grammar distribution worker error:", event.data.error);
            setSubtitles([]);
          }

          setIsLoadingDistribution(false);
          worker.terminate();
        };

        worker.postMessage({ vttText });
      } catch (error) {
        console.error("Failed to load grammar distribution:", error);
        if (isMounted) {
          setSubtitles([]);
          setIsLoadingDistribution(false);
        }
        worker.terminate();
      }
    };

    fetchDistribution();

    return () => {
      isMounted = false;
      worker.terminate();
    };
  }, [analysisState?.status, subtitleVttUrl]);

  const grammarDistribution = useMemo(() => {
    const counts = new Map<number, number>();

    for (const subtitle of subtitles) {
      if (subtitle.grammar_tag_id === undefined || subtitle.grammar_tag_id === null) {
        continue;
      }

      counts.set(
        subtitle.grammar_tag_id,
        (counts.get(subtitle.grammar_tag_id) || 0) + 1,
      );
    }

    const total = Array.from(counts.values()).reduce((sum, count) => sum + count, 0);

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tagId, count]) => ({
        tagId,
        label: getGrammarTagLabel(tagId),
        count,
        ratio: total > 0 ? count / total : 0,
      }));
  }, [subtitles]);

  const analysis = analysisState;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6 flex items-center justify-between px-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Phân tích AI:{" "}
            <span className="max-w-[420px] truncate text-slate-900">{video.title}</span>
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Trang này tập trung vào kết quả grammar-only, cloze metadata và phân bố
            các thì trong subtitle.
          </p>
        </div>

        <button
          onClick={setClose}
          className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={28} />
        </button>
      </div>

      <div className="custom-scrollbar max-h-[72vh] overflow-y-auto pr-2">
        {!analysis ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-base font-semibold text-slate-800">
              Chưa có dữ liệu AI cho phim này.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Hãy vào modal subtitle và bấm <strong>Phân tích ngữ pháp AI</strong> để
              lưu kết quả vào database.
            </p>
          </div>
        ) : analysis.status === "FAILED" ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 shadow-sm">
            <p className="text-base font-semibold text-rose-700">
              AI chưa phân tích thành công cho phim này.
            </p>
            <p className="mt-2 text-sm leading-6 text-rose-700/80">
              {analysis.error_message || "Không có thông tin lỗi chi tiết."}
            </p>
          </div>
        ) : analysis.status === "PROCESSING" ? (
          <div className="space-y-6">
            <div className="rounded-3xl border border-sky-200 bg-sky-50 p-8 shadow-sm">
              <div className="flex items-center gap-3 text-sky-700">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p className="text-base font-semibold">AI đang phân tích và cập nhật VTT</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-sky-800/80">
                Trong lúc này modal sẽ ẩn kết quả cũ để tránh hiển thị stale data.
                Hệ thống tự kiểm tra lại trạng thái mỗi 5 giây.
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-white/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Trạng thái
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-800">PROCESSING</p>
                </div>
                <div className="rounded-2xl bg-white/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Chế độ
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-800">
                    {analysis.movie_level || "Grammar Optimized"}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Đồng bộ
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-800">
                    {isPollingStatus ? "Đang kiểm tra..." : "Chờ vòng quét tiếp theo"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="mb-2 h-4 w-40 rounded bg-slate-100" />
                    <div className="h-2.5 rounded-full bg-slate-100" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Trạng thái AI
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="rounded-2xl bg-slate-900 px-4 py-2 text-xl font-bold text-white shadow-sm">
                    READY
                  </span>
                  <span className="text-sm font-semibold text-slate-500">
                    {analysis.movie_level}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Segments
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-800">
                      {analysis.segment_count}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Grammar Tags
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-800">
                      {grammarDistribution.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Ngữ pháp nổi bật
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Đây là các grammar tags xuất hiện nhiều nhất trong subtitle mà AI đã
                  phân loại.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {analysis.dominant_grammar_tags?.length ? (
                    analysis.dominant_grammar_tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">
                      Chưa có mẫu ngữ pháp nổi bật.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Grammar Distribution
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Biểu đồ này đọc trực tiếp từ VTT metadata đã inject nên sẽ đồng bộ với
                  luồng player và DKT trigger.
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {isLoadingDistribution ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang đọc VTT metadata để tính phân bố ngữ pháp...
                  </div>
                ) : grammarDistribution.length ? (
                  grammarDistribution.map((item) => (
                    <div key={item.tagId}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-slate-700">{item.label}</span>
                        <span className="text-slate-500">
                          {item.count} câu - {Math.round(item.ratio * 100)}%
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-900"
                          style={{ width: `${Math.max(item.ratio * 100, 4)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">
                    Chưa đọc được grammar metadata từ subtitle VTT.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
