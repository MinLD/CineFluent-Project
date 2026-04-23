"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookCheck,
  CheckCircle2,
  ClipboardList,
  Film,
  Loader2,
  Sparkles,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";

import { BeUrl } from "@/app/lib/services/api_client";
import {
  IClassAssignmentSource,
  IClassHomeworkGrammarTag,
  IClassSessionAssignment,
  IClassSessionAssignmentSubmission,
  IClassroomMember,
} from "@/app/lib/types/classroom";

function formatSubmittedAt(value: string | null) {
  if (!value) return "Chưa nộp";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN");
}

export default function ClassAssignmentPanel({
  classroomId,
  myRole,
  members = [],
}: {
  classroomId: number;
  myRole: "teacher" | "student" | null;
  members?: IClassroomMember[];
}) {
  const isTeacher = myRole === "teacher";
  const studentMembers = useMemo(
    () => members.filter((member) => member.role === "student"),
    [members],
  );

  const [sources, setSources] = useState<IClassAssignmentSource[]>([]);
  const [grammarTags, setGrammarTags] = useState<IClassHomeworkGrammarTag[]>([]);
  const [assignments, setAssignments] = useState<IClassSessionAssignment[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [questionCount, setQuestionCount] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openHomeworkId, setOpenHomeworkId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  async function loadHomeworks(silent = false) {
    if (!silent) setIsLoading(true);
    try {
      const response = await fetch(`${BeUrl}/classrooms/${classroomId}/homeworks`, {
        credentials: "include",
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Không thể tải danh sách bài tập.");
      }

      const nextAssignments = payload?.data?.assignments || [];
      setAssignments(nextAssignments);
      setOpenHomeworkId((current) =>
        current && nextAssignments.some((item: IClassSessionAssignment) => item.id === current)
          ? current
          : null,
      );
    } catch (fetchError: any) {
      setError(fetchError?.message || "Không thể tải danh sách bài tập.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }

  async function loadSources() {
    if (!isTeacher) return;
    try {
      const response = await fetch(`${BeUrl}/classrooms/${classroomId}/homework-sources`, {
        credentials: "include",
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Không thể tải dữ liệu tạo bài tập.");
      }

      const nextSources = payload?.data?.sources || [];
      const nextTags = payload?.data?.grammar_tags || [];
      setSources(nextSources);
      setGrammarTags(nextTags);
      setSelectedVideoId((current) => current ?? nextSources[0]?.id ?? null);
    } catch (fetchError: any) {
      setError(fetchError?.message || "Không thể tải dữ liệu tạo bài tập.");
    }
  }

  useEffect(() => {
    loadHomeworks();
    loadSources();
  }, [classroomId]);

  const openHomework = assignments.find((item) => item.id === openHomeworkId) || null;

  useEffect(() => {
    if (!openHomework || isTeacher) {
      setAnswers({});
      return;
    }

    const nextAnswers: Record<string, string> = {};
    for (const answer of openHomework.submission?.answers || []) {
      nextAnswers[answer.question_id] = answer.selected_option;
    }
    setAnswers(nextAnswers);
  }, [isTeacher, openHomework?.id, openHomework?.submission?.updated_at]);

  const selectedTagLabels = useMemo(
    () =>
      grammarTags
        .filter((tag) => selectedTagIds.includes(tag.id))
        .map((tag) => tag.name_vi || tag.name_en),
    [grammarTags, selectedTagIds],
  );

  const openHomeworkSubmissionMap = useMemo(() => {
    const entries = new Map<string, IClassSessionAssignmentSubmission>();
    for (const submission of openHomework?.submission_summaries || []) {
      entries.set(submission.user_id, submission);
    }
    return entries;
  }, [openHomework]);

  const openHomeworkStudentRows = useMemo(
    () =>
      studentMembers.map((member) => {
        const submission = openHomeworkSubmissionMap.get(member.user_id) || null;
        return {
          member,
          submission,
          submitted: !!submission?.submitted_at,
        };
      }),
    [openHomeworkSubmissionMap, studentMembers],
  );

  function toggleTag(tagId: number) {
    setSelectedTagIds((current) =>
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId],
    );
  }

  async function handleCreateHomework() {
    if (!selectedVideoId) {
      setError("Vui lòng chọn phim local.");
      return;
    }
    if (!selectedTagIds.length) {
      setError("Vui lòng chọn ít nhất một grammar tag.");
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      const response = await fetch(`${BeUrl}/classrooms/${classroomId}/homeworks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          video_id: selectedVideoId,
          question_count: questionCount,
          grammar_focus: grammarTags
            .filter((tag) => selectedTagIds.includes(tag.id))
            .map((tag) => tag.name_en),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Không thể tạo bài tập.");
      }

      await loadHomeworks(true);
      setOpenHomeworkId(payload?.data?.id || null);
    } catch (createError: any) {
      setError(createError?.message || "Không thể tạo bài tập.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteHomework(assignmentId: number) {
    if (!window.confirm("Xóa bài tập này? Toàn bộ bài nộp của học viên cũng sẽ bị xóa.")) {
      return;
    }

    setDeletingId(assignmentId);
    setError(null);
    try {
      const response = await fetch(
        `${BeUrl}/classrooms/${classroomId}/homeworks/${assignmentId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Không thể xóa bài tập.");
      }

      if (openHomeworkId === assignmentId) {
        setOpenHomeworkId(null);
      }
      await loadHomeworks(true);
    } catch (deleteError: any) {
      setError(deleteError?.message || "Không thể xóa bài tập.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSubmitHomework() {
    if (!openHomework) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(
        `${BeUrl}/classrooms/${classroomId}/homeworks/${openHomework.id}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            answers: Object.entries(answers).map(([question_id, selected_option]) => ({
              question_id,
              selected_option,
            })),
          }),
        },
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Không thể nộp bài tập.");
      }

      await loadHomeworks(true);
    } catch (submitError: any) {
      setError(submitError?.message || "Không thể nộp bài tập.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <section className="mt-8 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-950">Bài tập về nhà</h2>
              <p className="text-sm text-slate-500">
                {isTeacher
                  ? "Giảng viên theo dõi học viên đã nộp hay chưa nộp bài."
                  : "Học viên mở bài tập, làm bài và nộp để xem điểm."}
              </p>
            </div>
          </div>
        </div>

        {isTeacher ? (
          <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-950">Tạo bài tập</p>
                <p className="text-sm text-slate-500">
                  Chọn phim, grammar tag và số câu hỏi để giao bài cho lớp.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)_140px]">
              <div>
                <label className="text-sm font-semibold text-slate-700">Phim local</label>
                <select
                  value={selectedVideoId ?? ""}
                  onChange={(e) => setSelectedVideoId(Number(e.target.value))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500"
                >
                  {sources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.title} ({source.candidate_count} câu)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Grammar tags</label>
                <div className="mt-2 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3">
                  {grammarTags.map((tag) => {
                    const active = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                          active
                            ? "border-blue-200 bg-blue-600 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200 hover:bg-blue-50"
                        }`}
                      >
                        {tag.name_vi || tag.name_en}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Số câu</label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500"
                >
                  {[3, 5, 7, 10].map((count) => (
                    <option key={count} value={count}>
                      {count} câu
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedTagLabels.length ? (
              <p className="mt-4 text-sm text-slate-500">
                Đang chọn: {selectedTagLabels.join(", ")}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleCreateHomework}
              disabled={isCreating || !sources.length}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
              {isCreating ? "Đang tạo bài tập..." : "Tạo bài tập về nhà"}
            </button>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}

        {isLoading ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải bài tập...
          </div>
        ) : assignments.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {assignments.map((assignment) => {
              const submitted = !!assignment.submission?.submitted_at;
              const submissionCount = assignment.submission_summaries?.length || 0;
              const pendingCount = Math.max(studentMembers.length - submissionCount, 0);

              return (
                <article
                  key={assignment.id}
                  className="rounded-[22px] border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                        {assignment.status === "ACTIVE" ? "Đang mở" : "Đã đóng"}
                      </p>
                      <h3 className="mt-2 text-xl font-black text-slate-950">{assignment.title}</h3>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700">
                      {assignment.question_count} câu
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-500">
                    {assignment.source_video_title || "Không rõ phim nguồn"}
                  </p>

                  {assignment.grammar_focus?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {assignment.grammar_focus.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {isTeacher ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                          Đã nộp
                        </p>
                        <p className="mt-2 text-2xl font-black text-slate-950">{submissionCount}</p>
                        <p className="mt-1 text-sm text-slate-600">học viên</p>
                      </div>
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">
                          Chưa nộp
                        </p>
                        <p className="mt-2 text-2xl font-black text-slate-950">{pendingCount}</p>
                        <p className="mt-1 text-sm text-slate-600">học viên</p>
                      </div>
                    </div>
                  ) : submitted ? (
                    <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      {assignment.submission?.correct_answers}/{assignment.submission?.total_questions} câu đúng
                      {assignment.submission?.score !== null ? ` • ${assignment.submission?.score}/10` : ""}
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setOpenHomeworkId(assignment.id)}
                      className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      {isTeacher ? <Users className="h-4 w-4" /> : <BookCheck className="h-4 w-4" />}
                      {isTeacher
                        ? "Xem danh sách học viên"
                        : submitted
                          ? "Xem kết quả bài làm"
                          : "Mở bài tập"}
                    </button>

                    {isTeacher ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteHomework(assignment.id)}
                        disabled={deletingId === assignment.id}
                        className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === assignment.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Xóa
                      </button>
                    ) : null}

                    <span className="text-sm font-medium text-slate-500">
                      {isTeacher
                        ? `${submissionCount}/${studentMembers.length} học viên đã nộp.`
                        : submitted
                          ? "Bạn đã nộp bài này."
                          : "Làm xong thì bấm Nộp bài để hiện điểm."}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-blue-500" />
            <h3 className="mt-4 text-xl font-bold text-slate-950">Chưa có bài tập nào</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              {isTeacher
                ? "Chọn phim và grammar tag để tạo bài tập cho học viên."
                : "Giảng viên chưa giao bài tập nào cho lớp này."}
            </p>
          </div>
        )}
      </section>

      {openHomework ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[32px] border border-slate-800 bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-600">
                  {isTeacher ? "Danh sách học viên" : "Homework"}
                </p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">{openHomework.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{openHomework.instructions}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenHomeworkId(null)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
              >
                Đóng
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              {isTeacher ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-sm font-semibold text-slate-600">Tổng học viên</p>
                      <p className="mt-2 text-3xl font-black text-slate-950">{studentMembers.length}</p>
                    </div>
                    <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                      <p className="text-sm font-semibold text-emerald-700">Đã nộp</p>
                      <p className="mt-2 text-3xl font-black text-slate-950">
                        {openHomework.submission_summaries?.length || 0}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                      <p className="text-sm font-semibold text-amber-700">Chưa nộp</p>
                      <p className="mt-2 text-3xl font-black text-slate-950">
                        {Math.max(
                          studentMembers.length - (openHomework.submission_summaries?.length || 0),
                          0,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {openHomeworkStudentRows.length ? (
                      openHomeworkStudentRows.map(({ member, submission, submitted }) => (
                        <div
                          key={member.id}
                          className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-lg font-bold text-slate-950">
                              {member.user?.fullname || member.user?.email || "Học viên"}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">{member.user?.email}</p>
                            <p className="mt-2 text-sm text-slate-500">
                              {submitted
                                ? `Đã nộp lúc ${formatSubmittedAt(submission?.submitted_at || null)}`
                                : "Chưa nộp bài"}
                            </p>
                          </div>

                          {submitted ? (
                            <div className="flex items-center gap-3">
                              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                                <CheckCircle2 className="h-4 w-4" />
                                Đã nộp
                              </span>
                              <div className="rounded-2xl bg-white px-4 py-3 text-right">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                  Điểm
                                </p>
                                <p className="mt-1 text-xl font-black text-slate-950">
                                  {submission?.score ?? 0}/10
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                              <XCircle className="h-4 w-4" />
                              Chưa nộp
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                        Lớp này chưa có học viên.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {openHomework.submission ? (
                    <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                      <p className="text-sm font-semibold text-emerald-700">Kết quả bài làm</p>
                      <p className="mt-2 text-3xl font-black text-slate-950">
                        {openHomework.submission.score ?? 0}/10
                      </p>
                      <p className="mt-2 text-sm text-emerald-700">
                        {openHomework.submission.correct_answers}/{openHomework.submission.total_questions} câu đúng
                      </p>
                    </div>
                  ) : null}

                  <div className="space-y-4">
                    {openHomework.questions.map((question, index) => {
                      const result = openHomework.submission?.result_json?.find(
                        (item) => item.question_id === question.id,
                      );
                      const selectedValue = answers[question.id] || "";

                      return (
                        <div
                          key={question.id}
                          className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                        >
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                            Câu {index + 1}
                          </p>
                          <h4 className="mt-2 text-xl font-bold leading-9 text-slate-950">
                            {question.prompt}
                          </h4>
                          {question.translation ? (
                            <p className="mt-2 text-sm italic text-slate-500">{question.translation}</p>
                          ) : null}

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {question.options.map((option) => {
                              const isSelected = selectedValue === option;
                              const isCorrect = !!result && result.correct_answer === option;
                              const isWrongSelected =
                                !!result && isSelected && result.correct_answer !== option;

                              return (
                                <button
                                  key={option}
                                  type="button"
                                  disabled={!!openHomework.submission}
                                  onClick={() => {
                                    if (openHomework.submission) return;
                                    setAnswers((current) => ({
                                      ...current,
                                      [question.id]: option,
                                    }));
                                  }}
                                  className={`rounded-2xl border px-4 py-4 text-left text-sm font-medium transition ${
                                    isCorrect
                                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                      : isWrongSelected
                                        ? "border-red-300 bg-red-50 text-red-700"
                                        : isSelected
                                          ? "border-blue-300 bg-blue-50 text-blue-700"
                                          : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50"
                                  } ${openHomework.submission ? "cursor-default" : ""}`}
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>

                          {result ? (
                            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                              <p
                                className={`text-sm font-semibold ${
                                  result.is_correct ? "text-emerald-700" : "text-red-600"
                                }`}
                              >
                                {result.is_correct ? "Bạn trả lời đúng." : "Bạn trả lời sai."}
                              </p>
                              <p className="mt-2 text-sm text-slate-600">{result.selected_explanation}</p>
                              {result.explanation ? (
                                <p className="mt-2 text-sm text-slate-500">{result.explanation}</p>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-slate-200 px-6 py-5">
              {isTeacher ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    Giảng viên theo dõi học viên đã nộp bài hay chưa nộp bài tại đây.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDeleteHomework(openHomework.id)}
                    disabled={deletingId === openHomework.id}
                    className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingId === openHomework.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Xóa bài tập
                  </button>
                </div>
              ) : openHomework.submission ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    Bạn đã nộp bài. Có thể xem lại đáp án và giải thích ở từng câu.
                  </p>
                  <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                    Đã nộp bài
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Chọn đủ đáp án cho tất cả câu hỏi rồi bấm Nộp bài.
                  </p>
                  <button
                    type="button"
                    onClick={handleSubmitHomework}
                    disabled={
                      isSubmitting ||
                      openHomework.questions.some((question) => !answers[question.id])
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {isSubmitting ? "Đang nộp bài..." : "Nộp bài"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
