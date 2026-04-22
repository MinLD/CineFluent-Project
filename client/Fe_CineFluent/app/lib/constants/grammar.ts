export const GRAMMAR_TAG_LABELS: Record<number, string> = {
  0: "Present Simple",
  1: "Present Continuous",
  2: "Present Perfect",
  3: "Present Perfect Continuous",
  4: "Past Simple",
  5: "Past Continuous",
  6: "Past Perfect",
  7: "Past Perfect Continuous",
  8: "Future Simple",
  9: "Future Continuous",
  10: "Future Perfect",
  11: "Future Perfect Continuous",
};

export function getGrammarTagLabel(tagId?: number | null) {
  if (tagId === undefined || tagId === null) {
    return "Unknown";
  }

  return GRAMMAR_TAG_LABELS[tagId] || `Tag ${tagId}`;
}
