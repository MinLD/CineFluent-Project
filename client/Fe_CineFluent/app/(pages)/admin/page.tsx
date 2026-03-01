import { Suspense } from "react";
import AdminPage from "@/app/components/admin/admin_page";
import UsersSection from "@/app/components/admin/wrappers/UsersSection";
import Skeleton from "react-loading-skeleton";
import CategoriesSection from "@/app/components/admin/wrappers/CategoriesSection";
import DashBoardSection from "@/app/components/admin/wrappers/DashBoardSection";
import ManagementVideoSection from "@/app/components/admin/wrappers/ManagementSkillSection";
import VideosSection from "@/app/components/admin/wrappers/VideosSection";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

async function AdminContentResolver({ searchParams }: { searchParams: any }) {
  const params = await searchParams;
  const currentTab = params.tab || "Users_Management";

  switch (currentTab) {
    case "Users_Management":
      return <UsersSection />;

    case "Categories_Management":
      return <CategoriesSection />;

    case "Phim_Management":
      return <VideosSection />;

    case "Categories_Management_Details":
      return (
        <ManagementVideoSection
          categoryId={(params.id as string) || ""}
          nameCategory={(params.name as string) || ""}
        />
      );

    case "Dashboard":
    default:
      return <DashBoardSection />;
  }
}

export default async function Page(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;

  return (
    <AdminPage>
      <Suspense
        fallback={
          <div className="p-4 flex flex-col gap-4">
            <Skeleton height={40} width={200} />
            <Skeleton count={3} height={100} />
          </div>
        }
      >
        <AdminContentResolver searchParams={searchParams} />
      </Suspense>
    </AdminPage>
  );
}
