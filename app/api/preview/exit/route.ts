import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { safeInternalPath } from "@/lib/safe-path";

export const dynamic = "force-dynamic";

// Leave Draft Mode and return to the given internal path (or home).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  (await draftMode()).disable();
  redirect(safeInternalPath(searchParams.get("path")));
}
