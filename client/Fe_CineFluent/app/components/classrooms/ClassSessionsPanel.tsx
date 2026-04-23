"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { CalendarClock, ClipboardList, Plus, Video } from "lucide-react";

import { createClassSessionAction } from "@/app/lib/actions/classroom";
import { IClassSession } from "@/app/lib/types/classroom";

type TActionState = {
  success?: boolean;
  error?: string;
  data?: IClassSession;
};

function formatSessionTime(value: string | null) {
  if (!value) {
    return "Chưa lên lịch";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Chưa lên lịch";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function ClassSessionsPanel({
  classroomId,
  myRole,
  sessions,
}: {
  classroomId: number;
  myRole: "teacher" | "student" | null;
  sessions: IClassSession[];
}) {
  const [state, action, isPending] = useActionState<TActionState, FormData>(
    createClassSessionAction,
    {},
  );

  useEffect(() => {
    if (state.success) {
      window.location.reload();
    }
  }, [state.success]);

  const isTeacher = myRole === "teacher";

  return (
    <section
      className={
        isTeacher
          ? "mt-8 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]"
          : "mt-8"
      }
    >
      {isTeacher ? (
        <form
          action={action}
          className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <input type="hidden" name="classroom_id" value={classroomId} />
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Tạo buổi học
              </h2>
              <p className="text-sm text-slate-500">
                Lên lịch và ghi chú nội dung chính.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Tên buổi học
              </label>
              <input
                name="title"
                required
                placeholder="Ví dụ: Ôn Present Simple qua phim"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Thời gian học
              </label>
              <input
                name="scheduled_at"
                type="datetime-local"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Trọng tâm ngữ pháp
              </label>
              <input
                name="grammar_focus"
                placeholder="present simple, past simple"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Mô tả ngắn
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Buổi học này sẽ tập trung vào..."
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Ghi chú giáo viên
              </label>
              <textarea
                name="teacher_notes"
                rows={3}
                placeholder="Ghi chú này sẽ dùng cho phase AI recap sau."
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          {state.error ? (
            <p className="mt-4 text-sm font-medium text-red-600">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isPending ? "Đang tạo buổi học..." : "Tạo buổi học"}
          </button>
        </form>
      ) : null}

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-950">
                Buổi học
              </h2>
              <p className="text-sm text-slate-500">
                {sessions.length} buổi đã được tạo trong lớp.
              </p>
            </div>
          </div>
        </div>

        {sessions.length ? (
          <div className="mt-6 space-y-3">
            {sessions.map((session) => (
              <article
                key={session.id}
                className="rounded-[22px] border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                      {formatSessionTime(session.scheduled_at)}
                    </p>
                    <h3 className="mt-2 text-xl font-black text-slate-950">
                      {session.title}
                    </h3>
                  </div>
                  <span className="w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    {session.status === "PLANNED"
                      ? "Đã lên lịch"
                      : session.status}
                  </span>
                </div>

                {session.description ? (
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {session.description}
                  </p>
                ) : null}

                {session.grammar_focus?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {session.grammar_focus.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-5 flex justify-end">
                  <Link
                    href={`/studies/classrooms/${classroomId}/sessions/${session.id}/live`}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <Video className="h-4 w-4" />
                    Vào phòng học
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-blue-500" />
            <h3 className="mt-4 text-xl font-bold text-slate-950">
              Chưa có buổi học nào
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              Giáo viên tạo buổi học trước, sau đó cả lớp có thể vào phòng live
              của từng buổi để học cùng nhau.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
