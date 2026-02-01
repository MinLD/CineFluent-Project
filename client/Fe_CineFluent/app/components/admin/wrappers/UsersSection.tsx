import { Suspense } from "react";
import { SSR_Users } from "@/app/lib/data/users";
import Users_Management from "@/app/components/admin/users_management";
import Skeleton from "react-loading-skeleton";
import { SkeletonManagers } from "@/app/components/skeleton_managers";

export default async function UsersSection() {
  const { users, pagination } = await SSR_Users(1, 4);

  return (
    <div className="container mx-auto py-2">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 sm:text-center">
        Quản Lý Người Dùng
      </h1>

      <Suspense fallback={<SkeletonManagers />}>
        <Users_Management data_users={{ users, pagination }} />
      </Suspense>
    </div>
  );
}
