"use client";

import { motion } from "framer-motion";

import MyLayout from "@/app/layout/index";
import { introduction_banner } from "@/app/lib/constants/site";
import { fadeInUp, staggerContainer } from "@/app/lib/Animation";
import Banner from "@/app/components/banner";
import HowItWork from "@/app/components/how_it_work";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type prop = {
  slots?: React.ReactNode;
};
function HomePages({ slots }: prop) {
  const router = useRouter();

  const handleCardClick = (href?: string) => {
    if (href) {
      router.push(href);
    } else {
      toast.info(
        "Tính năng này đang được phát triển. Vui lòng quay lại sau nhé! 🚀",
        {
          position: "top-center",
        },
      );
    }
  };

  return (
    <>
      <Banner />
      <MyLayout>
        <HowItWork />
      </MyLayout>
    </>
  );
}

export default HomePages;
