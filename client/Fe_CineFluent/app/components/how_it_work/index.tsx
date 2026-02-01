import MySlider from "@/app/components/my_slide";
import { fadeInUp } from "@/app/lib/Animation";
import { motion } from "framer-motion";
import { Award, LucideIcon, MonitorPlay, UserPlus } from "lucide-react";
import { SwiperSlide } from "swiper/react";
interface I_Step {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
  gradientColor: string;
}
const HowItWork = () => {
  const STEPS_DATA: I_Step[] = [
    {
      id: 1,
      title: "1. Đăng ký & Nhận Credit",
      description:
        "Tạo tài khoản và nhận 3 Credit miễn phí để bắt đầu hành trình học tập",
      icon: UserPlus,
      gradientColor: "from-green-500 to-green-600",
    },
    {
      id: 2,
      title: "2. Học hoặc Dạy",
      description:
        "Sử dụng Credit để học từ mentor hoặc chia sẻ kỹ năng để kiếm thêm Credit",
      icon: MonitorPlay,
      gradientColor: "from-blue-500 to-blue-600",
    },
    {
      id: 3,
      title: "3. Học trực tuyến",
      description:
        "Tham gia phòng học ảo với video call, whiteboard và chia sẻ màn hình",
      icon: Award,
      gradientColor: "from-yellow-500 to-yellow-600",
    },
  ];
  return (
    <>
      {/* How it work */}
      <div className="text-center mb-16 mt-15 sm:px-25">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="text-gray-600 text-lg"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Cách thức hoạt động
          </h2>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-gray-600 text-lg"
        >
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-2 sm:px-0">
            Hệ thống Time-Credit độc đáo giúp bạn trao đổi kỹ năng một cách công
            bằng và minh bạch
          </p>
        </motion.div>
      </div>

      {/* Slide */}
      <MySlider
        swiperOptions={{ slidesPerView: 1, navigation: false }}
        className="md:hidden cursor-pointer"
      >
        {STEPS_DATA.map((step) => {
          const IconComponent = step.icon;
          return (
            <SwiperSlide key={step.id}>
              <div className="text-center">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${step.gradientColor} rounded-full flex items-center justify-center mx-auto mb-6`}
                >
                  <IconComponent className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-4 sm:px-0">
                  {step.description}
                </p>
              </div>
            </SwiperSlide>
          );
        })}
      </MySlider>
      


    </>
  );
};
export default HowItWork;
