import { Suspense } from "react";
import { SSR_Reports } from "@/app/lib/data/requests_reports";
import Reports_Management from "@/app/components/admin/reports_management";
import { SkeletonManagers } from "@/app/components/skeleton_managers";

export default async function ReportsSection() {
  const { reports, pagination } = await SSR_Reports(1, 5);

  return (
    <div className="container mx-auto py-2">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 sm:text-center">
        Quản Lý Báo Cáo Lỗi Video
      </h1>

      <Suspense fallback={<SkeletonManagers />}>
        <Reports_Management data_reports={{ reports, pagination }} />
      </Suspense>
    </div>
  );
}
