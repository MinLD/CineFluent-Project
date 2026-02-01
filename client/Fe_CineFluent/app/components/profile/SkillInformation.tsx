"use client";

import {
  User,
  Zap,
  Crown,
  Shield,
  Facebook,
  Github,
  Linkedin,
  ExternalLink,
  Plus,
  Edit,
  Eye,
  Camera,
  Search,
} from "lucide-react";
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Upload,
  Empty,
  Spin,
} from "antd";
import { Badge } from "@/app/components/profile_tabs";
import { I_skills_user, I_category } from "@/app/lib/types/categories";
import Image from "next/image";
import { useState } from "react";

import { useRouter } from "next/navigation";
import { CreateSkill } from "@/app/components/profile/skill/CreateSkill";
import Link from "next/link";
import { UpdateSkill } from "@/app/components/profile/skill/UpdateSkill";

interface SkillInformationProps {
  initialSkills?: I_skills_user[];
  categories?: I_category[];
}

export const SkillInformation = ({
  initialSkills = [],
  categories = [],
}: SkillInformationProps) => {
  // -- States for Modals --
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [isUpdateProofModalOpen, setIsUpdateProofModalOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<I_skills_user | null>(
    null
  );

  // -- States for Data & Form --
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(
    null
  );

  // -- Handlers --

  const handleOpenProof = (avatarUrl: string) => {
    setSelectedAvatarUrl(avatarUrl);
    setIsProofModalOpen(true);
  };

  const handleOpenUpdateProof = (skill: I_skills_user) => {
    setSelectedSkill(skill);
    setIsUpdateProofModalOpen(true);
  };

  return (
    <div>
      <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center items-start gap-5 mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Kỹ năng chuyên môn
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            Quản lý các kỹ năng và minh chứng năng lực của bạn
          </p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={18} />}
          className="bg-blue-600 hover:bg-blue-700 font-medium h-10 px-5 rounded-lg shadow-sm shadow-blue-200"
          onClick={() => setIsAddSkillModalOpen(true)}
        >
          Thêm kỹ năng
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {initialSkills.length === 0 ? (
          <Empty description="Chưa có kỹ năng nào. Hãy thêm kỹ năng mới!" />
        ) : (
          initialSkills.map((skill) => (
            <div
              key={skill.skill_id}
              className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all bg-white relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-center gap-4 mb-3 sm:mb-0">
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <Image
                    src={skill.skill.avatar.secure_url}
                    alt={skill.skill.name}
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">
                    {skill.skill.name}
                  </h4>
                  <Badge level={skill.level || "beginner"} />
                </div>
              </div>

              <div className="flex sm:items-center flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
                {skill.avatar ? (
                  <>
                    <Button
                      icon={<Eye size={16} />}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 flex items-center gap-2"
                      onClick={() => handleOpenProof(skill.avatar.secure_url)}
                    >
                      Xem minh chứng
                    </Button>
                  </>
                ) : (
                  <span className="text-sm text-gray-400 italic px-3 py-1 bg-gray-50 rounded-md border border-gray-100">
                    <span className="text-red-500">*</span> Chưa có minh chứng
                  </span>
                )}
                <Button
                  icon={<Edit size={16} />}
                  className="text-blue-600 hover:text-blue-600 bg-red-400"
                  onClick={() => handleOpenUpdateProof(skill)}
                >
                  Cập nhật
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- MODAL: VIEW PROOF --- */}
      <Modal
        open={isProofModalOpen}
        onCancel={() => setIsProofModalOpen(false)}
        footer={null}
        title="Minh chứng năng lực"
        centered
        width={800}
        className="p-0"
      >
        <div className="relative w-full h-[60vh] bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
          {selectedAvatarUrl ? (
            <Link href={selectedAvatarUrl || ""} target="_blank">
              <Image
                width={800}
                height={600}
                src={selectedAvatarUrl || ""}
                alt="Proof"
                className="max-w-full max-h-full object-contain"
              />
            </Link>
          ) : (
            <Empty description="Không có ảnh" />
          )}
        </div>
      </Modal>

      {/* --- MODAL: ADD SKILL --- */}
      <CreateSkill
        isAddSkillModalOpen={isAddSkillModalOpen}
        setIsAddSkillModalOpen={setIsAddSkillModalOpen}
        categories={categories}
      />
      <UpdateSkill
        isUpdateSkillModalOpen={isUpdateProofModalOpen}
        setIsUpdateSkillModalOpen={setIsUpdateProofModalOpen}
        skill={selectedSkill!}
      />
    </div>
  );
};
