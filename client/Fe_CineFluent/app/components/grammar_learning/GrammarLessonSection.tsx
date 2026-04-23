import Link from "next/link";
import { BookOpenCheck, ChevronLeft, Sparkles } from "lucide-react";

import { IGrammarLessonData } from "@/app/lib/types/grammar_learning";

export default function GrammarLessonSection({
  data,
}: {
  data: IGrammarLessonData;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/studies/roadmap"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại tiến trình học tập
        </Link>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-600">
                Học lý thuyết
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">
                {data.label_vi}
              </h1>
              <p className="mt-2 text-lg font-semibold text-slate-500">{data.label_en}</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
              <BookOpenCheck className="h-4 w-4" />
              Bài học AI theo từng node
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-6">
              <section className="rounded-2xl bg-slate-50 p-5">
                <h2 className="text-lg font-bold text-slate-900">{data.title}</h2>
                <p className="mt-3 leading-relaxed text-slate-600">{data.summary}</p>
              </section>

              <section className="rounded-2xl border border-slate-200 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Công thức
                </p>
                <p className="mt-3 text-lg font-bold text-slate-900">{data.formula}</p>
              </section>

              <section className="rounded-2xl border border-slate-200 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Cách dùng
                </p>
                <div className="mt-4 space-y-3">
                  {data.usage_notes.map((note, index) => (
                    <div key={`${note}-${index}`} className="rounded-2xl bg-slate-50 px-4 py-3 text-slate-700">
                      {note}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Ví dụ
                </p>
                <div className="mt-4 space-y-4">
                  {data.examples.map((example, index) => (
                    <div key={`${example.sentence_en}-${index}`} className="rounded-2xl bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">{example.sentence_en}</p>
                      <p className="mt-2 text-sm text-slate-500">{example.sentence_vi}</p>
                      <p className="mt-3 text-sm leading-relaxed text-slate-700">
                        {example.explanation_vi}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Lỗi thường gặp
                </p>
                <div className="mt-4 space-y-3">
                  {data.common_mistakes.map((mistake, index) => (
                    <div
                      key={`${mistake}-${index}`}
                      className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                    >
                      {mistake}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Từ vựng gợi ý
                </p>
                <div className="mt-4 space-y-3">
                  {data.vocabulary.map((item, index) => (
                    <div key={`${item.word}-${index}`} className="rounded-2xl bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">{item.word}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.meaning_vi}</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">
                        {item.usage_hint}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-sky-50 p-5">
                <div className="flex items-center gap-2 text-sky-700">
                  <Sparkles className="h-4 w-4" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                    Mẹo khi xem phim
                  </p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">{data.movie_tip}</p>
              </section>

              <Link
                href={`/studies/grammar/${data.tag_id}/review`}
                className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Chuyển sang ôn tập
              </Link>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
