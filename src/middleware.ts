import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
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
