import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppearanceSettings } from "@/features/settings/appearance-settings";
import { DeleteAccountForm, ProfileForm, SubjectsForm } from "@/features/settings/settings-forms";
import { hasServiceRoleKey } from "@/lib/env";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCurrentStudent } from "@/server/session";

export const metadata: Metadata = { title: "Profile and settings" };

function Section({ id, title, description, children }: { id: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24 grid gap-6 border-t border-line py-10 md:grid-cols-[14rem_1fr] md:gap-10">
      <div>
        <h2 id={`${id}-heading`} className="font-semibold">
          {title}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">{description}</p>
      </div>
      <div className="max-w-lg">{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const student = await getCurrentStudent();
  if (!student) redirect("/login");
  const supabase = await getServerSupabase();

  const [subjectsResult, chosenResult] = await Promise.all([
    supabase.from("subjects").select("id, slug, name").order("sort_order"),
    supabase.from("profile_subjects").select("subject_id").eq("profile_id", student.userId),
  ]);
  const subjects = (subjectsResult.data ?? []) as Array<{ id: string; slug: string; name: string }>;
  const selected = ((chosenResult.data ?? []) as Array<{ subject_id: string }>).map((row) => row.subject_id);

  return (
    <div>
      <h1 className="text-3xl font-semibold sm:text-4xl">Profile and settings</h1>
      <p className="mt-2 text-ink-soft">Signed in with {student.email ?? "your email"}. Only you can see this.</p>

      <div className="mt-10">
        <Section id="profile" title="Profile" description="How you appear to other players.">
          <ProfileForm
            displayName={student.profile.display_name}
            educationStage={student.profile.education_stage}
            showOnLeaderboards={student.profile.show_on_leaderboards}
          />
        </Section>

        <Section
          id="appearance"
          title="Appearance"
          description="Make Questlight comfortable to read: theme, colour, text size, font, spacing and animation."
        >
          <AppearanceSettings />
        </Section>

        <Section id="subjects" title="Subjects" description="What you're studying. Used to focus quizzes and suggestions.">
          {subjects.length === 0 ? (
            <p className="text-sm text-ink-soft">Subjects couldn&apos;t be loaded. Refresh the page to try again.</p>
          ) : (
            <SubjectsForm subjects={subjects} selected={selected} />
          )}
        </Section>

        <Section
          id="delete"
          title="Delete account"
          description="Removes your profile, progress, flashcards and reports. This can't be undone."
        >
          <DeleteAccountForm enabled={hasServiceRoleKey(process.env)} />
        </Section>
      </div>
    </div>
  );
}
