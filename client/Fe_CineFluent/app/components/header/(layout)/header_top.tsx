"use client";
import Logo from "@/app/components/logo";
import UserAuthSection from "@/app/components/user_auth_section";
import { mainNavLinks } from "@/app/lib/constants/navigation";
import MyLayout from "@/app/layout/index";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useNav } from "@/app/lib/hooks/useNav";

function HeaderTop() {
  const { openHamsburg } = useNav();
  return (
    <MyLayout>
      <div className="flex h-14 items-center justify-between">
        <div className="flex-shrink-0">
          <Logo />
        </div>

        <nav className="hidden md:flex items-center space-x-8 flex-1 justify-center px-4">
          {mainNavLinks.map((link) => (
            <div className="relative group p-1" key={link.id}>
              <Link
                href={link.href}
                className="text-gray-600 font-medium text-sm transition-colors hover:text-black"
              >
                {link.label}
              </Link>
              <div
                className="absolute bottom-0 left-0 w-full h-[2px] bg-gray-600 rounded-full
                scale-x-0 origin-left 
                transition-transform duration-300 ease-out 
                group-hover:scale-x-100"
              />
            </div>
          ))}
        </nav>

        <div className="hidden md:flex w-[240px] justify-end">
          <UserAuthSection />
        </div>
        <div className="md:hidden">
          <div className="cursor-pointer sm:hidden" onClick={openHamsburg}>
            <Menu className="text-gray-700 dark:text-white" />
          </div>
        </div>
      </div>
    </MyLayout>
  );
}

export default HeaderTop;
