export interface IGrammarLessonExample {
  sentence_en: string;
  sentence_vi: string;
  explanation_vi: string;
}

export interface IGrammarLessonVocabulary {
  word: string;
  meaning_vi: string;
  usage_hint: string;
}

export interface IGrammarLessonData {
  lesson_id: number;
  tag_id: number;
  label_en: string;
  label_vi: string;
  title: string;
  model_name: string;
  version: number;
  created_at: string | null;
  updated_at: string | null;
  summary: string;
  formula: string;
  usage_notes: string[];
  examples: IGrammarLessonExample[];
  vocabulary: IGrammarLessonVocabulary[];
  common_mistakes: string[];
  movie_tip: string;
}

export interface IGrammarReviewOptionFeedback {
  option: string;
  is_correct: boolean;
  feedback_vi: string;
}

export interface IGrammarReviewQuestion {
  question: string;
  options: string[];
  answer: string;
  correct_explanation_vi: string;
  option_feedback: IGrammarReviewOptionFeedback[];
}

export interface IGrammarReviewData {
  exercise_id: number;
  tag_id: number;
  label_en: string;
  label_vi: string;
  title: string;
  question_count: number;
  model_name: string;
  created_at: string | null;
  updated_at: string | null;
  instructions: string;
  questions: IGrammarReviewQuestion[];
}

export interface IGrammarReviewResultItem {
  question_index: number;
  question: string;
  selected_answer: string | null;
  correct_answer: string;
  is_correct: boolean;
  selected_feedback_vi: string | null;
  correct_explanation_vi: string | null;
  correct_option_feedback_vi: string | null;
  option_feedback: IGrammarReviewOptionFeedback[];
}

export interface IGrammarReviewSubmitResult {
  attempt_id: number;
  exercise_id: number;
  tag_id: number;
  score: number;
  correct_answers: number;
  total_questions: number;
  submitted_at: string | null;
  result: {
    items: IGrammarReviewResultItem[];
  };
}

export interface IGrammarReviewHistoryItem {
  attempt_id: number;
  exercise_id: number;
  score: number | null;
  correct_answers: number | null;
  total_questions: number;
  status: string;
  submitted_at: string | null;
  created_at: string | null;
  title: string | null;
  question_count: number;
}

export interface IGrammarReviewHistoryData {
  tag_id: number;
  items: IGrammarReviewHistoryItem[];
}
