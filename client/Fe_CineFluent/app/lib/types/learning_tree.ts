export type TDiscoveryNodeState = "locked" | "discovered" | "mastered";

export interface ILearningTreeOverview {
  discovered_total: number;
  mastered_total: number;
  total_tags: number;
  branch_count: number;
  discovered_branch_count: number;
}

export interface ILearningTreeTagNode {
  tag_id: number;
  name_en: string;
  name_vi: string | null;
  label_en: string;
  label_vi: string;
  state: TDiscoveryNodeState;
  mastery_score: number;
  review_priority: number;
  encounter_count: number;
  source: string;
  source_label: string;
  discovered_at: string | null;
  last_seen_at: string | null;
  last_practiced_at: string | null;
  interval_days: number | null;
}

export interface ILearningTreeBranch {
  branch_id: number;
  name_en: string;
  name_vi: string;
  description: string | null;
  display_order: number;
  discovered_count: number;
  locked_count: number;
  mastered_count: number;
  tags: ILearningTreeTagNode[];
}

export interface IWeakestBranchSummary {
  branch_id: number;
  name_en: string;
  name_vi: string;
  average_mastery: number;
}

export interface ILearningTreeSummary {
  overview: ILearningTreeOverview;
  weakest_branch: IWeakestBranchSummary | null;
  weak_tags: ILearningTreeTagNode[];
  due_count: number;
  new_discoveries_last_7_days: number;
  today_focus: ILearningTreeTagNode | null;
}

export interface ILearningTreeResponse {
  overview: ILearningTreeOverview;
  branches: ILearningTreeBranch[];
}

export interface ILearningTreePageData {
  tree: ILearningTreeResponse | null;
  summary: ILearningTreeSummary | null;
}
