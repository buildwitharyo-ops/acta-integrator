import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { safeInternalPath } from "@/lib/safe-path";

export const dynamic = "force-dynamic";

// Enable Next.js Draft Mode (renders unpublished drafts on the marketing detail pages).
// Gated by DRAFT_MODE_SECRET; only redirects to internal paths (no open redirect).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (!process.env.DRAFT_MODE_SECRET || secret !== process.env.DRAFT_MODE_SECRET) {
    return new Response("Invalid secret", { status: 401 });
  }
  (await draftMode()).enable();
  redirect(safeInternalPath(searchParams.get("path")));
}
