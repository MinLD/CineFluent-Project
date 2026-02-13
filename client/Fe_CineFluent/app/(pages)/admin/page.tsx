import { Suspense } from "react";
import AdminPage from "@/app/components/admin/admin_page";
import UsersSection from "@/app/components/admin/wrappers/UsersSection";
import Skeleton from "react-loading-skeleton";
import CategoriesSection from "@/app/components/admin/wrappers/CategoriesSection";
import DashBoardSection from "@/app/components/admin/wrappers/DashBoardSection";
import ManagementSkillSection from "@/app/components/admin/wrappers/ManagementSkillSection";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

async function AdminContentResolver({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { tab, categoryId, nameCategory } = await searchParams;
  const currentTab = tab || "Dashboard";
  const category_Id = Array.isArray(categoryId)
    ? categoryId[0]
    : categoryId || "";

  const category_Name = Array.isArray(nameCategory)
    ? nameCategory[0]
    : nameCategory || "";

  switch (currentTab) {
    case "Users_Management":
      return <UsersSection />;

    case "Categories_Management":
      return <CategoriesSection />;

    // Temporarily commented out - Backend changed: skill -> video
    // case "Skills_Management":
    //   return (
    //     <ManagementSkillSection
    //       categoryId={category_Id || ""}
    //       nameCategory={category_Name || ""}
    //     />
    //   );

    case "Dashboard":
    default:
      return <DashBoardSection />;
  }
}

export default function Page(props: { searchParams: SearchParams }) {
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
        <AdminContentResolver searchParams={props.searchParams} />
      </Suspense>
    </AdminPage>
  );
}
