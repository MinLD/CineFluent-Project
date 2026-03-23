export interface AssessmentQuestion {
  question: string;
  options: string[];
  answer: string;
}

export interface AssessmentQuizData {
  listening: {
    audio_script: string;
    questions: AssessmentQuestion[];
  };
  reading: {
    passage: string;
    questions: AssessmentQuestion[];
  };
  writing: {
    topic: string;
    min_words: number;
  };
  speaking: {
    prompt: string;
  };
}

export interface AssessmentUserAnswers {
  listening: string[];
  reading: string[];
  writing: string;
  speaking: string;
}

export interface AssessmentReviewItem {
  index: number;
  question: string;
  options: string[];
  correct_answer: string;
  user_answer: string | null;
  is_correct: boolean;
}

export interface AssessmentReview {
  listening: {
    items: AssessmentReviewItem[];
    correct: number;
    total: number;
    estimated_band: number;
  };
  reading: {
    items: AssessmentReviewItem[];
    correct: number;
    total: number;
    estimated_band: number;
  };
  writing: {
    topic: string;
    min_words: number;
    user_answer: string;
    word_count: number;
  };
  speaking: {
    prompt: string;
    user_answer: string | null;
    input_mode: string;
  };
  totals: {
    mc_correct: number;
    mc_total: number;
    listening_band: number;
    reading_band: number;
  };
}

export interface AssessmentRecord {
  id: number;
  quiz_data: AssessmentQuizData;
  user_answers: AssessmentUserAnswers | null;
  overall_score: number | null;
  grammar_feedback: string | null;
  vocab_feedback: string | null;
  strengths: string[];
  weaknesses: string[];
  status: "PENDING" | "COMPLETED";
  is_fallback: boolean;
  created_at: string;
  updated_at: string;
  review: AssessmentReview | null;
}

export interface RoadmapDayPlan {
  day: number;
  title: string;
  type: string;
  grammar_focus: string;
  vocabulary_focus: string;
  exercise_hint: string;
}

export interface RoadmapMonth {
  month: number;
  focus: string;
  days: RoadmapDayPlan[];
}

export interface RoadmapBlueprint {
  duration_days: number;
  months: RoadmapMonth[];
  days: RoadmapDayPlan[];
}

export interface DailyTaskQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface DailyTaskVocabularyItem {
  term: string;
  meaning: string;
  example: string;
}

export interface DailyTaskDetail {
  theory: string;
  vocabulary: DailyTaskVocabularyItem[];
  practice: DailyTaskQuestion[];
  action_item: string;
}

export interface DailyTaskRecord {
  id: number;
  day_number: number;
  status: string;
  score: number | null;
  task_detail_json: DailyTaskDetail;
  created_at: string;
}

export interface StudyRoadmapRecord {
  id: number;
  current_score: number;
  target_score: number;
  duration_days: number;
  created_at: string;
  blueprint: RoadmapBlueprint;
  generated_task_days: number[];
  tasks?: DailyTaskRecord[];
  warning?: string;
}

export interface RoadmapDashboardData {
  assessments: AssessmentRecord[];
  roadmaps: StudyRoadmapRecord[];
}

export interface RoadmapLessonPageData {
  roadmap: StudyRoadmapRecord;
  dayPlan: RoadmapDayPlan;
  task: DailyTaskRecord | null;
}
