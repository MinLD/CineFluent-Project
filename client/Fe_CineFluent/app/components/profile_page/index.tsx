"use client";

import ProfileTabs, { TabItem } from "@/app/components/profile_tabs";
import ProfileSidebar from "@/app/components/profile_sidebar";
import {
  SidebarSkeleton,
  TabsSkeleton,
} from "@/app/lib/skeletons/ProfileSkeleton";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { User, Zap, Crown, Shield } from "lucide-react";
import { UserInformation } from "@/app/components/profile/UserInformation";
import { SkillInformation } from "@/app/components/profile/SkillInformation";
import MembershipTab from "@/app/components/profile/MembershipTab";
import SecurityTab from "@/app/components/profile/SecurityTab";
import { I_skills_user, I_category } from "@/app/lib/types/categories";

export default function ProfilePage() {
  const { profile_user, isLoading } = useAuth();

  const tabs: TabItem[] = [
    {
      id: "general",
      label: "Thông tin chung",
      icon: User,
      content: <UserInformation />,
    },

    {
      id: "membership",
      label: "Gói hội viên",
      icon: Crown,
      content: <MembershipTab />,
    },
    {
      id: "security",
      label: "Bảo mật",
      icon: Shield,
      content: <SecurityTab />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:hidden mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* CỘT TRÁI */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-24">
              {isLoading ? (
                <SidebarSkeleton />
              ) : profile_user ? (
                <ProfileSidebar />
              ) : null}
            </div>
          </div>

          {/* CỘT PHẢI */}
          <div className="lg:col-span-8 xl:col-span-9">
            {isLoading ? (
              <TabsSkeleton />
            ) : profile_user ? (
              <ProfileTabs items={tabs} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
