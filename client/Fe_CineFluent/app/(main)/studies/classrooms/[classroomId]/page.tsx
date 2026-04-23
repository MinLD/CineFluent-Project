import Link from "next/link";
import { ChevronLeft, Copy, UsersRound } from "lucide-react";
import { notFound } from "next/navigation";

import ClassAssignmentPanel from "@/app/components/classrooms/ClassAssignmentPanel";
import ClassSessionsPanel from "@/app/components/classrooms/ClassSessionsPanel";
import { SSR_ClassroomDetailData } from "@/app/lib/data/classroom";

export default async function ClassroomDetailPage({
  params,
}: {
  params: Promise<{ classroomId: string }>;
}) {
  const resolvedParams = await params;
  const classroomId = Number(resolvedParams.classroomId);

  if (!Number.isInteger(classroomId)) {
    notFound();
  }

  const { data, error } = await SSR_ClassroomDetailData(classroomId);

  if (!data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link
          href="/studies/classrooms"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại lớp học
        </Link>
        <div className="rounded-[28px] border border-slate-200 bg-white p-12 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-slate-950">
            Không thể tải lớp học
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            {error || "Lớp học không tồn tại hoặc bạn chưa tham gia lớp này."}
          </p>
        </div>
      </div>
    );
  }

  const members = data.members || [];
  const sessions = data.sessions || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/studies/classrooms"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại danh sách lớp
        </Link>

        <section className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-600">
                {data.my_role === "teacher"
                  ? "Bạn là giáo viên"
                  : "Bạn là học viên"}
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
                {data.name}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">
                {data.description || "Lớp học chưa có mô tả."}
              </p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Mã mời lớp
              </p>
              <div className="mt-2 flex items-center gap-3">
                <p className="font-mono text-3xl font-black tracking-[0.18em] text-slate-950">
                  {data.invite_code}
                </p>
                <Copy className="h-5 w-5 text-blue-600" />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Gửi mã này cho học viên để tham gia lớp.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <UsersRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Thành viên
                </h2>
                <p className="text-sm text-slate-500">
                  {members.length} người trong lớp
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-950">
                      {member.user?.fullname ||
                        member.user?.email ||
                        "Thành viên"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {member.user?.email}
                    </p>
                  </div>
                  <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
                    {member.role === "teacher" ? "Giáo viên" : "Học viên"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <ClassSessionsPanel
          classroomId={data.id}
          myRole={data.my_role}
          sessions={sessions}
        />

        <ClassAssignmentPanel
          classroomId={data.id}
          myRole={data.my_role}
          members={members}
        />
      </div>
    </div>
  );
}
