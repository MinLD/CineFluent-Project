"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, History, RotateCcw } from "lucide-react";

import {
  generateGrammarReviewAction,
  submitGrammarReviewAction,
} from "@/app/lib/actions/grammar_learning";
import { updateKtStateAction } from "@/app/lib/actions/kt_actions";
import {
  IGrammarReviewData,
  IGrammarReviewHistoryData,
  IGrammarReviewResultItem,
  IGrammarReviewSubmitResult,
} from "@/app/lib/types/grammar_learning";

export default function GrammarReviewClient({
  data,
  history,
  tagId,
}: {
  data: IGrammarReviewData | null;
  history: IGrammarReviewHistoryData | null;
  tagId: number;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<IGrammarReviewSubmitResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isGenerating, startGeneratingTransition] = useTransition();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const selectedCount = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers],
  );

  const resultMap = useMemo(() => {
    const map = new Map<number, IGrammarReviewResultItem>();
    (result?.result.items || []).forEach((item) => {
      map.set(item.question_index, item);
    });
    return map;
  }, [result]);

  const handleGenerateExercise = (refresh = false) => {
    startGeneratingTransition(async () => {
      const response = await generateGrammarReviewAction(tagId, refresh);
      if (response?.success && response.data?.exercise_id) {
        router.replace(`/studies/grammar/${tagId}/review?exerciseId=${response.data.exercise_id}`);
        router.refresh();
        return;
      }

      setSavedMessage("Không thể tạo bài ôn tập mới.");
    });
  };

  const handleSubmit = () => {
    if (!data || isPending || result) return;

    startTransition(async () => {
      const submitResponse = await submitGrammarReviewAction(data.exercise_id, answers);
      if (!submitResponse?.success || !submitResponse.data) {
        setSavedMessage("Không thể lưu kết quả bài ôn tập.");
        return;
      }

      const submittedResult = submitResponse.data as IGrammarReviewSubmitResult;
      setResult(submittedResult);

      const masterySignal = submittedResult.score >= 60 ? 1 : 0;
      const ktResponse = await updateKtStateAction(data.tag_id, masterySignal);

      if (ktResponse?.success) {
        setSavedMessage("Đã lưu bài làm và cập nhật tiến trình học tập.");
      } else {
        setSavedMessage("Đã lưu bài làm nhưng chưa cập nhật được tiến trình.");
      }
    });
  };

  const handleRedoCurrentExercise = () => {
    setAnswers({});
    setResult(null);
    setSavedMessage(null);
  };

  if (!data) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => handleGenerateExercise(false)}
          disabled={isGenerating}
          className="inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isGenerating ? "AI đang tạo bài..." : "AI tạo bài ôn tập"}
        </button>

        {savedMessage ? <p className="text-sm text-rose-600">{savedMessage}</p> : null}

        {history?.items.length ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
            <p className="text-sm font-semibold text-slate-900">Hoặc làm lại bài đã có:</p>
            <div className="mt-3 space-y-3">
              {history.items.map((item) => (
                <Link
                  key={item.attempt_id}
                  href={`/studies/grammar/${tagId}/review?exerciseId=${item.exercise_id}`}
                  className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300"
                >
                  {item.title || "Bộ câu ôn tập"} · {Math.round(item.score || 0)}%
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

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
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-600">
            Ôn tập ngữ pháp
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">
            {data.label_vi}
          </h1>
          <p className="mt-2 text-lg font-semibold text-slate-500">{data.label_en}</p>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">
            {data.instructions}
          </p>

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <div className="space-y-5">
                {data.questions.map((question, index) => {
                  const selectedAnswer = answers[String(index)];
                  const reviewItem = resultMap.get(index);
                  const isCorrect = reviewItem?.is_correct;

                  return (
                    <section
                      key={`${question.question}-${index}`}
                      className="rounded-2xl border border-slate-200 p-5"
                    >
                      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Câu {index + 1}
                      </p>
                      <p className="mt-3 text-lg font-bold text-slate-900">
                        {question.question}
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {question.options.map((option) => {
                          const isSelected = selectedAnswer === option;
                          const isCorrectOption = reviewItem?.correct_answer === option;

                          return (
                            <button
                              key={option}
                              type="button"
                              disabled={Boolean(result)}
                              onClick={() =>
                                setAnswers((current) => ({
                                  ...current,
                                  [String(index)]: option,
                                }))
                              }
                              className={[
                                "rounded-2xl border px-4 py-3 text-left text-sm font-medium transition",
                                isSelected
                                  ? "border-sky-500 bg-sky-50 text-sky-800"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                                result && isCorrectOption
                                  ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                                  : "",
                              ].join(" ")}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>

                      {reviewItem ? (
                        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4">
                          <p
                            className={[
                              "text-sm font-semibold",
                              isCorrect ? "text-emerald-700" : "text-rose-700",
                            ].join(" ")}
                          >
                            {isCorrect
                              ? "Bạn trả lời đúng."
                              : reviewItem.selected_answer
                                ? `Bạn chọn "${reviewItem.selected_answer}" nên bị sai.`
                                : "Bạn chưa chọn đáp án."}
                          </p>

                          {reviewItem.selected_feedback_vi ? (
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                              Lý do lựa chọn của bạn: {reviewItem.selected_feedback_vi}
                            </p>
                          ) : null}

                          <p className="mt-2 text-sm leading-relaxed text-slate-700">
                            Đáp án đúng là <span className="font-semibold">{reviewItem.correct_answer}</span>.
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-slate-600">
                            {reviewItem.correct_explanation_vi}
                          </p>
                          {reviewItem.correct_option_feedback_vi ? (
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                              Vì sao đáp án đó đúng: {reviewItem.correct_option_feedback_vi}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </section>
                  );
                })}
              </div>

              <div className="mt-8 rounded-2xl bg-slate-50 p-5">
                {result ? (
                  <>
                    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Kết quả
                    </p>
                    <p className="mt-2 text-3xl font-black text-slate-900">
                      {result.correct_answers}/{result.total_questions} câu đúng · {Math.round(result.score)}%
                    </p>
                    <p className="mt-3 text-sm text-slate-600">
                      {savedMessage || "Đã lưu bài làm vào hệ thống."}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-600">
                      Đã chọn {selectedCount}/{data.questions.length} câu. Khi nộp bài, hệ thống sẽ lưu kết quả
                      và giải thích chi tiết cho từng đáp án.
                    </p>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isPending}
                      className="mt-4 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {isPending ? "Đang nộp bài..." : "Nộp bài ôn tập"}
                    </button>
                  </>
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/studies/grammar/${data.tag_id}/lesson`}
                    className="inline-flex rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
                  >
                    Xem lại lý thuyết
                  </Link>
                  <button
                    type="button"
                    onClick={handleRedoCurrentExercise}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Làm lại bộ câu này
                  </button>
                  <Link
                    href="/studies/roadmap"
                    className="inline-flex rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
                  >
                    Về tiến trình học tập
                  </Link>
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-slate-700">
                  <History className="h-4 w-4" />
                  <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Lịch sử ôn tập
                  </h2>
                </div>

                <div className="mt-4 space-y-3">
                  {history?.items.length ? (
                    history.items.map((item) => (
                      <div
                        key={item.attempt_id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <p className="text-sm font-bold text-slate-900">
                          {item.title || "Bộ câu ôn tập"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.correct_answers ?? 0}/{item.total_questions} câu đúng · {Math.round(item.score || 0)}%
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.submitted_at
                            ? new Date(item.submitted_at).toLocaleString("vi-VN")
                            : "Chưa nộp"}
                        </p>
                        <Link
                          href={`/studies/grammar/${data.tag_id}/review?exerciseId=${item.exercise_id}`}
                          className="mt-3 inline-flex rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
                        >
                          Làm lại bộ này
                        </Link>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      Chưa có lần ôn tập nào được lưu.
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
