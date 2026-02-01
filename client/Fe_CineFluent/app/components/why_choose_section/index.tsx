"use client";

import { Check } from "lucide-react";
import Image from "next/image";
import bn from "@/public/img/banner8.png";
import { motion } from "framer-motion";
import { introduction_banner } from "@/app/lib/constants/site";

export default function WhyChooseSection() {
  const features = [
    {
      title: "Hệ thống công bằng",
      desc: "Mỗi người học kiếm điểm như nhau - xem phim, trả lời câu hỏi, lên cấp tự nhiên",
    },
    {
      title: "Miễn phí bắt đầu",
      desc: "Không cần thanh toán. Học từ hàng ngàn bộ phim và thi đấu với người chơi toàn cầu",
    },
    {
      title: "Trò chơi miễn AI",
      desc: "Câu hỏi thông minh được tạo từ cảnh phim theo thời gian thực. Mỗi trò chơi đều độc đáo!",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 50 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, type: "spring" }}
    >
      <section className="w-full">
        {/* Main content section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
          className="mx-auto rounded-[2rem] bg-slate-50 p-6 md:p-12 lg:p-16"
        >
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900 md:text-3xl lg:text-4xl">
                Tại sao chọn Cinefluent?
              </h2>

              <div className="space-y-6">
                {features.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                    className="flex items-start gap-4"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500 shadow-sm mt-1">
                      <Check className="h-4 w-4 text-white" strokeWidth={3} />
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 md:text-base">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <Image
                src={bn}
                alt="Cinefluent Learning Platform"
                width={400}
                height={300}
                className="object-contain drop-shadow-2xl rounded-xl w-full h-auto"
              />
            </motion.div>
          </div>
        </motion.div>
      </section>
    </motion.div>
  );
}
