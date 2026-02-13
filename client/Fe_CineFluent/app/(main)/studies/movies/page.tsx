import { MovieCardSkeleton } from "@/app/components/movies/MovieCardSkeleton";
import { SSR_Categories } from "@/app/lib/data/categories";
import MoviePage from "@/app/components/movies/movie_page";
import VideoFetcher from "@/app/components/fetcher_components/videoFetcher";
import { Suspense } from "react";
export const dynamic = "force-dynamic";

export default async function page() {
  // Fetch only categories - videos will be fetched by VideoFetcher
  const categories = await SSR_Categories();

  return (
    <MoviePage
      categories={categories}
      slots={
        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <MovieCardSkeleton key={index} />
              ))}
            </div>
          }
        >
          <VideoFetcher />
        </Suspense>
      }
    />
  );
}
