"use client";
import { Leaf, LogOut, LucideProps } from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import SidebarNavList from "@/app/components/sidebar_nav_list";
import SidebarNavSkeleton from "@/app/components/sidebar_navList_skeleton";
import Logo from "@/app/components/logo";

type Props = {
  isSidebarOpen: boolean;
  data: {
    title: string;
    label: {
      id: string;
      name: string;
      icon: ForwardRefExoticComponent<
        Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
      >;
    }[];
  }[];
};

function Sibar({ isSidebarOpen, data }: Props) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
      router.push("/");
      router.refresh();
      window.location.reload();
    } catch (error) {
      console.error("Failed to logout", error);
      // Optionally, handle logout error
    }
  };

  return (
    <div>
      <div
        className={`h-screen bg-[#1a202c] text-white  transition-all duration-300 flex flex-col ${
          isSidebarOpen
            ? "translate-x-0 w-70"
            : "-translate-x-full w-0 overflow-hidden"
        }`}
      >
        <div className="flex items-center justify-center w-full h-[80px] border-b-1 border-gray-600">
          <div className="text-center mb-4 flex justify-center mt-5">
            <Logo />
          </div>
        </div>
        <div className="flex-1 mt-5 overflow-y-auto">
          <Suspense fallback={SidebarNavSkeleton({ data })}>
            <SidebarNavList data={data} />
          </Suspense>
        </div>
        <div className="flex items-center w-full h-[50px] border-t-1 border-gray-600 px-7  ">
          <span className="text-xl font-bold  ml-auto">
            <button
              type="button"
              onClick={handleLogout}
              className="hover:cursor-pointer"
            >
              <LogOut size={25} />
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}

export default Sibar;
