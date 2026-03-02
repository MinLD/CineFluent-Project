"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/lib/hooks/useAuth";
import {
  generateQuizAction,
  getExercisesHistoryAction,
  submitExerciseAction,
  resetExerciseAction,
} from "@/app/lib/actions/flashcards";
import {
  BookOpen,
  Sparkles,
  Loader2,
  BrainCircuit,
  History,
  CheckCircle2,
  RotateCcw,
  ClipboardList,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import Empty_State from "@/app/components/empty_state";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface FlashcardsClientProps {
  initialFlashcards: any[];
}

export default function FlashcardsClient({
  initialFlashcards,
}: FlashcardsClientProps) {
  const { token } = useAuth();
  const [flashcards] = useState<any[]>(initialFlashcards || []);
  const [activeTab, setActiveTab] = useState<"vocab" | "history" | "quiz">(
    "vocab",
  );

  // Generating state
  const [generating, setGenerating] = useState(false);

  // Quiz states
  const [quizData, setQuizData] = useState<any>(null); // current active quiz data
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [currentExerciseId, setCurrentExerciseId] = useState<number | null>(
    null,
  );
  const [isReview, setIsReview] = useState(false);

  // History states
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch history
  const fetchHistory = async () => {
    if (!token) return;
    setLoadingHistory(true);
    try {
      const formData = new FormData();
      formData.append("token", token);
      const res = await getExercisesHistoryAction(null, formData);
      if (res.success) {
        setHistory(res.data.exercises);
      }
    } catch (e) {
      console.error("Fetch history error", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab]);

  // Handle Generate Exercises
  const handleGenerateQuiz = async () => {
    if (flashcards.length === 0) {
      toast.error("Bạn chưa có từ vựng nào để tạo bài tập!");
      return;
    }

    setGenerating(true);
    setQuizData(null);
    setUserAnswers({});
    setCurrentExerciseId(null);
    setIsReview(false);

    try {
      const selectedCards = flashcards.slice(0, 5);
      const formData = new FormData();
      if (token) formData.append("token", token);
      formData.append("flashcards", JSON.stringify(selectedCards));

      const response = await generateQuizAction(null, formData);

      if (response.success) {
        setQuizData(response.data.quiz_data);
        setCurrentExerciseId(response.data.id);
        setActiveTab("quiz");
        toast.success("Tạo bài tập AI thành công!");
      } else {
        toast.error(response.error || "Lỗi tạo bài tập");
      }
    } catch (e) {
      toast.error("Không kết nối được server");
    } finally {
      setGenerating(false);
    }
  };

  // Handle Answer Change
  const handleAnswerChange = (questionId: string, value: string) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // Handle Submit Quiz
  const handleSubmitQuiz = async () => {
    if (!currentExerciseId || !token) return;

    setSubmitting(true);
    try {
      let correct = 0;
      let total = 0;

      // 1. Check Multiple Choice
      quizData.multiple_choice?.forEach((q: any, i: number) => {
        total++;
        if (userAnswers[`mc_${i}`] === q.answer) correct++;
      });

      // 2. Check Fill in blank
      quizData.fill_in_blank?.forEach((q: any, i: number) => {
        total++;
        if (
          userAnswers[`fib_${i}`]?.toLowerCase().trim() ===
          q.answer.toLowerCase().trim()
        )
          correct++;
      });

      // 3. Translation (Simplified grading: if not empty, count as point for demo, or just count total)
      quizData.translation?.forEach((q: any, i: number) => {
        total++;
        if (userAnswers[`trans_${i}`]?.trim().length > 5) correct++;
      });

      const score = total > 0 ? (correct / total) * 10 : 0;

      const formData = new FormData();
      formData.append("token", token);
      formData.append("exerciseId", currentExerciseId.toString());
      formData.append("score", score.toFixed(1));
      formData.append("userAnswers", JSON.stringify(userAnswers));

      const res = await submitExerciseAction(null, formData);
      if (res.success) {
        toast.success(
          `Nộp bài thành công! Điểm của bạn: ${score.toFixed(1)}/10`,
        );
        setActiveTab("history");
      } else {
        toast.error(res.error);
      }
    } catch (e) {
      toast.error("Lỗi khi nộp bài");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Reset Quiz
  const handleResetQuiz = async (id: number) => {
    if (!token) return;
    try {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("exerciseId", id.toString());
      const res = await resetExerciseAction(null, formData);
      if (res.success) {
        toast.success("Đã reset bài tập!");
        // If we redo the currently selected quiz
        if (currentExerciseId === id) {
          setUserAnswers({});
          setIsReview(false);
          toast.success("Đã xóa đáp án cũ, bạn có thể làm lại!");
        }
        fetchHistory();
      }
    } catch (e) {
      toast.error("Lỗi reset");
    }
  };

  const startQuizFromHistory = (exercise: any) => {
    setQuizData(exercise.quiz_data);
    setCurrentExerciseId(exercise.id);
    setUserAnswers(exercise.user_answers || {});
    setIsReview(exercise.status === "COMPLETED");
    setActiveTab("quiz");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="text-sky-500" />
            Kho Từ Vựng Của Tôi
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Xem lại các từ đã lưu và làm bài tập cùng AI để ghi nhớ sâu hơn.
          </p>
        </div>

        <button
          onClick={handleGenerateQuiz}
          disabled={generating || flashcards.length === 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${generating || flashcards.length === 0 ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white hover:shadow-sky-500/25 hover:-translate-y-1"}`}
        >
          {generating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
          Làm bài tập với AI
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-zinc-800 rounded-xl w-fit mb-8">
        <button
          onClick={() => setActiveTab("vocab")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "vocab" ? "bg-white dark:bg-zinc-700 shadow-sm text-sky-600 dark:text-sky-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          <ClipboardList className="w-4 h-4" />
          Từ vựng ({flashcards.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "history" ? "bg-white dark:bg-zinc-700 shadow-sm text-sky-600 dark:text-sky-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          <History className="w-4 h-4" />
          Lịch sử bài tập
        </button>
        {quizData && (
          <button
            onClick={() => setActiveTab("quiz")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "quiz" ? "bg-white dark:bg-zinc-700 shadow-sm text-sky-600 dark:text-sky-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
          >
            <Sparkles className="w-4 h-4" />
            Làm bài tập
          </button>
        )}
      </div>

      {activeTab === "vocab" && (
        <>
          {flashcards.length === 0 ? (
            <div className="w-full overflow-hidden border border-gray-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900">
              <table className="w-full">
                <tbody>
                  <Empty_State
                    colSpan={3}
                    title="từ vựng nào"
                    icon={BookOpen}
                  />
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {flashcards.map((card) => (
                <div
                  key={card.id}
                  className="p-5 border border-gray-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 hover:shadow-lg transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-xl text-sky-600 dark:text-sky-400">
                      {card.word}
                    </h3>
                    <span className="text-xs font-mono text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {card.pos || "N/A"}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {card.definition_vi}
                    </p>
                    {card.ipa && (
                      <p className="text-sm font-mono text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded w-fit">
                        {card.ipa}
                      </p>
                    )}
                    <div className="pt-2 border-t border-gray-50 dark:border-zinc-800/50">
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic leading-relaxed">
                        "{card.context_sentence}"
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "history" && (
        <div className="space-y-4">
          {loadingHistory ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
            </div>
          ) : history.length === 0 ? (
            <div className="border border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-gray-50/50 dark:bg-zinc-900/50 min-h-[300px]">
              <History className="w-12 h-12 text-gray-400 mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                Chưa có lịch sử làm bài
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                Tạo bài tập AI đầu tiên để rèn luyện trí nhớ và theo dõi tiến độ
                học tập của mình.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.status === "COMPLETED" ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-gray-100 dark:bg-zinc-800 text-gray-400"}`}
                    >
                      {item.status === "COMPLETED" ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <ClipboardList className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Bài tập #{item.id}</h4>
                      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(
                            new Date(item.created_at),
                            "dd/MM/yyyy HH:mm",
                            { locale: vi },
                          )}
                        </span>
                        <span>•</span>
                        <span>{item.total_questions} câu hỏi</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0">
                    {item.status === "COMPLETED" && (
                      <div className="text-center md:text-right px-4 border-r border-gray-100 dark:border-zinc-800">
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">
                          Điểm số
                        </p>
                        <p
                          className={`text-2xl font-black ${item.score >= 8 ? "text-green-500" : item.score >= 5 ? "text-amber-500" : "text-red-500"}`}
                        >
                          {item.score}/10
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 w-full md:w-auto">
                      <button
                        onClick={() => startQuizFromHistory(item)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-lg text-sm font-bold hover:bg-sky-200 dark:hover:bg-sky-900/50 transition-all"
                      >
                        {item.status === "COMPLETED" ? "Xem lại" : "Làm bài"}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleResetQuiz(item.id)}
                        className="p-2 border border-gray-200 dark:border-zinc-700 text-gray-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900/50 rounded-lg transition-all"
                        title="Làm lại từ đầu"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "quiz" && quizData && (
        <div className="animate-fade-in max-w-4xl mx-auto">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl space-y-10">
            {/* Header Quiz */}
            <div className="flex justify-between items-center pb-6 border-b border-gray-100 dark:border-zinc-800">
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">
                THỬ THÁCH AI
              </h2>
              <div
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest ${isReview ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"}`}
              >
                {isReview ? "Xem lại kết quả" : "Đang làm bài"}
              </div>
            </div>

            {/* 1. Multiple Choice */}
            {quizData.multiple_choice?.length > 0 && (
              <section>
                <h3 className="text-xl font-bold text-indigo-500 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                    1
                  </div>
                  Phần 1: Trắc nghiệm
                </h3>
                <div className="space-y-6">
                  {quizData.multiple_choice?.map((q: any, i: number) => {
                    const questionId = `mc_${i}`;
                    const userAnswer = userAnswers[questionId];
                    const isCorrect = userAnswer === q.answer;

                    return (
                      <div
                        key={i}
                        className={`p-5 rounded-2xl border transition-all ${isReview ? (isCorrect ? "bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800" : "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800") : "bg-gray-50 dark:bg-zinc-800/30 border-gray-100 dark:border-zinc-800"}`}
                      >
                        <div className="flex justify-between items-start gap-4 mb-4">
                          <p className="font-bold text-lg leading-relaxed">
                            {i + 1}. {q.question}
                          </p>
                          {isReview &&
                            (isCorrect ? (
                              <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                            ) : (
                              <div className="text-red-500 font-black shrink-0">
                                ✘
                              </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {q.options.map((opt: string, optIdx: number) => {
                            const isSelected = userAnswer === opt;
                            const isCorrectOpt = opt === q.answer;

                            let btnClass =
                              "border-gray-100 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-sky-300 dark:hover:border-sky-700";
                            if (isReview) {
                              if (isCorrectOpt)
                                btnClass =
                                  "border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 ring-2 ring-green-500/20";
                              else if (isSelected && !isCorrectOpt)
                                btnClass =
                                  "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 ring-2 ring-red-500/20";
                              else
                                btnClass =
                                  "opacity-60 border-gray-100 dark:border-zinc-800";
                            } else if (isSelected) {
                              btnClass =
                                "border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 shadow-md ring-4 ring-sky-500/10";
                            }

                            return (
                              <button
                                key={optIdx}
                                disabled={isReview}
                                onClick={() =>
                                  handleAnswerChange(questionId, opt)
                                }
                                className={`p-3 text-sm border-2 rounded-xl transition-all text-left font-medium ${btnClass}`}
                              >
                                <span
                                  className={`w-7 h-7 inline-flex items-center justify-center rounded-lg text-xs mr-3 font-bold uppercase ${isReview && isCorrectOpt ? "bg-green-500 text-white" : "bg-gray-100 dark:bg-zinc-800"}`}
                                >
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        {isReview && !isCorrect && (
                          <p className="mt-4 text-sm font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                            💡 Đáp án đúng:{" "}
                            <span className="underlineDecoration">
                              {q.answer}
                            </span>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 2. Fill in the Blank */}
            {quizData.fill_in_blank?.length > 0 && (
              <section>
                <h3 className="text-xl font-bold text-amber-500 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
                    2
                  </div>
                  Phần 2: Điền vào chỗ trống
                </h3>
                <div className="space-y-6">
                  {quizData.fill_in_blank?.map((q: any, i: number) => {
                    const questionId = `fib_${i}`;
                    const userAnswer = userAnswers[questionId] || "";
                    const isCorrect =
                      userAnswer.toLowerCase().trim() ===
                      q.answer.toLowerCase().trim();

                    return (
                      <div
                        key={i}
                        className={`p-5 rounded-2xl border transition-all ${isReview ? (isCorrect ? "bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800" : "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800") : "bg-gray-50 dark:bg-zinc-800/30 border-gray-100 dark:border-zinc-800"}`}
                      >
                        <div className="flex justify-between items-start gap-4 mb-3">
                          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium italic opacity-80">
                            💡 Dịch nghĩa: {q.sentence_vi}
                          </p>
                          {isReview &&
                            (isCorrect ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                            ) : (
                              <div className="text-red-500 font-black shrink-0">
                                ✘
                              </div>
                            ))}
                        </div>
                        <div className="flex flex-col gap-3">
                          <p className="font-bold text-lg">
                            {i + 1}. {q.sentence_en_hidden}
                          </p>
                          <input
                            type="text"
                            disabled={isReview}
                            placeholder="Nhập từ còn thiếu..."
                            value={userAnswer}
                            onChange={(e) =>
                              handleAnswerChange(questionId, e.target.value)
                            }
                            className={`w-full bg-white dark:bg-zinc-900 border-2 rounded-xl p-4 text-base outline-none transition-all font-mono ${isReview ? (isCorrect ? "border-green-500 text-green-700 dark:text-green-300" : "border-red-500 text-red-700 dark:text-red-300") : "border-gray-100 dark:border-zinc-800 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"}`}
                          />
                          {isReview && !isCorrect && (
                            <p className="mt-2 text-sm font-bold text-green-600 dark:text-green-400">
                              ✓ Đáp án đúng:{" "}
                              <span className="bg-green-100 dark:bg-green-900/40 px-2 py-1 rounded font-mono">
                                {q.answer}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 3. Translation */}
            {quizData.translation?.length > 0 && (
              <section>
                <h3 className="text-xl font-bold text-emerald-500 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                    3
                  </div>
                  Phần 3: Dịch câu mở rộng
                </h3>
                <div className="space-y-6">
                  {quizData.translation?.map((q: any, i: number) => {
                    const questionId = `trans_${i}`;
                    const userAnswer = userAnswers[questionId] || "";

                    return (
                      <div
                        key={i}
                        className={`p-5 rounded-2xl border transition-all ${isReview ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800" : "bg-gray-50 dark:bg-zinc-800/30 border-gray-100 dark:border-zinc-800"}`}
                      >
                        <p className="font-bold text-lg mb-4">
                          {i + 1}. {q.vietnamese}
                        </p>
                        <textarea
                          disabled={isReview}
                          placeholder="Viết câu dịch tiếng Anh tương ứng..."
                          value={userAnswer}
                          onChange={(e) =>
                            handleAnswerChange(questionId, e.target.value)
                          }
                          className={`w-full bg-white dark:bg-zinc-900 border-2 rounded-xl p-4 text-base outline-none resize-none h-28 transition-all leading-relaxed ${isReview ? "border-emerald-500 text-emerald-700 dark:text-emerald-300" : "border-gray-100 dark:border-zinc-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"}`}
                        />
                        {isReview && (
                          <div className="mt-4 p-4 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                            <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">
                              Gợi ý từ AI
                            </p>
                            <p className="font-medium text-emerald-800 dark:text-emerald-200">
                              {q.english}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <div className="pt-8 border-t border-gray-100 dark:border-zinc-800 flex gap-4">
              {isReview ? (
                <>
                  <button
                    onClick={() => setActiveTab("history")}
                    className="flex-1 py-5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-2xl text-xl font-black transition-all hover:bg-gray-200 dark:hover:bg-zinc-700 flex items-center justify-center gap-3"
                  >
                    QUAY LẠI LỊCH SỬ
                  </button>
                  <button
                    onClick={() => handleResetQuiz(currentExerciseId!)}
                    className="flex-1 py-5 border-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl text-xl font-black transition-all flex items-center justify-center gap-3"
                  >
                    <RotateCcw className="w-6 h-6" />
                    LÀM LẠI BÀI NÀY
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={submitting}
                  className="w-full py-5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-2xl text-xl font-black shadow-xl shadow-sky-500/20 hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {submitting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6" />
                  )}
                  NỘP BÀI VÀ CHẤM ĐIỂM
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
