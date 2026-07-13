import "server-only";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AdminRole = "admin" | "editor";

export type AdminContext = {
  userId: string;
  email: string;
  displayName: string;
  role: AdminRole;
};

// Resolve the active admin_users row for the logged-in session, or null.
// Session read via the cookie client; the admin_users lookup uses service-role
// (that table has RLS on with no policy — reachable only server-side).
export async function getAdminContext(): Promise<AdminContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("admin_users")
    .select("user_id, email, display_name, role, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!row || !row.is_active) return null;
  return { userId: row.user_id, email: row.email, displayName: row.display_name, role: row.role };
}

// Page/data-layer guard. Layouts are NOT re-run on client-side soft navigations, so every
// admin PAGE re-verifies here (pages DO re-execute) — this is the real authorization boundary.
export async function requireAdminPage(minRole: AdminRole = "editor"): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login?error=unauthorized");
  if (minRole === "admin" && ctx.role !== "admin") redirect("/admin");
  return ctx;
}

// Guard for server actions — never throws; returns {ctx} or {error}.
export async function requireAdmin(
  minRole: AdminRole = "editor",
): Promise<{ ctx: AdminContext; error: null } | { ctx: null; error: string }> {
  const ctx = await getAdminContext();
  if (!ctx) return { ctx: null, error: "Sesi tidak valid atau akun bukan admin." };
  if (minRole === "admin" && ctx.role !== "admin") {
    return { ctx: null, error: "Aksi ini butuh akses admin." };
  }
  return { ctx, error: null };
}
