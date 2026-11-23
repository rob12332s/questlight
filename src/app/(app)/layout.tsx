import { redirect } from "next/navigation";
import { MobileNav, Sidebar } from "@/features/app-shell/app-nav";
import { getCurrentStudent } from "@/server/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const student = await getCurrentStudent();
  if (!student) redirect("/login");

  return (
    <div className="flex min-h-dvh">
      <Sidebar displayName={student.profile.display_name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <main id="main" className="w-full max-w-5xl flex-1 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          {children}
        </main>
      </div>
    </div>
  );
}
