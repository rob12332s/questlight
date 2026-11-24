import { redirect } from "next/navigation";
import { MobileNav, Sidebar } from "@/features/app-shell/app-nav";
import { isAiConfigured } from "@/lib/env";
import { getCurrentStudent } from "@/server/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const student = await getCurrentStudent();
  if (!student) redirect("/login");
  const aiEnabled = isAiConfigured(process.env);

  return (
    <div className="flex min-h-dvh">
      <Sidebar displayName={student.profile.display_name} aiEnabled={aiEnabled} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav aiEnabled={aiEnabled} />
        <main id="main" className="w-full max-w-5xl flex-1 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          {children}
        </main>
      </div>
    </div>
  );
}
