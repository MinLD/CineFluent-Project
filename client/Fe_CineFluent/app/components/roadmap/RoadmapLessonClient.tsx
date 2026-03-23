"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";

import { generateDailyTaskAction } from "@/app/lib/actions/roadmap";
import {
  DailyTaskRecord,
  RoadmapDayPlan,
  StudyRoadmapRecord,
} from "@/app/lib/types/roadmap";

function getDayTypeStyles(type: string) {
  switch (type) {
    case "assessment":
      return "border-amber-500/20 bg-amber-500/10 text-amber-200";
    case "review":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
    case "homework":
      return "border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-200";
    case "practice":
      return "border-sky-500/20 bg-sky-500/10 text-sky-200";
    default:
      return "border-white/10 bg-white/5 text-slate-200";
  }
}

function buildEmptyAnswers(length: number) {
  return Array.from({ length }, () => "");
}

export default function RoadmapLessonClient({
  roadmap,
  dayPlan,
  initialTask,
}: {
  roadmap: StudyRoadmapRecord;
  dayPlan: RoadmapDayPlan;
  initialTask: DailyTaskRecord | null;
}) {
  const [task, setTask] = useState<DailyTaskRecord | null>(initialTask);
  const [isLoading, setIsLoading] = useState(!initialTask);
  const [error, setError] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(
    buildEmptyAnswers(initialTask?.task_detail_json.practice.length ?? 0),
  );
  const [showResults, setShowResults] = useState(false);

  const theoryParagraphs = useMemo(() => {
    const theory = task?.task_detail_json.theory?.trim();
    if (!theory) {
      return [];
    }

    return theory
      .split(/\n{2,}/)
      .map((item) => item.trim())
      .filter(Boolean);
  }, [task]);

  const vocabularyItems = task?.task_detail_json.vocabulary ?? [];
  const practiceQuestions = task?.task_detail_json.practice ?? [];
  const allQuestionsAnswered =
    practiceQuestions.length > 0 &&
    selectedAnswers.length === practiceQuestions.length &&
    selectedAnswers.every((answer) => Boolean(answer));

  const practiceScore = useMemo(() => {
    if (!practiceQuestions.length) {
      return 0;
    }

    return practiceQuestions.reduce((score, question, index) => {
      return score + (selectedAnswers[index] === question.answer ? 1 : 0);
    }, 0);
  }, [practiceQuestions, selectedAnswers]);

  const generateLesson = async () => {
    setIsLoading(true);
    setError("");

    const result = await generateDailyTaskAction(roadmap.id, dayPlan.day, dayPlan);

    setIsLoading(false);

    if (!result.success || !result.data) {
      const message = result.error || "Không thể tạo bài học cho ngày này.";
      setError(message);
      toast.error(message);
      return;
    }

    setTask(result.data);
    setSelectedAnswers(buildEmptyAnswers(result.data.task_detail_json.practice.length));
    setShowResults(false);
  };

  useEffect(() => {
    if (!initialTask) {
      void generateLesson();
    }
    // We only want to auto-generate once when the page opens without a lesson.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!task) {
      setSelectedAnswers([]);
      setShowResults(false);
      return;
    }

    setSelectedAnswers((prev) =>
      prev.length === task.task_detail_json.practice.length
        ? prev
        : buildEmptyAnswers(task.task_detail_json.practice.length),
    );
    setShowResults(false);
  }, [task]);

  return (
    <div className="min-h-screen bg-[#020617] px-4 pb-16 pt-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/studies/roadmap"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại roadmap
          </Link>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            Roadmap #{roadmap.id}
          </div>
        </div>

        <section className="rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.2),transparent_35%),rgba(15,23,42,0.92)] p-8">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-200">
                <BookOpenCheck className="h-4 w-4" />
                Ngày {dayPlan.day}
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white">
                {dayPlan.title}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
                Đây là trang học riêng cho từng ngày trong lộ trình. Bạn có thể
                tập trung học lý thuyết, từ vựng, bài tập và hành động trong ngày
                mà không bị ngợp bởi toàn bộ roadmap.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">Mục tiêu band</p>
                <p className="mt-2 text-2xl font-black text-white">
                  {roadmap.current_score.toFixed(1)} → {roadmap.target_score.toFixed(1)}
                </p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">Thời lượng roadmap</p>
                <p className="mt-2 text-2xl font-black text-white">
                  {roadmap.duration_days} ngày
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300">
                Thông tin ngày học
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${getDayTypeStyles(
                    dayPlan.type,
                  )}`}
                >
                  {dayPlan.type}
                </span>
                {task && (
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                    Đã có lesson
                  </span>
                )}
              </div>
              <div className="mt-5 space-y-4 text-sm leading-7 text-slate-300">
                <p>
                  <strong className="text-white">Grammar:</strong>{" "}
                  {dayPlan.grammar_focus || "Tổng hợp"}
                </p>
                <p>
                  <strong className="text-white">Vocabulary:</strong>{" "}
                  {dayPlan.vocabulary_focus || "Theo ngữ cảnh phim"}
                </p>
                <p>
                  <strong className="text-white">Task:</strong>{" "}
                  {dayPlan.exercise_hint || "Ôn tập ngắn"}
                </p>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Làm mới lesson</p>
                  <p className="mt-1 text-sm leading-7 text-slate-400">
                    Nếu bạn muốn AI soạn lại phần lý thuyết, từ vựng và bài tập,
                    hãy tạo lại lesson cho ngày học này.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void generateLesson()}
                disabled={isLoading}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {task ? "Tạo lại lesson" : "Tạo lesson"}
              </button>
            </div>
          </aside>

          <main className="space-y-6">
            {isLoading ? (
              <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-sky-300" />
                <p className="mt-4 text-lg font-semibold text-white">
                  AI đang soạn bài học cho ngày {dayPlan.day}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Hệ thống đang tạo lý thuyết, từ vựng, bài tập và hành động thực
                  hành cho bạn.
                </p>
              </div>
            ) : error ? (
              <div className="rounded-[32px] border border-rose-500/20 bg-rose-500/10 p-8 text-center">
                <p className="text-lg font-semibold text-rose-100">
                  Không thể tải bài học
                </p>
                <p className="mt-2 text-sm text-rose-200/80">{error}</p>
                <button
                  type="button"
                  onClick={() => void generateLesson()}
                  className="mt-5 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950"
                >
                  Thử lại
                </button>
              </div>
            ) : !task ? (
              <div className="rounded-[32px] border border-dashed border-white/15 bg-white/5 p-8 text-center backdrop-blur-xl">
                <p className="text-lg font-semibold text-white">
                  Chưa có lesson cho ngày này
                </p>
              </div>
            ) : (
              <>
                <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-300">
                      <BookOpenCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">Theory</h2>
                      <p className="text-sm text-slate-400">
                        Kiến thức cốt lõi cho ngày học này
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    {theoryParagraphs.length ? (
                      theoryParagraphs.map((paragraph, index) => (
                        <div
                          key={`theory-${index}`}
                          className="rounded-3xl border border-white/10 bg-black/10 p-5"
                        >
                          <p className="whitespace-pre-line text-sm leading-8 text-slate-200">
                            {paragraph}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-3xl border border-dashed border-white/10 bg-black/10 p-5 text-sm text-slate-400">
                        Chưa có phần lý thuyết cho ngày học này.
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-fuchsia-300">
                      <Target className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">Vocabulary</h2>
                      <p className="text-sm text-slate-400">
                        Từ vựng trọng tâm kèm nghĩa và ví dụ
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {vocabularyItems.map((item, index) => (
                      <div
                        key={`${item.term}-${index}`}
                        className="rounded-3xl border border-white/10 bg-black/10 p-5"
                      >
                        <p className="text-lg font-bold text-white">{item.term}</p>
                        <div className="mt-3 space-y-3 text-sm leading-7">
                          <p className="text-slate-200">
                            <span className="font-semibold text-sky-300">Nghĩa:</span>{" "}
                            {item.meaning}
                          </p>
                          <p className="text-slate-300">
                            <span className="font-semibold text-fuchsia-300">
                              Ví dụ:
                            </span>{" "}
                            {item.example}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">Practice</h2>
                      <p className="text-sm text-slate-400">
                        Tự làm bài trước, hệ thống chỉ hiện đáp án sau khi bạn kiểm
                        tra
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-black/10 p-4">
                    <p className="text-sm leading-7 text-slate-300">
                      Hãy chọn đáp án cho từng câu rồi bấm kiểm tra. Đáp án đúng và
                      giải thích sẽ chỉ xuất hiện sau bước này.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setShowResults(true)}
                        disabled={!allQuestionsAnswered || showResults}
                        className="rounded-2xl bg-sky-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Kiểm tra bài làm
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAnswers(buildEmptyAnswers(practiceQuestions.length));
                          setShowResults(false);
                        }}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                      >
                        Làm lại
                      </button>
                    </div>
                  </div>

                  {showResults && (
                    <div className="mt-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                      <p className="text-sm font-semibold text-emerald-100">
                        Bạn đúng {practiceScore}/{practiceQuestions.length} câu.
                      </p>
                    </div>
                  )}

                  <div className="mt-5 space-y-4">
                    {practiceQuestions.map((question, index) => (
                      <div
                        key={`lesson-question-${index}`}
                        className="rounded-3xl border border-white/10 bg-black/10 p-5"
                      >
                        <p className="text-base font-bold text-white">
                          {index + 1}. {question.question}
                        </p>

                        <div className="mt-4 grid gap-3">
                          {question.options.map((option) => {
                            const isSelected = selectedAnswers[index] === option;
                            const isCorrect = option === question.answer;

                            return (
                              <button
                                type="button"
                                key={option}
                                onClick={() => {
                                  if (showResults) {
                                    return;
                                  }

                                  setSelectedAnswers((prev) => {
                                    const next = [...prev];
                                    next[index] = option;
                                    return next;
                                  });
                                }}
                                className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                                  showResults
                                    ? isCorrect
                                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-100"
                                      : isSelected
                                        ? "border-rose-500/25 bg-rose-500/10 text-rose-100"
                                        : "border-white/10 bg-black/10 text-slate-300"
                                    : isSelected
                                      ? "border-sky-500/25 bg-sky-500/10 text-sky-100"
                                      : "border-white/10 bg-black/10 text-slate-300 hover:bg-white/5"
                                }`}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>

                        {showResults && (
                          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-sm font-semibold text-emerald-300">
                              Đáp án đúng: {question.answer}
                            </p>
                            <p className="mt-2 text-sm leading-7 text-slate-300">
                              {question.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <h2 className="text-2xl font-black text-white">Action Item</h2>
                  <div className="mt-5 rounded-3xl border border-white/10 bg-black/10 p-5">
                    <p className="text-sm leading-8 text-slate-200">
                      {task.task_detail_json.action_item}
                    </p>
                  </div>
                </section>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
