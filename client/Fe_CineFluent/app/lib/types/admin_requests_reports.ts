import { I_pagination } from "@/app/lib/types/stores";

export interface I_MovieRequest {
  id: number;
  user_id: string;
  user_info: string;
  title: string;
  note: string;
  status: "PENDING" | "RESOLVED" | "REJECTED"; // adjust enum based on backend
  created_at: string;
}

export interface I_VideoReport {
  id: number;
  user_id: string;
  user_info: string;
  video_id: string;
  video_title: string;
  issue_type: "SUBTILE_ERROR" | "VIDEO_ERROR" | "AUDIO_ERROR" | "OTHER"; // adjust enum based on backend
  description: string;
  status: "PENDING" | "RESOLVED" | "REJECTED"; // adjust enum based on backend
  created_at: string;
}

export interface I_data_requests {
  requests: I_MovieRequest[] | null;
  pagination: I_pagination;
  
}

export interface I_data_reports {
  reports: I_VideoReport[] | null;
  pagination: I_pagination;
}
