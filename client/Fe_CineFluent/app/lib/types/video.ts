import { I_pagination } from "./stores";

export interface I_Subtitle {
  id: number;
  start_time: number;
  end_time: number;
  content_en: string;
  content_vi: string | null;
  grammar_tag_id?: number | null;
  cloze_data?: any;
}

export interface I_Video_AI_Segment {
  scene_id: string;
  subtitle_text_clean: string;
  start_time: number;
  end_time: number;
  grammar_tag: string;
  grammar_tag_id: number;
  confidence: number;
  cloze_data?: any;
}

export interface I_Video_AI_Analysis {
  video_id?: number;
  video_title?: string;
  segment_count: number;
  movie_score: number;
  movie_level: "Beginner" | "Intermediate" | "Advanced" | string;
  movie_cefr_range: string;
  difficulty_ratios: Record<string, number>;
  cefr_ratios: Record<string, number>;
  dominant_grammar_tags: string[];
  grammar_distribution?: {
    tag_id: number;
    label: string;
    count: number;
    ratio: number;
  }[];
  top_hard_segments: I_Video_AI_Segment[];
  status?: "PROCESSING" | "READY" | "FAILED" | string;
  error_message?: string | null;
  predicted_segments?: I_Video_AI_Segment[];
  model_meta?: {
    model_name?: string;
    model_dir?: string;
    mode?: string;
  };
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
  user_history?: {
    last_position?: number;
    duration?: number;
    updated_at?: string;
  };
  ai_analysis?: I_Video_AI_Analysis | null;
  created_at: string;
  updated_at: string;
}

export interface I_Videos_Data {
  videos: I_Video[];
  pagination: I_pagination;
}
