"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { BookOpenCheck, DoorOpen, Plus, UsersRound } from "lucide-react";

import {
  createClassroomAction,
  joinClassroomAction,
} from "@/app/lib/actions/classroom";
import { IClassroom } from "@/app/lib/types/classroom";

type TActionState = {
  success?: boolean;
  error?: string;
  data?: IClassroom;
};

export default function ClassroomsClient({
  classrooms,
}: {
  classrooms: IClassroom[];
}) {
  const [createState, createAction, isCreating] = useActionState<
    TActionState,
    FormData
  >(createClassroomAction, {});
  const [joinState, joinAction, isJoining] = useActionState<
    TActionState,
    FormData
  >(joinClassroomAction, {});

  useEffect(() => {
    if (createState.success || joinState.success) {
      window.location.reload();
    }
  }, [createState.success, joinState.success]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[28px] border border-blue-100 bg-white px-6 py-7 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-blue-600">
            CineFluent Classroom
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Lớp học của tôi
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
            Tạo lớp, mời học viên bằng mã lớp và chuẩn bị cho luồng buổi học AI
            tiếp theo.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <form
              action={createAction}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    Tạo lớp mới
                  </h2>
                  <p className="text-sm text-slate-500">Dành cho giáo viên.</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Tên lớp
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="Ví dụ: English Through Movies - Lớp A"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Mô tả
                  </label>
                  <textarea
                    name="description"
                    placeholder="Mục tiêu hoặc ghi chú ngắn cho lớp..."
                    rows={3}
                    className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              {createState.error ? (
                <p className="mt-4 text-sm font-medium text-red-600">
                  {createState.error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isCreating}
                className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isCreating ? "Đang tạo lớp..." : "Tạo lớp"}
              </button>
            </form>

            <form
              action={joinAction}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <DoorOpen className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    Tham gia lớp
                  </h2>
                  <p className="text-sm text-slate-500">
                    Nhập mã lớp từ giáo viên.
                  </p>
                </div>
              </div>

              <input
                name="invite_code"
                placeholder="Mã lớp, ví dụ: A1B2C3"
                className="mt-5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm uppercase tracking-[0.18em] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              {joinState.error ? (
                <p className="mt-4 text-sm font-medium text-red-600">
                  {joinState.error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isJoining}
                className="mt-5 inline-flex w-full items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
              >
                {isJoining ? "Đang tham gia..." : "Tham gia lớp"}
              </button>
            </form>
          </aside>

          <main className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Danh sách lớp
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Các lớp bạn đang dạy hoặc đã tham gia.
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                {classrooms.length} lớp
              </div>
            </div>

            {classrooms.length ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {classrooms.map((classroom) => (
                  <Link
                    key={classroom.id}
                    href={`/studies/classrooms/${classroom.id}`}
                    className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-200 hover:bg-blue-50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                          {classroom.my_role === "teacher"
                            ? "Giáo viên"
                            : "Học viên"}
                        </p>
                        <h3 className="mt-2 text-xl font-black text-slate-950">
                          {classroom.name}
                        </h3>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-600">
                        <UsersRound className="h-5 w-5" />
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500">
                      {classroom.description ||
                        "Chưa có mô tả cho lớp học này."}
                    </p>

                    <div className="mt-5 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-700">
                        {classroom.member_count} thành viên
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 font-mono text-xs font-bold tracking-[0.18em] text-slate-700">
                        {classroom.invite_code}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <BookOpenCheck className="mx-auto h-10 w-10 text-blue-500" />
                <h3 className="mt-4 text-xl font-bold text-slate-950">
                  Chưa có lớp học nào
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                  Tạo lớp mới nếu bạn là giáo viên, hoặc nhập mã lớp để tham gia
                  lớp học được giáo viên mời.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
