"use server";

import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { safeInternalPath } from "@/lib/safe-path";

// In-app preview for authenticated admins — enables Draft Mode without exposing DRAFT_MODE_SECRET
// to the client, then redirects to the (internal) content path. Previews the last SAVED draft.
export async function previewContent(path: string): Promise<void> {
  const { ctx } = await requireAdmin("editor");
  if (!ctx) return;
  if (!path.startsWith("/") || (path.length >= 2 && (path[1] === "/" || path[1] === "\\"))) return;
  (await draftMode()).enable();
  redirect(safeInternalPath(path));
}
