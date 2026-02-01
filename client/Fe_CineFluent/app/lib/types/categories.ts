import { I_pagination } from "@/app/lib/types/stores";

export interface I_category {
  id: string;
  name: string;
  description: string;
  slug: string;
  avatar_url: string | null;
}

export interface I_skill {
  id: string;
  name: string;
  description: string;
  category_id: string;
  avatar_url: string | null;
}

export interface I_skills_user {
  id: string;
  skill_id: string;
  level: string;
  proof_link: string;
  user_id: string;
  skill: I_skill;
  avatar_url: string | null;
}
export interface I_skills_data {
  skills: I_skill[];
  pagination: I_pagination;
}
export interface I_categories_data {
  categories: I_category[];
  pagination: I_pagination;
}
