// constants/navigation.ts

import { Clapperboard, Gamepad2, Home, Send, Sparkles } from "lucide-react";

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
    label: "Lộ trình AI",
    icons: Sparkles,
  },
  { id: 3, href: "/studies/games", label: "Học qua game", icons: Gamepad2 },
];
