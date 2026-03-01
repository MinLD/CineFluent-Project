import VideoFetcher from "@/app/components/fetcher_components/videoFetcher";
import BannerCarousel from "@/app/components/movies/BannerCarousel";
import { ExploreButton } from "@/app/components/movies/ExploreButton";
import { HeroSection } from "@/app/components/movies/HeroSection";

import { PlatformSection } from "@/app/components/movies/PlatformSection";
import { I_categories_data } from "@/app/lib/types/categories";
import { Film, Youtube } from "lucide-react";

const MoviePage = ({
  categories,
  youtubeSlot,
  localSlot,
  top5Slot,
  bannerSlot,
}: {
  categories: I_categories_data;
  youtubeSlot: React.ReactNode;
  localSlot: React.ReactNode;
  top5Slot: React.ReactNode;
  bannerSlot: React.ReactNode;
}) => {
  return (
    <div className="min-h-screen bg-slate-900">
      {bannerSlot}

      {/* Top 5 Phim Mới Section */}
      <div className="container mx-auto px-4 py-8">
        <PlatformSection
          title="Top 5 Phim Mới"
          icon
          description="Khám phá ngay những siêu phẩm mới nhất"
          iconColor="text-yellow-500"
          accentColor="from-yellow-500/20 to-orange-500/20"
        >
          {top5Slot}
        </PlatformSection>

        <div className="flex space-x-2 justify-between items-center mt-12 mb-6">
          <button className="px-6 py-2.5 rounded-full text-sm font-semibold bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-all">
            Youtube
          </button>
          <HeroSection />
        </div>

        {/* Platform Sections */}
        <div className="space-y-16">
          {/* YouTube Videos Section */}
          <PlatformSection
            title="YouTube English Learning"
            icon={<Youtube className="w-6 h-6" />}
            description="Luyện nghe thông qua video YouTube chuyên sâu"
            iconColor="text-red-500"
            accentColor="from-red-500/20 to-pink-500/20"
          >
            {youtubeSlot}
          </PlatformSection>

          {/* Local Content Section */}
          <PlatformSection
            title="Movies Collection"
            icon={<Film className="w-6 h-6" />}
            description="Kho lưu trữ phim lẻ và truyền hình đa dạng"
            iconColor="text-purple-500"
            accentColor="from-purple-500/20 to-blue-500/20"
          >
            {localSlot}
          </PlatformSection>
        </div>
      </div>
    </div>
  );
};
export default MoviePage;
