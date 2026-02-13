import { Crown } from "lucide-react";
import Link from "next/link";

export default function VipButton() {
  return (
    <Link
      href="/pricing"
      className="group relative inline-flex items-center gap-2 overflow-hidden rounded-md bg-blue-600 bg-[length:200%_auto] px-3 py-2 transition-all duration-300 hover:bg-right hover:scale-105"
    >
      <Crown className="h-4 w-4 text-white transition-transform duration-300 group-hover:rotate-12" />
      <span className="hidden sm:block font-bold text-white text-sm uppercase tracking-wide">
        Mua Gói VIP
      </span>
    </Link>
  );
}
