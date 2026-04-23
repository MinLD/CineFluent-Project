import { BookOpenCheck } from "lucide-react";
import { notFound } from "next/navigation";

import GrammarLessonSection from "@/app/components/grammar_learning/GrammarLessonSection";
import { SSR_GrammarLessonData } from "@/app/lib/data/grammar_learning";

export default async function GrammarLessonPage({
  params,
}: {
  params: Promise<{ tagId: string }>;
}) {
  const resolvedParams = await params;
  const tagId = Number(resolvedParams.tagId);

  if (!Number.isInteger(tagId)) {
    notFound();
  }

  const { data, error } = await SSR_GrammarLessonData(tagId);

  if (error === "401") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
            <BookOpenCheck className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Vui lòng đăng nhập</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            Bạn cần đăng nhập để xem bài học ngữ pháp theo tiến trình cá nhân.
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Không thể tải bài học</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            {error || "Máy chủ chưa tạo được bài học cho node ngữ pháp này."}
          </p>
        </div>
      </div>
    );
  }

  return <GrammarLessonSection data={data} />;
}
