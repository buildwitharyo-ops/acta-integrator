import { NextResponse, type NextRequest } from "next/server";
import { isGonePath } from "@/lib/gone";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Permanently withdrawn content answers 410 before anything else runs (lib/gone.ts).
  // It is checked here rather than in a page because the products it names no longer
  // resolve to a page at all — an unpublished row falls out of generateStaticParams,
  // so the route would 404, and 404 is the weaker, slower signal for stock that is
  // never coming back. `x-robots-tag: noindex` is belt-and-braces for crawlers that
  // reach the URL from an external link before re-crawling it.
  if (isGonePath(request.nextUrl.pathname)) {
    return new NextResponse(null, {
      status: 410,
      headers: { "x-robots-tag": "noindex", "cache-control": "public, max-age=3600" },
    });
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
