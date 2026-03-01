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
  slug: string;

  runtime: number;
  backdrop_url?: string;
  imdb_id?: string;
  title: string;
  original_title?: string;
  description?: string;
  source_type: string;
  stream_url: string;
  source_url: string;
  thumbnail_url: string;
  level: string;
  author?: string;
  country?: string;
  release_year?: number;
  view_count: number;
  status: "public" | "private";
  comment_count?: number;
  subtitle_vtt_url?: string;
  subtitles?: I_Subtitle[];
  categories?: {
    id: number;
    name: string;
    slug: string;
  }[];
  created_at: string;
  updated_at: string;
}

export interface I_Videos_Data {
  videos: I_Video[];
  pagination: I_pagination;
}
