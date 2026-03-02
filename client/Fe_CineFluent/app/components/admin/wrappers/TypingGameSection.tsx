"use client";

import dynamic from "next/dynamic";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const TypingGameManagement = dynamic(
  () => import("@/app/components/admin/typing_game_management"),
  {
    loading: () => (
      <div className="p-6 space-y-4">
        <Skeleton height={40} width={300} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton height={200} className="rounded-2xl" />
          <Skeleton height={200} className="rounded-2xl" />
          <Skeleton height={200} className="rounded-2xl" />
        </div>
      </div>
    ),
    ssr: false,
  },
);

export default function TypingGameSection() {
  return <TypingGameManagement />;
}
