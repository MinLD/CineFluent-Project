import { BookOpenCheck } from "lucide-react";
import { notFound } from "next/navigation";

import GrammarReviewClient from "@/app/components/grammar_learning/GrammarReviewClient";
import {
  SSR_GrammarReviewData,
  SSR_GrammarReviewHistoryData,
} from "@/app/lib/data/grammar_learning";

export default async function GrammarReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ tagId: string }>;
  searchParams?: Promise<{ exerciseId?: string }>;
}) {
  const resolvedParams = await params;
  const tagId = Number(resolvedParams.tagId);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const exerciseId = resolvedSearchParams?.exerciseId
    ? Number(resolvedSearchParams.exerciseId)
    : null;

  if (!Number.isInteger(tagId)) {
    notFound();
  }

  const [{ data, error }, { data: historyData }] = await Promise.all([
    SSR_GrammarReviewData(tagId, Number.isInteger(exerciseId) ? exerciseId : null),
    SSR_GrammarReviewHistoryData(tagId),
  ]);

  if (error === "401") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
            <BookOpenCheck className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Vui lòng đăng nhập</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            Bạn cần đăng nhập để ôn tập ngữ pháp và lưu tiến trình học tập.
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Chưa có bài ôn tập</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            {error ||
              "Node này chưa có bộ câu ôn tập đã lưu. Hãy bấm nút bên dưới để AI tạo một bộ câu mới."}
          </p>
          <div className="mt-8">
            <GrammarReviewClient data={null} history={historyData} tagId={tagId} />
          </div>
        </div>
      </div>
    );
  }

  return <GrammarReviewClient data={data} history={historyData} tagId={tagId} />;
}
