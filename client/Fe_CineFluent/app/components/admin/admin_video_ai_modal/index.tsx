"use client";

import { I_Video, I_Video_AI_Segment } from "@/app/lib/types/video";
import { Brain, X } from "lucide-react";

type Props = {
  video: I_Video;
  setClose: () => void;
};

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remain = safeSeconds % 60;
  return `${minutes}:${remain.toString().padStart(2, "0")}`;
}

function HardSegmentCard({ segment }: { segment: I_Video_AI_Segment }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>
          {formatTime(segment.start_time)} - {formatTime(segment.end_time)}
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-medium text-slate-700">
          {segment.pred_cefr}
        </span>
        <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 font-medium text-rose-700">
          {segment.pred_label}
        </span>
        <span>Score {segment.pred_score.toFixed(2)}</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-800">
        {segment.subtitle_text_clean}
      </p>
    </div>
  );
}

export default function AdminVideoAiModal({ video, setClose }: Props) {
  const analysis = video.ai_analysis;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6 flex items-center justify-between px-2">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Brain className="text-violet-600" />
            Phan tich AI:
            <span className="max-w-[420px] truncate text-violet-600">
              {video.title}
            </span>
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Trang nay dung de xem chi tiet ket qua model phan tich do kho phim.
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
              Chua co du lieu AI cho phim nay.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Hay vao modal subtitle va bam nut <strong>Phan tich do kho phim</strong> de
              luu ket qua vao database.
            </p>
          </div>
        ) : analysis.status === "FAILED" ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 shadow-sm">
            <p className="text-base font-semibold text-rose-700">
              AI chua phan tich thanh cong cho phim nay.
            </p>
            <p className="mt-2 text-sm leading-6 text-rose-700/80">
              {analysis.error_message || "Khong co thong tin loi chi tiet."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Trinh do phim
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="rounded-2xl bg-violet-600 px-4 py-2 text-xl font-bold text-white shadow-sm">
                    {analysis.movie_cefr_range}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">
                    {analysis.movie_level}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Score
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-800">
                      {analysis.movie_score.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Subtitle
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-800">
                      {analysis.segment_count}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Ngu phap noi bat
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Day la cac mau cau va cau truc xuat hien nhieu trong subtitle ma AI da phan tich.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {analysis.dominant_grammar_tags?.length ? (
                    analysis.dominant_grammar_tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">
                      Chua co mau ngu phap noi bat.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Cac doan kho tieu bieu
              </p>
              <div className="mt-4 space-y-3">
                {analysis.top_hard_segments?.length ? (
                  analysis.top_hard_segments
                    .slice(0, 5)
                    .map((segment) => (
                      <HardSegmentCard key={segment.scene_id} segment={segment} />
                    ))
                ) : (
                  <p className="text-sm text-slate-400">
                    Chua co subtitle kho duoc luu.
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
