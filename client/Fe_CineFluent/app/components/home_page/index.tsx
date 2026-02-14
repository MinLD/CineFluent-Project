"use client";

import { motion } from "framer-motion";

import MyLayout from "@/app/layout/index";
import { introduction_banner } from "@/app/lib/constants/site";
import WhyChooseSection from "@/app/components/why_choose_section";
import { fadeInUp, staggerContainer } from "@/app/lib/Animation";
import Banner from "@/app/components/banner";
import HowItWork from "@/app/components/how_it_work";
type prop = {
  slots?: React.ReactNode;
};
function HomePages({ slots }: prop) {
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
          className="md:grid grid-cols-3 hidden gap-8" // Thêm gap-8 cho thoáng
        >
          {introduction_banner &&
            introduction_banner.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.id}
                  variants={fadeInUp} // Kế thừa hiệu ứng trồi lên
                  className="text-center group" // Thêm class group để hover
                >
                  {/* Icon Container: Thêm hiệu ứng Scale khi hover */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }} // Phóng to và xoay nhẹ
                    transition={{ type: "spring", stiffness: 300 }}
                    className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20"
                  >
                    <Icon className="w-9 h-9 text-white" />
                  </motion.div>

                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                    {item.id}. {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-4 sm:px-0">
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
        </motion.div>

        <WhyChooseSection />

        {/* <div className="mt-16">{slots}</div> */}
      </MyLayout>
    </>
  );
}

export default HomePages;
