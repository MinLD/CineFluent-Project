// constants/site.ts

import {
  Award,
  HandHeart,
  Users,
  BookImage,
  CheckCircleIcon,
  HandCoins,
  UserCog,
  Video,
  Gamepad2,
} from "lucide-react";

export const siteTitleFooter = [
  {
    id: 0,
    title: "Học tập",
    children: [
      { id: 0, href: "/studies/movies", label: "Phim ảnh" },
      { id: 1, href: "/flashcards", label: "Từ vựng" },
      { id: 2, href: "/studies/games", label: "Học qua game" },
      { id: 3, href: "/request-movie", label: "Yêu cầu phim" },
    ],
  },
  {
    id: 1,
    title: "Về CineFluent",
    children: [
      { id: 4, href: "/", label: "Giới thiệu" },
      { id: 5, href: "/", label: "Tính năng" },
      { id: 6, href: "/", label: "Điều khoản sử dụng" },
      { id: 7, href: "/", label: "Chính sách bảo mật" },
    ],
  },
];

export const introduction_banner = [
  {
    id: 1,
    icon: Video,
    title: "Xem Phim & Khám Phá",
    description:
      "Tuyển tập hàng ngàn phim bom tấn song ngữ. Click vào phụ đề để tra từ điển tức thì nhờ công nghệ AI.",
    href: "/studies/movies",
  },
  {
    id: 2,
    icon: BookImage,
    title: "Flashcards & Luyện Tập AI",
    description:
      "Lưu từ vựng trực tiếp lúc xem phim và để Gemini AI tự động tạo bài tập điền từ, dịch câu ôn luyện cho riêng bạn.",
    href: "/flashcards",
  },
  {
    id: 3,
    icon: Gamepad2,
    title: "Chơi Game & Cọ Xát",
    description:
      "Tăng cường phản xạ tiếng Anh qua Typing Game siêu tốc hoặc tham gia Video Call 1:1 với bạn bè do AI gợi ý chủ đề.",
    href: "/studies/games",
  },
];

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
  {
    title: "Phản hồi người dùng",
    label: [
      {
        id: "Requests_Management",
        name: "Yêu cầu phim",
        icon: Video,
      },
      {
        id: "Reports_Management",
        name: "Báo lỗi video",
        icon: CheckCircleIcon,
      },
    ],
  },
  {
    title: "Trò chơi & Học tập",
    label: [
      {
        id: "Typing_Game_Management",
        name: "Quản lý Typing Game",
        icon: Award,
      },
    ],
  },
];
