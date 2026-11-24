/**
 * Mistake tags: a fixed vocabulary so the Exam Map can spot recurring mistakes across
 * topics and recommend a specific fix. Tags are stored with coach results
 * (record_coach_result keeps only tags matching ^[a-z_]{3,40}$).
 */
export interface MistakeTag {
  label: string;
  /** What to do about it, written to the student. */
  fix: string;
}

export const MISTAKE_TAGS = {
  // Calculation
  misread_question: { label: "Misreading the question", fix: "Underline what the question asks for and the units it wants before you start." },
  no_working: { label: "Not showing working", fix: "Write every step. Method marks are available even when the final answer is wrong." },
  arithmetic_slip: { label: "Arithmetic slips", fix: "Estimate the answer first, then check your result is close to it." },
  sign_error: { label: "Sign errors", fix: "Take extra care with negatives: write the sign with each term when you move it." },
  wrong_formula: { label: "Using the wrong formula", fix: "Write the formula out in full before substituting into it." },
  rearranging_error: { label: "Rearranging errors", fix: "Do the same operation to both sides, one step per line." },
  unit_conversion: { label: "Unit conversion", fix: "Convert every value to the units the formula needs before you calculate." },
  missing_units: { label: "Missing units", fix: "Finish every calculation answer with its unit." },
  rounding_too_early: { label: "Rounding too early", fix: "Keep full calculator values until the final answer, then round." },
  incomplete_method: { label: "Stopping before the end", fix: "Reread the question once you have an answer: have you answered exactly what it asked?" },
  // Science explanation
  missing_key_term: { label: "Missing key terms", fix: "Learn the key words for this topic and use them precisely in your answers." },
  description_not_explanation: { label: "Describing instead of explaining", fix: "After each point, add 'because…' or 'this means that…' to give the reason." },
  data_not_used: { label: "Not using the data", fix: "Quote numbers from the graph or table, with units, to support your answer." },
  vague_language: { label: "Vague language", fix: "Replace words like 'it' and 'affects' with the exact thing and the direction of change." },
  // English
  no_evidence: { label: "No evidence", fix: "Support every point with a short, embedded quotation." },
  quotation_too_long: { label: "Quotations too long", fix: "Choose two to five words that you can analyse closely." },
  technique_spotting: { label: "Naming techniques without analysis", fix: "Spend more words on the effect of a technique than on naming it." },
  no_effect_on_reader: { label: "Missing the effect", fix: "Explain what the reader thinks, feels or imagines because of the writer's choice." },
  no_context_link: { label: "No context", fix: "Link one idea per paragraph to when the text was written and the writer's purpose." },
  no_comparison: { label: "Not comparing", fix: "Use comparative connectives (whereas, similarly) and discuss both texts in each paragraph." },
  weak_structure: { label: "Weak structure", fix: "Plan a clear order before writing and start each paragraph with a topic sentence." },
  spag_errors: { label: "Spelling and punctuation", fix: "Save three minutes to proofread for full stops, apostrophes and commonly misspelt words." },
  // Humanities
  one_sided: { label: "One-sided answers", fix: "Give the other side too: 'however', 'on the other hand' and why it is weaker or stronger." },
  no_judgement: { label: "No clear judgement", fix: "End with a judgement that answers the question directly and says why." },
  generic_knowledge: { label: "Generic knowledge", fix: "Use specific names, dates, places and figures, not general statements." },
  not_linked_to_question: { label: "Not linked to the question", fix: "End each paragraph by linking it back to the exact words of the question." },
  no_case_study_detail: { label: "Too little case-study detail", fix: "Learn three precise facts or figures for every case study." },
  source_content_only: { label: "Ignoring provenance", fix: "Use who wrote the source, when and why, not just what it says." },
  // Any subject
  timing: { label: "Running out of time", fix: "Spend about a minute per mark and move on when that time is up." },
} as const satisfies Record<string, MistakeTag>;

export type MistakeTagId = keyof typeof MISTAKE_TAGS;

export function isMistakeTag(tag: string): tag is MistakeTagId {
  return Object.prototype.hasOwnProperty.call(MISTAKE_TAGS, tag);
}

export interface RecurringMistake {
  tag: MistakeTagId;
  count: number;
  label: string;
  fix: string;
}

/**
 * Tags that have come up at least `min` times across recent attempts, most frequent first.
 * Unknown tags are ignored.
 */
export function recurringMistakes(attempts: { mistakes: string[] }[], min = 2): RecurringMistake[] {
  const counts = new Map<MistakeTagId, number>();
  for (const a of attempts) {
    for (const tag of new Set(a.mistakes)) {
      if (isMistakeTag(tag)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= min)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag, count]) => ({ tag, count, ...MISTAKE_TAGS[tag] }));
}
