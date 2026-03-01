// constants/site.ts

import { Award, HandHeart, Users } from "lucide-react";

export const siteTitleFooter = [
  {
    id: 0,
    title: "Học tập",
    children: [
      { id: 0, href: "/studies/movies", label: "Phim ảnh" },
      { id: 1, href: "/vocabulary", label: "Từ vựng" },
      { id: 2, href: "/grammar", label: "Ngữ pháp" },
      { id: 3, href: "/challenges", label: "Thử thách" },
    ],
  },
  {
    id: 1,
    title: "Về CineFluent",
    children: [
      { id: 4, href: "/about", label: "Giới thiệu" },
      { id: 5, href: "/features", label: "Tính năng" },
      { id: 6, href: "/terms", label: "Điều khoản sử dụng" },
      { id: 7, href: "/privacy", label: "Chính sách bảo mật" },
    ],
  },
];

export const introduction_banner = [
  {
    id: 1,
    icon: Users,
    title: "Trình phát Video thông minh",
    description:
      "Xem phim với phụ đề tương tác. Nhấp vào bất kỳ từ nào để dịch và lưu vào flashcard ngay lập tức.",
  },
  {
    id: 2,
    icon: HandHeart,
    title: "Game nhiều người",
    description:
      "Tham gia Arcade Mode cho câu đố nhanh hoặc Cinema Room để xem cùng nhau. Thi đấu với bạn bè và lên cấp!",
  },
  {
    id: 3,
    icon: Award,
    title: "Học tập với AI ",
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
