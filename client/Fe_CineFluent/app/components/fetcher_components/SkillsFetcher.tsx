import { SSR_Skills } from "@/app/lib/data/skills";
import { SSR_Categories } from "@/app/lib/data/categories";
import { SkillInformation } from "@/app/components/profile/SkillInformation";

export default async function SkillsFetcher() {
  const [skills, { categories }] = await Promise.all([
    SSR_Skills(),
    SSR_Categories(1, 100),
  ]);
  return <SkillInformation initialSkills={skills} categories={categories} />;
}


