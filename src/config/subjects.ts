/**
 * Launch subjects as shown on public pages. Must match the rows seeded in
 * supabase/migrations/*_reference_data.sql (a unit test checks the slugs).
 */
export const LAUNCH_SUBJECTS = [
  { slug: "maths", name: "Mathematics" },
  { slug: "english-language", name: "English Language" },
  { slug: "english-literature", name: "English Literature" },
  { slug: "biology", name: "Biology" },
  { slug: "chemistry", name: "Chemistry" },
  { slug: "physics", name: "Physics" },
  { slug: "combined-science", name: "Combined Science" },
  { slug: "history", name: "History" },
  { slug: "geography", name: "Geography" },
] as const;

export type SubjectSlug = (typeof LAUNCH_SUBJECTS)[number]["slug"];
