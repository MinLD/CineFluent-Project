"use client";

import { useState } from "react";
import { Search, Youtube, HardDrive, Globe } from "lucide-react";
import { I_categories_data } from "@/app/lib/types/categories";

interface FilterSectionProps {
  categorie_data: I_categories_data;
}

export function FilterSection({ categorie_data }: FilterSectionProps) {
  const [search, setSearch] = useState("");
  const [selectedSource, setSelectedSource] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const sourceTypes = [
    { id: "all", label: "Tất cả", icon: null },
    { id: "youtube", label: "YouTube", icon: Youtube },
    { id: "drive", label: "Drive", icon: HardDrive },
    { id: "local", label: "Web", icon: Globe },
  ];

  return (
    <div className="space-y-6 mb-8">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm video..."
          className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Source Type Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sourceTypes.map((source) => {
          const Icon = source.icon;
          return (
            <button
              key={source.id}
              onClick={() => setSelectedSource(source.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                selectedSource === source.id
                  ? "bg-blue-500 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {source.label}
            </button>
          );
        })}
      </div>

      {/* Category Chips */}
      {categorie_data?.categories?.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              selectedCategory === null
                ? "bg-purple-500 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            All Categories
          </button>
          {categorie_data?.categories?.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(Number(category.id))}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                Number(selectedCategory) === Number(category.id)
                  ? "bg-purple-500 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
