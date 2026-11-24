import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Routes that need a signed-in student. Everything else is public. */
const APP_PREFIXES = ["/dashboard", "/settings", "/learn", "/quizzes", "/flashcards", "/achievements", "/play", "/leaderboards", "/classes", "/ai-study", "/library", "/coach", "/exam-map", "/pro", "/admin"];
const AUTH_PAGES = ["/login", "/signup"];

/**
 * Next.js 16 proxy (formerly middleware): refreshes the Supabase session cookie and
 * keeps signed-out visitors out of the app. Pages still check the user themselves —
 * this is a convenience layer, not the security boundary (RLS is).
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
      },
    },
  });

  // getClaims() verifies the session JWT locally (against the project's cached public
  // keys) instead of a network round trip on every request. It also refreshes an
  // expired session, writing new cookies through setAll above.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims ?? null;

  const path = request.nextUrl.pathname;
  const inApp = APP_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

  if (inApp && !user) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(login);
  }

  if (user && AUTH_PAGES.includes(path)) {
    const dashboard = request.nextUrl.clone();
    dashboard.pathname = "/dashboard";
    dashboard.search = "";
    return NextResponse.redirect(dashboard);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/play/:path*",
    "/leaderboards/:path*",
    "/classes/:path*",
    "/ai-study/:path*",
    "/library/:path*",
    "/coach/:path*",
    "/exam-map/:path*",
    "/pro/:path*",
    "/admin/:path*",
    "/settings/:path*",
    "/learn/:path*",
    "/quizzes/:path*",
    "/flashcards/:path*",
    "/achievements/:path*",
    "/reset-password",
    "/login",
    "/signup",
  ],
};
