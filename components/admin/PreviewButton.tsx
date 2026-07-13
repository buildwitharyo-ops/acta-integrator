"use client";

import { Eye } from "lucide-react";
import { previewContent } from "@/lib/actions/admin/preview";

// Opens the saved draft in a new tab with Draft Mode enabled. Save before previewing —
// it renders the DB state, not unsaved edits.
export function PreviewButton({ path }: { path: string }) {
  return (
    <form action={previewContent.bind(null, path)} target="_blank">
      <button type="submit" className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted">
        <Eye className="h-3.5 w-3.5" /> Pratinjau
      </button>
    </form>
  );
}
