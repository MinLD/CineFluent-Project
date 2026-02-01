import CategoriesFetcher from "@/app/components/fetcher_components/CategoriesFetcher";
import HomePages from "@/app/components/home_page";
import { Suspense } from "react";

export default async function Home() {
  return (
    <div className="min-h-screen">
      <HomePages
      // slots={
      //   <Suspense fallback={<div>Loading...</div>}>
      //     <CategoriesFetcher />
      //   </Suspense>
      // }
      />
    </div>
  );
}
