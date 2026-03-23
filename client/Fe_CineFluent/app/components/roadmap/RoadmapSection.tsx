import { Suspense } from "react";
import { BookOpenCheck, Sparkles } from "lucide-react";

import { SkeletonManagers } from "@/app/components/skeleton_managers";
import RoadmapClient from "@/app/components/roadmap/RoadmapClient";
import { SSR_RoadmapDashboardData } from "@/app/lib/data/roadmap";

async function RoadmapContent() {
  const { data, error } = await SSR_RoadmapDashboardData();

  if (error === "401") {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <div className="min-h-[420px] rounded-[32px] border border-dashed border-white/10 bg-slate-950/60 p-12 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400">
            <BookOpenCheck className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-white">
            Vui lòng đăng nhập
          </h2>
          <p className="mx-auto max-w-xl text-slate-400">
            Bạn cần đăng nhập để làm bài đánh giá năng lực và tạo lộ trình học
            tiếng Anh bằng AI.
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <div className="min-h-[420px] rounded-[32px] border border-white/10 bg-slate-950/60 p-12 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-white">
            Không thể tải dữ liệu lộ trình
          </h2>
          <p className="mx-auto max-w-xl text-slate-400">
            Trang roadmap chưa lấy được dữ liệu khởi tạo từ backend. Bạn có thể
            tải lại trang để thử lại.
          </p>
        </div>
      </div>
    );
  }

  return <RoadmapClient initialData={data} />;
}

export default function RoadmapSection() {
  return (
    <Suspense fallback={<SkeletonManagers />}>
      <RoadmapContent />
    </Suspense>
  );
}
