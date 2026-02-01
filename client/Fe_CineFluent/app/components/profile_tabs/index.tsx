"use client";

import { useState } from "react";

export interface TabItem {
  id: string;
  label: string;
  icon: any;
  content: React.ReactNode;
}

type ProfileTabsProps = {
  items: TabItem[];
};

export default function ProfileTabs({ items }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState(items[0]?.id || "");

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
      {/* 1. Header Tabs Navigation */}
      <div className="border-b border-gray-100 overflow-x-auto scrollbar-hide">
        <div className="flex p-2 gap-2 min-w-max">
          {items.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <tab.icon
                  size={18}
                  className={isActive ? "text-blue-600" : "text-gray-400"}
                />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Tabs Content */}
      <div className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {items.map((item) => {
          if (item.id !== activeTab) return null;
          return <div key={item.id}>{item.content}</div>;
        })}
      </div>
    </div>
  );
}

export function Badge({ level }: { level: string }) {
  const styles: any = {
    Expert: "bg-purple-100 text-purple-700 border-purple-200",
    Intermediate: "bg-blue-100 text-blue-700 border-blue-200",
    Beginner: "bg-green-100 text-green-700 border-green-200",
  };
  return (
    <span
      className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        styles[level] || styles.Beginner
      }`}
    >
      {level}
    </span>
  );
}
