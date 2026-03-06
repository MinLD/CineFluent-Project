import MySlider from "@/app/components/my_slide";
import { fadeInUp } from "@/app/lib/Animation";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Gamepad2,
  BookOpenCheck,
  Headphones,
  Subtitles,
  LucideIcon,
} from "lucide-react";
import { SwiperSlide } from "swiper/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface I_Step {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
  gradientColor: string;
  image?: string;
  href?: string;
}

const HowItWork = () => {
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

  const STEPS_DATA: I_Step[] = [
    {
      id: 1,
      title: "1. Xem Phim & Phụ đề thông minh",
      description:
        "Tận hưởng hàng ngàn bộ phim bom tấn. Click trực tiếp vào phụ đề để tra từ điển tức thì bằng AI.",
      icon: Subtitles,
      gradientColor: "from-blue-500 to-indigo-600",
      image: "/image_root/Video_SongNgu.png",
      href: "/studies/movies",
    },
    {
      id: 2,
      title: "2. Luyện Nghe & Gõ chủ động",
      description:
        "Nghe lại từng đoạn hội thoại, gõ lại câu thoại (Dictation) và luyện phát âm với hệ thống chấm điểm AI trực tiếp.",
      icon: Headphones,
      gradientColor: "from-indigo-500 to-purple-600",
      image: "/image_root/video_nghechep.png",
      href: "/studies/movies",
    },
    {
      id: 3,
      title: "3. Flashcards & Bài tập AI",
      description:
        "Lưu từ vựng yêu thích vào Flashcards. AI Gemini sẽ tự động tạo bài tập điền từ, dịch câu để bạn ôn luyện.",
      icon: BookOpenCheck,
      gradientColor: "from-purple-500 to-pink-600",
      image: "/image_root/flaskcart_thi.png",
      href: "/flashcards",
    },
    {
      id: 4,
      title: "4. Đua Top Typing Game",
      description:
        "Luyện gõ tiếng Anh siêu tốc qua các màn chơi Solo hoặc thi đấu Multiplayer trên các chủ đề do AI sinh ra.",
      icon: Gamepad2,
      gradientColor: "from-orange-400 to-red-500",
      image: "/image_root/typing.png",
      href: "/studies/games",
    },
    {
      id: 5,
      title: "5. Video Call 1:1 cùng AI gợi ý",
      description:
        "Kết nối luyện nói trực tiếp với bạn bè hoặc giáo viên. AI sẽ theo dõi ngữ cảnh và gợi ý chủ đề nói tiếp theo.",
      icon: MessageCircle,
      gradientColor: "from-emerald-400 to-teal-600",
      image: "",
      href: "", // Coming soon
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
            Hành trình 5 bước để làm chủ tiếng Anh một cách tự nhiên và thú vị
            nhất.
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
              <div
                className="text-center px-4 pb-8 cursor-pointer"
                onClick={() => handleCardClick(step.href)}
              >
                {/* Mobile Visual Side - Mockup */}
                <div className="w-full flex justify-center mb-8 relative perspective-[1000px]">
                  <div className="relative w-full max-w-sm aspect-[16/10] rounded-2xl bg-slate-100 shadow-xl overflow-hidden border border-slate-200 flex flex-col mx-auto">
                    {/* Fake Browser/App Header */}
                    <div className="h-6 w-full bg-slate-200/80 flex items-center px-3 gap-1.5 border-b border-slate-300">
                      <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                      <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    </div>

                    {/* Content Area */}
                    <div
                      className={`flex-1 relative overflow-hidden bg-gradient-to-br ${step.gradientColor}`}
                    >
                      {step.image ? (
                        <div className="w-full h-full relative group-hover:scale-105 transition-transform duration-700">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={step.image}
                            alt={step.title}
                            className="w-full h-full object-cover object-top"
                          />
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300"></div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center relative">
                          <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>
                          <IconComponent
                            className="w-12 h-12 text-white mb-2 drop-shadow-md z-10"
                            strokeWidth={1.5}
                          />
                          <span className="text-white/90 font-bold text-xs mb-1 text-center px-2 shadow-sm z-10">
                            Demo: {step.title.substring(3)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Mobile Badge Number */}
                    <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-lg font-black text-slate-800 border-4 border-slate-50 z-20">
                      {step.id}
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent inline-block mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            </SwiperSlide>
          );
        })}
      </MySlider>{" "}
      {/* Desktop Layout - Zigzag or Grid */}
      <div className="hidden md:block max-w-6xl mx-auto px-4 md:px-8">
        <div className="relative border-l-4 border-slate-100 ml-6 md:ml-0 md:border-none space-y-12">
          {STEPS_DATA.map((step, index) => {
            const IconComponent = step.icon;
            const isEven = index % 2 === 0;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"} items-center gap-8 md:gap-16 group`}
              >
                {/* Visual Side */}
                <div className="flex-1 w-full flex justify-center mt-6 md:mt-0 relative group perspective-[1000px]">
                  <motion.div
                    onClick={() => handleCardClick(step.href)}
                    whileHover={{
                      scale: 1.02,
                      rotateY: isEven ? -5 : 5,
                      rotateX: 2,
                    }}
                    className="relative w-full max-w-lg aspect-[16/10] rounded-2xl md:rounded-3xl bg-slate-100 shadow-2xl overflow-hidden border border-slate-200 flex flex-col cursor-pointer"
                  >
                    {/* Fake Browser/App Header */}
                    <div className="h-8 md:h-10 w-full bg-slate-200/80 flex items-center px-4 gap-2 border-b border-slate-300">
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-rose-400"></div>
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-amber-400"></div>
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-emerald-400"></div>
                    </div>

                    {/* Content Area */}
                    <div
                      className={`flex-1 relative overflow-hidden bg-gradient-to-br ${step.gradientColor}`}
                    >
                      {step.image ? (
                        <div className="w-full h-full relative group-hover:scale-105 transition-transform duration-700">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={step.image}
                            alt={step.title}
                            className="w-full h-full object-cover object-top"
                          />
                          <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300"></div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center group-hover:brightness-110 transition-all relative">
                          <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>
                          <IconComponent
                            className="w-16 h-16 md:w-20 md:h-20 text-white mb-4 drop-shadow-lg z-10"
                            strokeWidth={1.5}
                          />
                          <span className="text-white/90 font-bold text-sm md:text-lg mb-2 text-center px-4 shadow-sm z-10">
                            Demo: {step.title.substring(3)}
                          </span>
                          <span className="text-white/70 text-xs md:text-sm text-center px-4 z-10">
                            (Thay thế khối này bằng thẻ{" "}
                            <code>&lt;img src="..." /&gt;</code>)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Badge Number */}
                    <div
                      className={`absolute -top-4 ${isEven ? "-left-4" : "-right-4"} w-10 h-10 md:w-14 md:h-14 rounded-full bg-white shadow-xl flex items-center justify-center text-xl md:text-2xl font-black text-slate-800 border-4 border-slate-50 z-20`}
                    >
                      {step.id}
                    </div>
                  </motion.div>
                </div>

                {/* Text Side */}
                <div
                  className={`flex-1 space-y-4 ${isEven ? "md:text-left" : "md:text-right"} text-center`}
                >
                  <h3
                    className={`text-2xl md:text-3xl font-bold bg-gradient-to-r ${step.gradientColor} bg-clip-text text-transparent inline-block pb-1`}
                  >
                    {step.title.substring(3)}
                  </h3>
                  <p className="text-lg text-slate-600 leading-relaxed max-w-lg mx-auto md:mx-0">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </>
  );
};
export default HowItWork;
