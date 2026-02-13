import BannerCarousel from "@/app/components/movies/BannerCarousel";
import { ExploreButton } from "@/app/components/movies/ExploreButton";
import { FilterSection } from "@/app/components/movies/FilterSection";
import { HeroSection } from "@/app/components/movies/HeroSection";
import { MovieCardSkeleton } from "@/app/components/movies/MovieCardSkeleton";
import { PlatformSection } from "@/app/components/movies/PlatformSection";
import { I_categories_data } from "@/app/lib/types/categories";
import { Film, Youtube } from "lucide-react";

const MoviePage = ({
  categories,
  slots,
}: {
  categories: I_categories_data;
  slots: React.ReactNode;
}) => {
  return (
    <div className="min-h-screen bg-slate-900">
     <BannerCarousel/>

      {/* Filters */}
      <div className="container mx-auto px-4 py-8">
        <FilterSection categorie_data={categories} />

        {/* Platform Sections */}
        <div className="mt-12 space-y-8">
          {/* YouTube Videos Section */}
          <PlatformSection
            title="YouTube Videos"
            icon={<Youtube className="w-6 h-6" />}
            description="Video học tiếng Anh từ YouTube được phân tích bởi AI"
            iconColor="text-red-500"
            accentColor="from-red-500/20 to-pink-500/20"
          >
            {slots}
          </PlatformSection>

          {/* Movies Section (Skeleton) */}
          <PlatformSection
            title="Movies & TV Shows"
            icon={<Film className="w-6 h-6" />}
            description="Phim và chương trình truyền hình từ các nền tảng khác (Đang tải...)"
            iconColor="text-purple-500"
            accentColor="from-purple-500/20 to-blue-500/20"
          >
            {/* Show 10 skeleton cards */}
            {Array.from({ length: 10 }).map((_, index) => (
              <MovieCardSkeleton key={index} />
            ))}
          </PlatformSection>
        </div>
      </div>
    </div>
  );
};
export default MoviePage;
