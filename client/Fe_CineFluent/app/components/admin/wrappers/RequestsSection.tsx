import { Suspense } from "react";
import { SSR_Requests } from "@/app/lib/data/requests_reports";
import Requests_Management from "@/app/components/admin/requests_management";
import { SkeletonManagers } from "@/app/components/skeleton_managers";

export default async function RequestsSection() {
  const { requests, pagination } = await SSR_Requests(1, 5);

  return (
    <div className="container mx-auto py-2">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 sm:text-center">
        Quản Lý Yêu Cầu Phim
      </h1>

      <Suspense fallback={<SkeletonManagers />}>
        <Requests_Management data_requests={{ requests, pagination }} />
      </Suspense>
    </div>
  );
}
