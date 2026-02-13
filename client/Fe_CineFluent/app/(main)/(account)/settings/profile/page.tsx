import Profile_Page from "@/app/components/profile_page";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

async function page() {
  return (
    <>
      <Profile_Page />
    </>
  );
}

export default page;
