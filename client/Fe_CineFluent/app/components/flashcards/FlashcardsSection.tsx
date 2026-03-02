import { SkeletonManagers } from "@/app/components/skeleton_managers";
import FlashcardsClient from "@/app/components/flashcards/FlashcardsClient";
import { SSR_Flashcards } from "@/app/lib/data/flashcards";
import { Suspense } from "react";
import { BookOpen } from "lucide-react";

async function FlashcardsSection() {
  const { flashcards, error } = await SSR_Flashcards();

  if (error === "401") {
    // Show empty state or unauth state if not logged in
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="border border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-gray-50/50 dark:bg-zinc-900/50 min-h-[400px]">
          <BookOpen className="w-12 h-12 text-gray-400 mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
            Vui lòng đăng nhập
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            Bạn cần đăng nhập để xem danh sách từ vựng đã lưu và làm bài tập với
            AI.
          </p>
        </div>
      </div>
    );
  }

  return <FlashcardsClient initialFlashcards={flashcards || []} />;
}

export default function FlashcardsPageWithSuspense() {
  return (
    <Suspense fallback={<SkeletonManagers />}>
      <FlashcardsSection />
    </Suspense>
  );
}
