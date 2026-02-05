import { I_pagination } from "./stores";

export interface I_Subtitle {
  id: number;
  start_time: number;
  end_time: number;
  content_en: string;
  content_vi: string | null;
}

export interface I_Video {
  id: number;
  youtube_id?: string;
  title: string;
  description?: string;
  source_type: string;
  source_url: string;
  thumbnail_url: string;
  category_id?: number;
  level: string;
  duration?: number;
  view_count: number;
  like_count?: number;
  comment_count?: number;
  subtitles?: I_Subtitle[];
  category?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface I_Videos_Data {
  videos: I_Video[];
  pagination: I_pagination;
}
