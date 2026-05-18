import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const SITE_PASSWORD = process.env.SITE_PASSWORD || "NYCE2026!";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "NYCE2026!";
const SITE_COOKIE = "site_pw";
const ADMIN_COOKIE = "admin_pw";

// Paths the gate must NOT block (otherwise we'd infinite-loop or break OAuth).
const BYPASS_PREFIXES = ["/gate", "/admin/gate", "/admin/auth"];

function isBypass(pathname: string): boolean {
  return BYPASS_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isBypass(pathname)) {
    return updateSession(request);
  }

  // Layer 1 — public site gate
  const sitePw = request.cookies.get(SITE_COOKIE)?.value;
  if (sitePw !== SITE_PASSWORD) {
    const url = request.nextUrl.clone();
    url.pathname = "/gate";
    url.search = "";
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  // Layer 2 — admin-only gate on top
  if (pathname.startsWith("/admin")) {
    const adminPw = request.cookies.get(ADMIN_COOKIE)?.value;
    if (adminPw !== ADMIN_PASSWORD) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/gate";
      url.search = "";
      url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on every path except:
     * - Next.js internals (_next/*)
     * - Static files
     * - Public favicon
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|ico|webp|woff2?|ttf)$).*)",
  ],
};
