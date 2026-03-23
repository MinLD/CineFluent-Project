"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  BookOpenCheck,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Loader2,
  Mic2,
  RotateCcw,
  Sparkles,
  Target,
  Volume2,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";

import {
  generateAssessmentAction,
  generateRoadmapAction,
  resetAssessmentAction,
  submitAssessmentAction,
} from "@/app/lib/actions/roadmap";
import {
  AssessmentQuizData,
  AssessmentRecord,
  AssessmentReviewItem,
  AssessmentUserAnswers,
  RoadmapDashboardData,
  RoadmapDayPlan,
  StudyRoadmapRecord,
} from "@/app/lib/types/roadmap";

type TabKey = "assessment" | "history" | "roadmap";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function createEmptyAnswers(quiz: AssessmentQuizData): AssessmentUserAnswers {
  return {
    listening: Array.from(
      { length: quiz.listening.questions.length },
      () => "",
    ),
    reading: Array.from({ length: quiz.reading.questions.length }, () => ""),
    writing: "",
    speaking: "",
  };
}

function createAnswersFromRecord(
  record: AssessmentRecord,
): AssessmentUserAnswers {
  const fallback = createEmptyAnswers(record.quiz_data);
  if (!record.user_answers) {
    return fallback;
  }

  return {
    listening:
      record.user_answers.listening?.length ===
      record.quiz_data.listening.questions.length
        ? [...record.user_answers.listening]
        : fallback.listening,
    reading:
      record.user_answers.reading?.length ===
      record.quiz_data.reading.questions.length
        ? [...record.user_answers.reading]
        : fallback.reading,
    writing: record.user_answers.writing || "",
    speaking: record.user_answers.speaking || "",
  };
}

function getCompactPrompt(text: string, maxLength: number) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }

  const firstSentence = normalized.split(/(?<=[.!?])\s+/)[0] || normalized;
  if (firstSentence.length <= maxLength) {
    return firstSentence;
  }

  return `${firstSentence.slice(0, maxLength - 3).trim()}...`;
}

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

function getAssessmentStatusStyles(status: AssessmentRecord["status"]) {
  return status === "COMPLETED"
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
    : "border-amber-500/20 bg-amber-500/10 text-amber-200";
}

function mergeAssessmentRecord(
  current: AssessmentRecord[],
  nextRecord: AssessmentRecord,
) {
  const filtered = current.filter((item) => item.id !== nextRecord.id);
  return [nextRecord, ...filtered];
}

function mergeRoadmapRecord(
  current: StudyRoadmapRecord[],
  nextRoadmap: StudyRoadmapRecord,
) {
  const filtered = current.filter((item) => item.id !== nextRoadmap.id);
  return [nextRoadmap, ...filtered];
}

function buildPendingAssessmentRecord(
  assessmentId: number,
  quizData: AssessmentQuizData,
  isFallback = false,
): AssessmentRecord {
  const now = new Date().toISOString();
  return {
    id: assessmentId,
    quiz_data: quizData,
    user_answers: null,
    overall_score: null,
    grammar_feedback: null,
    vocab_feedback: null,
    strengths: [],
    weaknesses: [],
    status: "PENDING",
    is_fallback: isFallback,
    created_at: now,
    updated_at: now,
    review: null,
  };
}

function OverviewStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Sparkles;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-300">
        <Icon className="h-6 w-6" />
      </div>
      <p className="mb-1 text-sm text-slate-400">{label}</p>
      <p className="text-2xl font-black tracking-tight text-white">{value}</p>
    </div>
  );
}

function ReviewQuestionCard({ item }: { item: AssessmentReviewItem }) {
  return (
    <div
      className={`rounded-3xl border p-5 ${
        item.is_correct
          ? "border-emerald-500/20 bg-emerald-500/5"
          : "border-rose-500/20 bg-rose-500/5"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-4">
        <p className="text-base font-bold leading-relaxed text-white">
          {item.index + 1}. {item.question}
        </p>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
            item.is_correct
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-rose-500/15 text-rose-300"
          }`}
        >
          {item.is_correct ? "Đúng" : "Sai"}
        </span>
      </div>
      <div className="grid gap-2">
        {item.options.map((option) => {
          const isChosen = item.user_answer === option;
          const isCorrect = item.correct_answer === option;
          return (
            <div
              key={option}
              className={`rounded-2xl border px-4 py-3 text-sm ${
                isCorrect
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  : isChosen
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                    : "border-white/10 bg-black/10 text-slate-300"
              }`}
            >
              {option}
            </div>
          );
        })}
      </div>
      {!item.is_correct && (
        <p className="mt-3 text-sm font-semibold text-emerald-300">
          Đáp án đúng: {item.correct_answer}
        </p>
      )}
    </div>
  );
}

