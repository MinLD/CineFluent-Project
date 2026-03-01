// constants/site.ts

import { Award, HandHeart, Users } from "lucide-react";

export const siteTitleFooter = [
  {
    id: 0,
    title: "Dành cho người dùng",
    children: [
      { id: 0, href: "/", label: "Duyệt thử thách" },
      { id: 1, href: "/", label: "Nó hoạt động như thế nào" },
      { id: 2, href: "/", label: "Phần thưởng" },
      { id: 3, href: "/", label: "Hồ sơ của tôi" },
    ],
  },
  {
    id: 1,
    title: "Dành cho doanh nghiệp",
    children: [
      { id: 4, href: "/", label: "Tạo thử thách" },
      { id: 5, href: "/", label: "Giải pháp CSR" },
      { id: 6, href: "/", label: "Báo cáo tác động" },
      { id: 7, href: "/", label: "Giá cả" },
    ],
  },
];

export const introduction_banner = [
  {
    id: 1,
    icon: Users,
    title: "Trình phát Video thông minh 🎬",
    description:
      "Xem phim với phụ đề tương tác. Nhấp vào bất kỳ từ nào để dịch và lưu vào flashcard ngay lập tức.",
  },
  {
    id: 2,
    icon: HandHeart,
    title: "Game nhiều người 🎮",
    description:
      "Tham gia Arcade Mode cho câu đố nhanh hoặc Cinema Room để xem cùng nhau. Thi đấu với bạn bè và lên cấp!",
  },
  {
    id: 3,
    icon: Award,
    title: "Học tập với AI 🤖",
    description:
      "Gemini AI giải thích ngữ cảnh từ, tạo flashcard thông minh với spaced repetition và cá nhân hóa hành trình của bạn.",
  },
];

import {
  BookImage,
  CheckCircleIcon,
  HandCoins,
  UserCog,
  Video,
} from "lucide-react";

export const data_sibar_admin = [
  {
    title: "Quản lý người dùng",
    label: [
      { id: "Users_Management", name: "Quản lý người dùng", icon: UserCog },
    ],
  },
  {
    title: "Quản lý nội dung",
    label: [
      {
        id: "Categories_Management",
        name: "Danh mục phim",
        icon: Video,
      },
      {
        id: "Phim_Management",
        name: "Quản lý Phim",
        icon: BookImage,
      },
    ],
  },
];
