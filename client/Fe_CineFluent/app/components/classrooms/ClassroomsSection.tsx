import { BookOpenCheck } from "lucide-react";

import ClassroomsClient from "@/app/components/classrooms/ClassroomsClient";
import { SSR_ClassroomsData } from "@/app/lib/data/classroom";

export default async function ClassroomsSection() {
  const { data, error } = await SSR_ClassroomsData();

  if (error === "401") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <BookOpenCheck className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-950">
            Vui lòng đăng nhập
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            Bạn cần đăng nhập để tạo hoặc tham gia lớp học.
          </p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-[28px] border border-slate-200 bg-white p-12 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-slate-950">
            Không thể tải lớp học
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return <ClassroomsClient classrooms={data?.classrooms || []} />;
}