function TabButton({
  active,
  icon: Icon,
  label,
  description,
  onClick,
}: {
  active: boolean;
  icon: typeof Sparkles;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[28px] border p-5 text-left transition-all ${
        active
          ? "border-sky-400/30 bg-sky-500/10 shadow-[0_18px_40px_-24px_rgba(14,165,233,0.85)]"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]"
      }`}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-black/20 text-sky-300">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-white">{label}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        {description}
      </p>
    </button>
  );
}

export default function RoadmapClient({
  initialData,
}: {
  initialData: RoadmapDashboardData;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("assessment");
  const [assessments, setAssessments] = useState<AssessmentRecord[]>(
    initialData.assessments || [],
  );
  const [roadmaps, setRoadmaps] = useState<StudyRoadmapRecord[]>(
    initialData.roadmaps || [],
  );
  const [currentAssessment, setCurrentAssessment] =
    useState<AssessmentRecord | null>(
      () =>
        initialData.assessments.find((item) => item.status === "PENDING") ||
        initialData.assessments[0] ||
        null,
    );
  const [answers, setAnswers] = useState<AssessmentUserAnswers>(() =>
    currentAssessment
      ? createAnswersFromRecord(currentAssessment)
      : ({
          listening: [],
          reading: [],
          writing: "",
          speaking: "",
        } as AssessmentUserAnswers),
  );
  const [isReviewMode, setIsReviewMode] = useState<boolean>(
    currentAssessment?.status === "COMPLETED",
  );
  const [generatingAssessment, setGeneratingAssessment] = useState(false);
  const [submittingAssessment, setSubmittingAssessment] = useState(false);
  const [resettingAssessment, setResettingAssessment] = useState(false);
  const [speakingScript, setSpeakingScript] =
    useState<SpeechSynthesisUtterance | null>(null);
  const [isSpeakingRecording, setIsSpeakingRecording] = useState(false);
  const [speakingAudioUrl, setSpeakingAudioUrl] = useState<string | null>(null);
  const [speakingRecordingError, setSpeakingRecordingError] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const speakingChunksRef = useRef<Blob[]>([]);
  const speakingStreamRef = useRef<MediaStream | null>(null);

  const [currentScore, setCurrentScore] = useState("");
  const [targetScore, setTargetScore] = useState("6.5");
  const [durationDays, setDurationDays] = useState<30 | 60 | 90>(30);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<number | null>(
    initialData.roadmaps[0]?.id || null,
  );
  const [selectedDay, setSelectedDay] = useState<RoadmapDayPlan | null>(null);

  const latestCompletedAssessment = useMemo(
    () => assessments.find((item) => item.status === "COMPLETED") || null,
    [assessments],
  );

  const selectedRoadmap = useMemo(
    () => roadmaps.find((item) => item.id === selectedRoadmapId) || null,
    [roadmaps, selectedRoadmapId],
  );

  const totalGeneratedLessons = useMemo(
    () =>
      roadmaps.reduce(
        (total, roadmap) => total + roadmap.generated_task_days.length,
        0,
      ),
    [roadmaps],
  );

  const selectedRoadmapProgress = useMemo(() => {
    if (!selectedRoadmap) {
      return 0;
    }

    const totalDays =
      selectedRoadmap.blueprint.days.length || selectedRoadmap.duration_days;
    if (!totalDays) {
      return 0;
    }

    return Math.round(
      (selectedRoadmap.generated_task_days.length / totalDays) * 100,
    );
  }, [selectedRoadmap]);

  const assessmentWordCount = useMemo(
    () => answers.writing.trim().split(/\s+/).filter(Boolean).length,
    [answers.writing],
  );

  const compactWritingPrompt = useMemo(
    () =>
      currentAssessment
        ? getCompactPrompt(currentAssessment.quiz_data.writing.topic, 110)
        : "",
    [currentAssessment],
  );

  const compactSpeakingPrompt = useMemo(
    () =>
      currentAssessment
        ? getCompactPrompt(currentAssessment.quiz_data.speaking.prompt, 88)
        : "",
    [currentAssessment],
  );

  useEffect(() => {
    if (!currentAssessment) {
      return;
    }

    setAnswers(createAnswersFromRecord(currentAssessment));
    setIsReviewMode(currentAssessment.status === "COMPLETED");
    setSpeakingRecordingError("");
  }, [currentAssessment]);

  useEffect(() => {
    if (answers.speaking.startsWith("data:audio")) {
      setSpeakingAudioUrl(answers.speaking);
      return;
    }

    setSpeakingAudioUrl(null);
  }, [answers.speaking]);

  useEffect(() => {
    if (latestCompletedAssessment?.overall_score && !currentScore) {
      setCurrentScore(String(latestCompletedAssessment.overall_score));
    }
  }, [latestCompletedAssessment, currentScore]);

  useEffect(() => {
    if (!roadmaps.length || selectedRoadmapId) {
      return;
    }

    setSelectedRoadmapId(roadmaps[0].id);
  }, [roadmaps, selectedRoadmapId]);

  useEffect(() => {
    if (!selectedRoadmap) {
      setSelectedDay(null);
      return;
    }

    const hasCurrentDay =
      selectedDay &&
      selectedRoadmap.blueprint.days.some(
        (item) => item.day === selectedDay.day,
      );

    if (!hasCurrentDay) {
      setSelectedDay(selectedRoadmap.blueprint.days[0] || null);
    }
  }, [selectedRoadmap, selectedDay]);

  useEffect(() => {
    return () => {
      if (speakingScript && typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      speakingStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [speakingScript]);

  const handlePlayListeningScript = () => {
    if (!currentAssessment) {
      return;
    }

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Trình duyệt hiện tại không hỗ trợ đọc audio script.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      currentAssessment.quiz_data.listening.audio_script,
    );
    utterance.lang = "en-US";
    utterance.rate = 0.92;
    utterance.onend = () => setSpeakingScript(null);
    utterance.onerror = () => setSpeakingScript(null);

    setSpeakingScript(utterance);
    window.speechSynthesis.speak(utterance);
  };

  const handleStartSpeakingRecording = async () => {
    if (currentAssessment?.status === "COMPLETED") {
      return;
    }

    if (
      typeof window === "undefined" ||
      !navigator.mediaDevices ||
      !window.MediaRecorder
    ) {
      toast.error("Trình duyệt hiện tại không hỗ trợ ghi âm.");
      return;
    }

    setSpeakingRecordingError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      speakingStreamRef.current = stream;

      const supportedTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
      ];
      const mimeType = supportedTypes.find((type) =>
        MediaRecorder.isTypeSupported(type),
      );

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      speakingChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          speakingChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioType = mediaRecorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(speakingChunksRef.current, { type: audioType });
        const reader = new FileReader();

        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          setAnswers((prev) => ({ ...prev, speaking: dataUrl }));
          setSpeakingAudioUrl(dataUrl);
        };
        reader.readAsDataURL(blob);

        speakingStreamRef.current?.getTracks().forEach((track) => track.stop());
        speakingStreamRef.current = null;
      };

      mediaRecorder.start();
      setIsSpeakingRecording(true);
      setAnswers((prev) => ({ ...prev, speaking: "" }));
    } catch (_error) {
      setSpeakingRecordingError("Không thể truy cập microphone.");
      toast.error("Không thể truy cập microphone.");
    }
  };

  const handleStopSpeakingRecording = () => {
    if (
      !mediaRecorderRef.current ||
      mediaRecorderRef.current.state === "inactive"
    ) {
      return;
    }

    mediaRecorderRef.current.stop();
    setIsSpeakingRecording(false);
  };

  const clearSpeakingResponse = () => {
    if (isSpeakingRecording) {
      handleStopSpeakingRecording();
    }

    setSpeakingAudioUrl(null);
    setSpeakingRecordingError("");
    setAnswers((prev) => ({ ...prev, speaking: "" }));
  };

  const handleGenerateAssessment = async () => {
    setGeneratingAssessment(true);
    const result = await generateAssessmentAction();
    setGeneratingAssessment(false);

    if (!result.success || !result.data) {
      toast.error(result.error || "Không thể tạo bài test AI");
      return;
    }

    const {
      assessment_id: assessmentId,
      is_fallback: isFallback,
      ...quizData
    } = result.data as AssessmentQuizData & {
      assessment_id: number;
      is_fallback?: boolean;
    };
    const nextRecord = buildPendingAssessmentRecord(
      assessmentId,
      quizData as AssessmentQuizData,
      Boolean(isFallback),
    );

    setAssessments((prev) => mergeAssessmentRecord(prev, nextRecord));
    setCurrentAssessment(nextRecord);
    setActiveTab("assessment");
    toast.success("Đã tạo bài test AI mới.");
  };

  const handleAssessmentAnswer = (
    section: "listening" | "reading",
    index: number,
    value: string,
  ) => {
    setAnswers((prev) => {
      const nextSection = [...prev[section]];
      nextSection[index] = value;
      return {
        ...prev,
        [section]: nextSection,
      };
    });
  };

  const handleSubmitAssessment = async () => {
    if (!currentAssessment) {
      return;
    }

    if (
      answers.listening.some((answer) => !answer) ||
      answers.reading.some((answer) => !answer) ||
      !answers.writing.trim() ||
      !answers.speaking.trim()
    ) {
      toast.error("Hãy hoàn thành đầy đủ 4 kỹ năng trước khi chấm điểm.");
      return;
    }

    setSubmittingAssessment(true);
    const result = await submitAssessmentAction(currentAssessment.id, answers);
    setSubmittingAssessment(false);

    if (!result.success || !result.data) {
      toast.error(result.error || "Không thể chấm điểm bài đánh giá");
      return;
    }

    setAssessments((prev) => mergeAssessmentRecord(prev, result.data));
    setCurrentAssessment(result.data);
    setIsReviewMode(true);
    setActiveTab("assessment");
    toast.success("Đã chấm điểm bài đánh giá thành công.");
  };

  const handleResetAssessment = async (assessmentId?: number) => {
    const targetId = assessmentId || currentAssessment?.id;
    if (!targetId) {
      return;
    }

    setResettingAssessment(true);
    const result = await resetAssessmentAction(targetId);
    setResettingAssessment(false);

    if (!result.success || !result.data) {
      toast.error(result.error || "Không thể reset bài đánh giá");
      return;
    }

    setAssessments((prev) => mergeAssessmentRecord(prev, result.data));
    setCurrentAssessment(result.data);
    setActiveTab("assessment");
    toast.success("Đã reset bài đánh giá.");
  };

  const handleSelectAssessment = (record: AssessmentRecord) => {
    setCurrentAssessment(record);
    setActiveTab("assessment");
  };

  const handleGenerateRoadmap = async () => {
    const current = Number(currentScore);
    const target = Number(targetScore);

    if (!currentScore || Number.isNaN(current) || Number.isNaN(target)) {
      toast.error("Vui lòng nhập đúng điểm hiện tại và mục tiêu.");
      return;
    }

    if (target <= current) {
      toast.error("Điểm mục tiêu phải lớn hơn điểm hiện tại.");
      return;
    }

    setIsGeneratingRoadmap(true);
    const result = await generateRoadmapAction({
      current_score: current,
      target_score: target,
      duration_days: durationDays,
    });
    setIsGeneratingRoadmap(false);

    if (!result.success || !result.data) {
      toast.error(result.error || "Không thể tạo lộ trình AI");
      return;
    }

    setRoadmaps((prev) => mergeRoadmapRecord(prev, result.data));
    setSelectedRoadmapId(result.data.id);
    setSelectedDay(result.data.blueprint.days[0] || null);
    setActiveTab("roadmap");
    toast.success("AI đã tạo lộ trình mới cho bạn.");
  };

  const handleSelectRoadmap = (roadmapId: number) => {
    setSelectedRoadmapId(roadmapId);
    setSelectedDay(null);
    setActiveTab("roadmap");
  };

  const handleSelectDay = (dayPlan: RoadmapDayPlan) => {
    setSelectedDay(dayPlan);
  };

  return (
    <div className="min-h-screen bg-[#020617] px-4 pb-16 pt-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.22),transparent_30%),rgba(15,23,42,0.92)] p-8"
        >
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-200">
                <WandSparkles className="h-4 w-4" />
                AI Roadmap Studio
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                Đánh giá band hiện tại và tạo lộ trình IELTS học qua phim
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
                Người dùng có thể test 4 kỹ năng, xem lại đúng sai, sau đó nhập
                band hiện tại và band mục tiêu để AI dựng roadmap 30, 60 hoặc 90
                ngày.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <OverviewStat
                icon={Target}
                label="Band gần nhất"
                value={
                  latestCompletedAssessment?.overall_score
                    ? latestCompletedAssessment.overall_score.toFixed(1)
                    : "--"
                }
              />
              <OverviewStat
                icon={CalendarDays}
                label="Lộ trình đã tạo"
                value={String(roadmaps.length)}
              />
              <OverviewStat
                icon={Sparkles}
                label="Ngày đã soạn"
                value={String(totalGeneratedLessons)}
              />
            </div>
          </div>
        </motion.section>
        <div className="grid gap-4 lg:grid-cols-3">
          <TabButton
            active={activeTab === "assessment"}
            icon={BrainCircuit}
            label="AI Assessment"
            description="Làm bài test, chấm band và xem feedback."
            onClick={() => setActiveTab("assessment")}
          />
          <TabButton
            active={activeTab === "history"}
            icon={ClipboardCheck}
            label="Lịch sử bài test"
            description="Mở lại bài cũ và làm lại khi cần."
            onClick={() => setActiveTab("history")}
          />
          <TabButton
            active={activeTab === "roadmap"}
            icon={BookOpenCheck}
            label="Roadmap theo ngày"
            description="Xem tổng thể kế hoạch và sinh lesson theo ngày."
            onClick={() => setActiveTab("roadmap")}
          />
        </div>
        {activeTab === "assessment" && (
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300">
                    Assessment Workspace
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-white">
                    Kiểm tra trình độ hiện tại
                  </h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleGenerateAssessment}
                    disabled={generatingAssessment}
                    className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-60"
                  >
                    {generatingAssessment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Tạo bài test mới
                  </button>
                  {currentAssessment?.status === "COMPLETED" && (
                    <button
                      type="button"
                      onClick={() => setIsReviewMode((prev) => !prev)}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white"
                    >
                      {isReviewMode ? "Ẩn review" : "Xem review"}
                    </button>
                  )}
                </div>
              </div>

              {!currentAssessment ? (
                <div className="rounded-[28px] border border-dashed border-white/15 bg-black/10 px-6 py-14 text-center">
                  <BrainCircuit className="mx-auto h-12 w-12 text-sky-300" />
                  <p className="mt-4 text-lg font-semibold text-white">
                    Chưa có bài assessment nào
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-black/10 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${getAssessmentStatusStyles(
                          currentAssessment.status,
                        )}`}
                      >
                        {currentAssessment.status === "COMPLETED"
                          ? "Đã chấm điểm"
                          : "Đang làm"}
                      </span>
                      {currentAssessment.is_fallback && (
                        <span className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-fuchsia-200">
                          Fallback
                        </span>
                      )}
                      <span className="text-sm text-slate-400">
                        {formatDateTime(currentAssessment.created_at)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleResetAssessment()}
                        disabled={resettingAssessment}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {resettingAssessment ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                        Làm lại
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmitAssessment}
                        disabled={
                          submittingAssessment ||
                          currentAssessment.status === "COMPLETED"
                        }
                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-60"
                      >
                        {submittingAssessment ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Chấm điểm
                      </button>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-sky-300">
                          Listening
                        </p>
                        <p className="text-sm text-slate-400">
                          Nghe audio và chọn đáp án đúng
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handlePlayListeningScript}
                        className="inline-flex items-center gap-2 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-100"
                      >
                        <Volume2 className="h-4 w-4" />
                        Nghe
                      </button>
                    </div>
                    <div className="rounded-2xl border border-dashed border-sky-400/20 bg-slate-950/60 p-4 text-sm leading-7 text-slate-300">
                      Không hiển thị transcript để giữ đúng dạng bài nghe. Hãy
                      bấm <strong className="text-white">Nghe</strong> và trả
                      lời câu hỏi.
                    </div>
                    {currentAssessment.status === "COMPLETED" && (
                      <details className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                        <summary className="cursor-pointer font-semibold text-white">
                          Xem transcript sau khi làm bài
                        </summary>
                        <p className="mt-3 leading-7 text-slate-300">
                          {currentAssessment.quiz_data.listening.audio_script}
                        </p>
                      </details>
                    )}
                    <div className="mt-4 grid gap-3">
                      {currentAssessment.quiz_data.listening.questions.map(
                        (question, index) => (
                          <div
                            key={`listening-${question.question}`}
                            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                          >
                            <p className="mb-3 font-semibold text-white">
                              {index + 1}. {question.question}
                            </p>
                            <div className="grid gap-2">
                              {question.options.map((option) => (
                                <label
                                  key={option}
                                  className={`rounded-2xl border px-4 py-3 text-sm ${
                                    answers.listening[index] === option
                                      ? "border-sky-400/30 bg-sky-500/10 text-sky-100"
                                      : "border-white/10 bg-black/10 text-slate-300"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`listening-${index}`}
                                    className="sr-only"
                                    checked={
                                      answers.listening[index] === option
                                    }
                                    onChange={() =>
                                      handleAssessmentAnswer(
                                        "listening",
                                        index,
                                        option,
                                      )
                                    }
                                    disabled={
                                      currentAssessment.status === "COMPLETED"
                                    }
                                  />
                                  {option}
                                </label>
                              ))}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
                    <p className="text-sm font-semibold text-emerald-300">
                      Reading
                    </p>
                    <p className="mt-2 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-7 text-slate-300">
                      {currentAssessment.quiz_data.reading.passage}
                    </p>
                    <div className="mt-4 grid gap-3">
                      {currentAssessment.quiz_data.reading.questions.map(
                        (question, index) => (
                          <div
                            key={`reading-${question.question}`}
                            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                          >
                            <p className="mb-3 font-semibold text-white">
                              {index + 1}. {question.question}
                            </p>
                            <div className="grid gap-2">
                              {question.options.map((option) => (
                                <label
                                  key={option}
                                  className={`rounded-2xl border px-4 py-3 text-sm ${
                                    answers.reading[index] === option
                                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                                      : "border-white/10 bg-black/10 text-slate-300"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`reading-${index}`}
                                    className="sr-only"
                                    checked={answers.reading[index] === option}
                                    onChange={() =>
                                      handleAssessmentAnswer(
                                        "reading",
                                        index,
                                        option,
                                      )
                                    }
                                    disabled={
                                      currentAssessment.status === "COMPLETED"
                                    }
                                  />
                                  {option}
                                </label>
                              ))}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
                      <p className="text-sm font-semibold text-fuchsia-300">
                        Writing
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-300">
                        {compactWritingPrompt}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                        {assessmentWordCount} /{" "}
                        {currentAssessment.quiz_data.writing.min_words}+ từ
                      </p>
                      <textarea
                        value={answers.writing}
                        onChange={(event) =>
                          setAnswers((prev) => ({
                            ...prev,
                            writing: event.target.value,
                          }))
                        }
                        disabled={currentAssessment.status === "COMPLETED"}
                        className="mt-4 min-h-[220px] w-full rounded-3xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white outline-none"
                        placeholder="Viết câu trả lời ở đây..."
                      />
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
                      <div className="flex items-center gap-3">
                        <Mic2 className="h-5 w-5 text-amber-300" />
                        <p className="text-sm font-semibold text-amber-300">
                          Speaking
                        </p>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-slate-300">
                        {compactSpeakingPrompt}
                      </p>
                      <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={
                              isSpeakingRecording
                                ? handleStopSpeakingRecording
                                : handleStartSpeakingRecording
                            }
                            disabled={currentAssessment.status === "COMPLETED"}
                            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold ${
                              isSpeakingRecording
                                ? "bg-rose-500 text-white"
                                : "bg-amber-400 text-slate-950"
                            } disabled:opacity-60`}
                          >
                            <Mic2 className="h-4 w-4" />
                            {isSpeakingRecording
                              ? "Dừng ghi âm"
                              : "Bắt đầu nói"}
                          </button>
                          <button
                            type="button"
                            onClick={clearSpeakingResponse}
                            disabled={
                              currentAssessment.status === "COMPLETED" ||
                              (!speakingAudioUrl && !answers.speaking)
                            }
                            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Ghi lại
                          </button>
                        </div>

                        {isSpeakingRecording && (
                          <p className="mt-3 text-sm font-semibold text-rose-300">
                            Đang ghi âm câu trả lời của bạn...
                          </p>
                        )}
                        {speakingRecordingError && (
                          <p className="mt-3 text-sm text-rose-300">
                            {speakingRecordingError}
                          </p>
                        )}
                        {speakingAudioUrl && (
                          <audio
                            controls
                            src={speakingAudioUrl}
                            className="mt-4 w-full"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-6">
              <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300">
                  Tổng quan
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
                    <p className="text-sm text-slate-400">Band</p>
                    <p className="mt-2 text-3xl font-black text-white">
                      {currentAssessment?.overall_score
                        ? currentAssessment.overall_score.toFixed(1)
                        : "--"}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
                    <p className="text-sm text-slate-400">
                      Listening / Reading
                    </p>
                    <p className="mt-2 text-lg font-bold text-white">
                      {currentAssessment?.review
                        ? `${currentAssessment.review.totals.mc_correct}/${currentAssessment.review.totals.mc_total}`
                        : "Chưa có dữ liệu"}
                    </p>
                  </div>
                </div>
                {currentAssessment?.grammar_feedback && (
                  <p className="mt-4 rounded-3xl border border-white/10 bg-black/10 p-4 text-sm leading-7 text-slate-300">
                    <strong className="text-white">Grammar:</strong>{" "}
                    {currentAssessment.grammar_feedback}
                  </p>
                )}
                {currentAssessment?.vocab_feedback && (
                  <p className="mt-4 rounded-3xl border border-white/10 bg-black/10 p-4 text-sm leading-7 text-slate-300">
                    <strong className="text-white">Vocabulary:</strong>{" "}
                    {currentAssessment.vocab_feedback}
                  </p>
                )}
              </div>

              {currentAssessment?.review && isReviewMode && (
                <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <h3 className="text-xl font-bold text-white">
                    Review đúng sai
                  </h3>
                  <div className="mt-4 space-y-4">
                    {currentAssessment.review.listening.items.map((item) => (
                      <ReviewQuestionCard key={`l-${item.index}`} item={item} />
                    ))}
                    {currentAssessment.review.reading.items.map((item) => (
                      <ReviewQuestionCard key={`r-${item.index}`} item={item} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300">
                  Assessment History
                </p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  Xem lại các lần đánh giá
                </h2>
              </div>
              <button
                type="button"
                onClick={handleGenerateAssessment}
                disabled={generatingAssessment}
                className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-60"
              >
                {generatingAssessment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Tạo bài test mới
              </button>
            </div>

            <div className="grid gap-4">
              {assessments.map((record) => (
                <div
                  key={record.id}
                  className="rounded-3xl border border-white/10 bg-black/10 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${getAssessmentStatusStyles(
                            record.status,
                          )}`}
                        >
                          {record.status}
                        </span>
                        <span className="text-sm text-slate-400">
                          {formatDateTime(record.created_at)}
                        </span>
                      </div>
                      <p className="mt-3 text-lg font-bold text-white">
                        Assessment #{record.id}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        Band: {record.overall_score?.toFixed(1) || "--"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleSelectAssessment(record)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white"
                      >
                        Mở bài
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResetAssessment(record.id)}
                        disabled={resettingAssessment}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-slate-200 disabled:opacity-60"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Làm lại
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!assessments.length && (
                <div className="rounded-3xl border border-dashed border-white/15 bg-black/10 px-5 py-12 text-center text-slate-400">
                  Chưa có lịch sử assessment nào.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "roadmap" && (
          <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
            <div className="space-y-6">
              <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300">
                  Create Roadmap
                </p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  Tạo lộ trình mới
                </h2>
                <div className="mt-5 space-y-4">
                  <input
                    type="number"
                    min="0"
                    max="9"
                    step="0.5"
                    value={currentScore}
                    onChange={(event) => setCurrentScore(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                    placeholder="Điểm hiện tại"
                  />
                  <input
                    type="number"
                    min="0"
                    max="9"
                    step="0.5"
                    value={targetScore}
                    onChange={(event) => setTargetScore(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                    placeholder="Điểm mục tiêu"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    {[30, 60, 90].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setDurationDays(value as 30 | 60 | 90)}
                        className={`rounded-2xl border px-3 py-3 text-sm font-bold ${
                          durationDays === value
                            ? "border-sky-400/30 bg-sky-500/10 text-sky-100"
                            : "border-white/10 bg-black/15 text-slate-300"
                        }`}
                      >
                        {value} ngày
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateRoadmap}
                    disabled={isGeneratingRoadmap}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-60"
                  >
                    {isGeneratingRoadmap ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <WandSparkles className="h-4 w-4" />
                    )}
                    Tạo lộ trình bằng AI
                  </button>
                </div>
              </div>

              <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">
                    Roadmap đã tạo
                  </h3>
                  <span className="text-sm text-slate-400">
                    {roadmaps.length} roadmap
                  </span>
                </div>
                <div className="space-y-3">
                  {roadmaps.map((roadmap) => (
                    <button
                      key={roadmap.id}
                      type="button"
                      onClick={() => handleSelectRoadmap(roadmap.id)}
                      className={`w-full rounded-3xl border p-4 text-left ${
                        selectedRoadmapId === roadmap.id
                          ? "border-sky-400/30 bg-sky-500/10"
                          : "border-white/10 bg-black/10"
                      }`}
                    >
                      <p className="font-bold text-white">
                        Roadmap #{roadmap.id}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {roadmap.current_score.toFixed(1)} →{" "}
                        {roadmap.target_score.toFixed(1)} ·{" "}
                        {roadmap.duration_days} ngày
                      </p>
                    </button>
                  ))}
                  {!roadmaps.length && (
                    <div className="rounded-3xl border border-dashed border-white/15 bg-black/10 px-5 py-10 text-center text-sm text-slate-400">
                      Chưa có roadmap nào.
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              {!selectedRoadmap ? (
                <div className="rounded-[32px] border border-dashed border-white/15 bg-white/5 px-6 py-16 text-center backdrop-blur-xl">
                  <BookOpenCheck className="mx-auto h-12 w-12 text-sky-300" />
                  <p className="mt-4 text-xl font-bold text-white">
                    Chọn hoặc tạo một roadmap
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300">
                          Selected Roadmap
                        </p>
                        <h2 className="mt-2 text-3xl font-black text-white">
                          {selectedRoadmap.current_score.toFixed(1)} →{" "}
                          {selectedRoadmap.target_score.toFixed(1)} IELTS
                        </h2>
                        <p className="mt-2 text-sm text-slate-400">
                          {selectedRoadmap.duration_days} ngày ·{" "}
                          {selectedRoadmap.generated_task_days.length} ngày đã
                          soạn · {selectedRoadmapProgress}% tiến độ
                        </p>
                      </div>
                    </div>
                    {selectedRoadmap.warning && (
                      <p className="mt-4 rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                        Roadmap này đang dùng fallback từ backend khi AI chính
                        gặp giới hạn quota.
                      </p>
                    )}
                  </div>

                  <div className="grid gap-6">
                    {selectedRoadmap.blueprint.months.map((month) => (
                      <div
                        key={`month-${month.month}`}
                        className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
                      >
                        <h3 className="text-2xl font-black text-white">
                          Tháng {month.month}
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-slate-400">
                          {month.focus}
                        </p>
                        <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                          {month.days.map((dayPlan) => {
                            const hasTask =
                              selectedRoadmap.generated_task_days.includes(
                                dayPlan.day,
                              );
                            return (
                              <div
                                key={`day-${dayPlan.day}`}
                                className={`rounded-3xl border p-4 
                                    border-white/10 bg-black/10
                                `}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                      Ngày {dayPlan.day}
                                    </p>
                                    <p className="mt-2 text-lg font-bold text-white">
                                      {dayPlan.title}
                                    </p>
                                  </div>
                                  {hasTask && (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                                  )}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <span
                                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${getDayTypeStyles(
                                      dayPlan.type,
                                    )}`}
                                  >
                                    {dayPlan.type}
                                  </span>
                                </div>
                                <p className="mt-3 text-sm leading-7 text-slate-300">
                                  <strong className="text-white">
                                    Grammar:
                                  </strong>{" "}
                                  {dayPlan.grammar_focus || "Tổng hợp"}
                                </p>
                                <p className="text-sm leading-7 text-slate-300">
                                  <strong className="text-white">
                                    Vocabulary:
                                  </strong>{" "}
                                  {dayPlan.vocabulary_focus ||
                                    "Theo ngữ cảnh phim"}
                                </p>
                                <p className="text-sm leading-7 text-slate-300">
                                  <strong className="text-white">Task:</strong>{" "}
                                  {dayPlan.exercise_hint || "Ôn tập ngắn"}
                                </p>
                                <div className="mt-4 flex flex-wrap gap-3">
                                  <Link
                                    href={`/studies/roadmap/${selectedRoadmap.id}/day/${dayPlan.day}`}
                                    className="rounded-2xl bg-sky-500 px-4 py-2 text-sm font-bold text-slate-950"
                                  >
                                    {hasTask ? "Học lại" : "Học ngay"}
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
