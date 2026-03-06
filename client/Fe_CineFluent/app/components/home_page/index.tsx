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

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="md:grid grid-cols-3 hidden gap-8 mt-20 mb-32 px-4"
        >
          {introduction_banner &&
            introduction_banner.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.id}
                  variants={fadeInUp}
                  onClick={() => handleCardClick(item.href)}
                  className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 text-center group hover:-translate-y-2 transition-transform duration-300 cursor-pointer"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20"
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </motion.div>

                  <h3 className="text-xl font-bold text-slate-800 mb-4 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
        </motion.div>
      </MyLayout>
    </>
  );
}

export default HomePages;
