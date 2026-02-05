"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";

interface ExploreButtonProps {
  href?: string;
  onClick?: () => void;
  text?: string;
}

export function ExploreButton({
  href,
  onClick,
  text = "KHÁM PHÁ",
}: ExploreButtonProps) {
  const buttonContent = (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 text-white hover:text-slate-300 transition-colors animate-bounce-slow"
    >
      <span className="text-[10px] font-medium tracking-[0.3em] uppercase">
        {text}
      </span>
      <ChevronDown className="w-5 h-5" color="#007aff" />
    </button>
  );

  if (href) {
    return <Link href={href}>{buttonContent}</Link>;
  }

  return buttonContent;
}
