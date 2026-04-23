import { Clapperboard, Gamepad2, Home, LineChart, UsersRound } from "lucide-react";

export const mainNavLinks = [
  { id: 0, href: "/", label: "Trang chủ", icons: Home },
  {
    id: 1,
    href: "/studies/movies",
    label: "Học qua phim",
    icons: Clapperboard,
  },
  {
    id: 2,
    href: "/studies/roadmap",
    label: "Tiến trình học tập",
    icons: LineChart,
  },
  {
    id: 3,
    href: "/studies/classrooms",
    label: "Lớp học",
    icons: UsersRound,
  },
  { id: 4, href: "/studies/games", label: "Học qua game", icons: Gamepad2 },
];
