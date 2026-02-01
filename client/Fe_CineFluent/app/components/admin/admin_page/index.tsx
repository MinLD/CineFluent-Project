"use client";

import HeaderDashBoard from "@/app/components/header_dashboard";
import Sibar from "@/app/components/sibar";
import { data_sibar_admin } from "@/app/lib/constants/site";

import MyLayout from "@/app/layout/index";

import React, { useState } from "react";

type Props = {
  children?: React.ReactNode;
};
function AdminPage({ children }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  return (
    <MyLayout>
      <div className="flex h-screen overflow-x-hidden">
        {/* Sidebar */}
        <div
          className={`${
            isSidebarOpen ? "md:w-70 w-0" : "w-0"
          }   transition-all duration-300 fixed top-0 left-0 h-screen overflow-y-auto z-20`}
        >
          <Sibar
            isSidebarOpen={isSidebarOpen}
            data={data_sibar_admin.length ? data_sibar_admin : []}
          />
        </div>

        <div className={`md:hidden`}>
          <div
            className={`fixed inset-0 bg-gray-900 opacity-20 z-30 ${
              isSidebarOpen ? "block" : "hidden"
            }`}
            onClick={() => setIsSidebarOpen(false)}
          ></div>
          <div
            className={`fixed inset-0 z-30 transition-all duration-300  ${
              isSidebarOpen ? "translate-x-0 w-70" : "-translate-x-full"
            }`}
          >
            <Sibar
              isSidebarOpen={isSidebarOpen}
              data={data_sibar_admin.length ? data_sibar_admin : []}
            />
          </div>
        </div>
        {/* Nội dung chính */}
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${
            isSidebarOpen ? "md:ml-70 ml-0" : "ml-0"
          }`}
        >
          {/* Header: Cố định ở đầu */}
          <div
            className={`fixed top-0 ${
              isSidebarOpen ? "md:left-70 left-0" : "left-0"
            } right-0 z-10 bg-white shadow transition-all duration-300 `}
          >
            <HeaderDashBoard
              isOpenSibar={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          </div>

          {/* Nội dung chính: Cuộn độc lập */}
          <div className="pt-35 px-2  flex-1 overflow-y-auto mt-2">
            {children}
          </div>
        </div>
      </div>
    </MyLayout>
  );
}

export default AdminPage;
