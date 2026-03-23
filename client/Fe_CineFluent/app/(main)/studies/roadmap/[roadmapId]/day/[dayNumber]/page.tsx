import { notFound } from "next/navigation";

import RoadmapLessonClient from "@/app/components/roadmap/RoadmapLessonClient";
import { SSR_RoadmapLessonData } from "@/app/lib/data/roadmap";

export const metadata = {
  title: "Bài Học Theo Ngày - CineFluent",
  description: "Trang học chi tiết cho từng ngày trong lộ trình AI",
};

export default async function RoadmapDayLessonPage({
  params,
}: {
  params: Promise<{ roadmapId: string; dayNumber: string }>;
}) {
  const resolvedParams = await params;
  const roadmapId = Number(resolvedParams.roadmapId);
  const dayNumber = Number(resolvedParams.dayNumber);

  if (!Number.isInteger(roadmapId) || !Number.isInteger(dayNumber)) {
    return notFound();
  }

  const { data, error } = await SSR_RoadmapLessonData(roadmapId, dayNumber);

  if (error === "401") {
    return (
      <div className="min-h-screen bg-[#020617] px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl">
          <h1 className="text-3xl font-black text-white">Vui lòng đăng nhập</h1>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Bạn cần đăng nhập để mở bài học theo ngày trong lộ trình AI.
          </p>
        </div>
      </div>
    );
  }

  if (error === "404" || !data) {
    return notFound();
  }

  return (
    <RoadmapLessonClient
      roadmap={data.roadmap}
      dayPlan={data.dayPlan}
      initialTask={data.task}
    />
  );
}
