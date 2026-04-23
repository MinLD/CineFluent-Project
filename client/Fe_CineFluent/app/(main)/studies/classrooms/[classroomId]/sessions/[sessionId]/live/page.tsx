import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";

import LiveClassroomRoom from "@/app/components/classrooms/LiveClassroomRoom";
import { SSR_ClassroomDetailData } from "@/app/lib/data/classroom";

export default async function LiveClassroomPage({
  params,
}: {
  params: Promise<{ classroomId: string; sessionId: string }>;
}) {
  const resolvedParams = await params;
  const classroomId = Number(resolvedParams.classroomId);
  const sessionId = Number(resolvedParams.sessionId);

  if (!Number.isInteger(classroomId) || !Number.isInteger(sessionId)) {
    notFound();
  }

  const { data, error } = await SSR_ClassroomDetailData(classroomId);
  const session = data?.sessions?.find((item) => item.id === sessionId);

  if (!data || !session) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <Link
            href={`/studies/classrooms/${classroomId}`}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
          >
            <ChevronLeft className="h-4 w-4" />
            Quay lại lớp học
          </Link>
          <div className="rounded-[28px] border border-slate-200 bg-white p-12 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">
              Không thể vào phòng học
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-500">
              {error ||
                "Buổi học không tồn tại hoặc bạn chưa thuộc lớp học này."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <LiveClassroomRoom classroom={data} session={session} />;
}
