import { I_pagination } from "@/app/lib/types/stores";
import { ComponentType, SVGProps } from "react";

export interface Ty_User {
  id: string;
  email: string;
  status: "active" | "banned" | "pending";
  profile: Ty_profile_User;
  roles: {
    name: string;
  }[];
}
export interface Ty_profile_User {
  bio: string;
  date_of_birth: string;
  fullname: string;
  id: string;
  is_online: boolean;
  phone: string;
  avatar_url: string | null;
  // Gamification fields for English learning
  english_level: "Beginner" | "Intermediate" | "Advanced";
  total_points: number;
  streak_days: number;
}
export interface DecodedToken {
  sub: string;
  scope?: string;
  iss: string;
  exp: number;
  iat: number;
  userId: string;
  jti: string;
  roles: string[];
}

export interface I_FormUser {
  email: string;
  password: string;
  role: string;
  fullname: string;
}

export interface I_data_users {
  pagination: I_pagination;
  users: Ty_User[];
}

export interface I_Form_Data_auth {
  email: string;
  password: string;
  confirmPassword?: string;
  name?: string;
}

export type I_Form_auth = {
  label: string;
  type: string;
  name: string;
  placeholder?: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export interface I_User_Stats_Summary {
  total: number;
  active: number;
  new_users: number;
  premium: number;
}
export interface I_User_Stats_ChartData {
  dates: string[];
  new_users: number[];
  active_users: number[];
}
export interface I_User_Stats {
  summary: I_User_Stats_Summary;
  chart_data: I_User_Stats_ChartData;
}
