export interface IClassroomUser {
  id: string;
  email: string;
  fullname: string | null;
  avatar_url: string | null;
}

export interface IClassroomMember {
  id: number;
  user_id: string;
  role: "teacher" | "student";
  joined_at: string | null;
  user: IClassroomUser | null;
}

export interface IClassSession {
  id: number;
  classroom_id: number;
  title: string;
  description: string | null;
  scheduled_at: string | null;
  grammar_focus: string[];
  teacher_notes: string | null;
  status: "PLANNED" | "COMPLETED" | "CANCELLED";
  recap: IClassSessionRecap | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface IClassSessionRecap {
  id: number;
  session_id: number;
  recording_id: number | null;
  summary_text: string;
  key_points: string[];
  examples: Array<{
    title: string;
    content: string;
  }>;
  homework_text: string | null;
  review_suggestions: string[];
  transcript_text: string | null;
  model_name: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface IClassAssignmentSource {
  id: number;
  title: string;
  level: string | null;
  release_year: number | null;
  candidate_count: number;
}

export interface IClassHomeworkGrammarTag {
  id: number;
  name_en: string;
  name_vi: string | null;
}

export interface IClassSessionAssignmentAnswer {
  question_id: string;
  selected_option: string;
}

export interface IClassSessionAssignmentResultItem {
  question_id: string;
  selected_option: string;
  correct_answer: string;
  is_correct: boolean;
  explanation: string;
  selected_explanation: string;
}

export interface IClassSessionAssignmentSubmission {
  id: number;
  assignment_id: number;
  user_id: string;
  user_name?: string | null;
  user_email?: string | null;
  answers: IClassSessionAssignmentAnswer[];
  result_json: IClassSessionAssignmentResultItem[];
  score: number | null;
  total_questions: number;
  correct_answers: number | null;
  submitted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface IClassSessionAssignmentQuestion {
  id: string;
  subtitle_id: number;
  prompt: string;
  translation: string | null;
  full_sentence: string | null;
  options: string[];
  tag_id: number | null;
  answer?: string;
  explanation?: string;
}

export interface IClassSessionAssignment {
  id: number;
  classroom_id: number;
  created_by: string | null;
  source_video_id: number | null;
  source_video_title: string | null;
  title: string;
  instructions: string | null;
  grammar_focus: string[];
  question_count: number;
  status: "ACTIVE" | "CLOSED";
  questions: IClassSessionAssignmentQuestion[];
  submission: IClassSessionAssignmentSubmission | null;
  submission_summaries?: IClassSessionAssignmentSubmission[];
  created_at: string | null;
  updated_at: string | null;
}

export interface IClassroom {
  id: number;
  name: string;
  description: string | null;
  invite_code: string;
  status: "ACTIVE" | "ARCHIVED";
  teacher_id: string;
  teacher: IClassroomUser | null;
  member_count: number;
  my_role: "teacher" | "student" | null;
  created_at: string | null;
  updated_at: string | null;
  members?: IClassroomMember[];
  sessions?: IClassSession[];
}

export interface IClassroomListData {
  classrooms: IClassroom[];
}
