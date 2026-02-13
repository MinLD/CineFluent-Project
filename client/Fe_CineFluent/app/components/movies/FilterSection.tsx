"use client";

import { useState } from "react";
import { I_categories_data } from "@/app/lib/types/categories";
import { HeroSection } from "@/app/components/movies/HeroSection";

interface FilterSectionProps {
  categorie_data: I_categories_data;
}

export function FilterSection({ categorie_data }: FilterSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  return (
    <div className="space-y-6 mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Category Chips */}
        <div className="flex-1">
          {categorie_data?.categories?.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition  ${
                  selectedCategory === null
                    ? "bg-blue-500 text-white shadow-lg shadow-purple-500/25"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                }`}
              >
                Tất cả
              </button>
              {categorie_data?.categories?.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(Number(category.id))}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    Number(selectedCategory) === Number(category.id)
                      ? "bg-blue-500 text-white shadow-lg shadow-purple-500/25"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Import Button (HeroSection) */}
        <div className="flex-shrink-0 w-full md:w-auto">
          <HeroSection />
        </div>
      </div>
    </div>
  );
}
