"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { findMediaUsage } from "@/lib/admin/media-usage";
import { slugify } from "@/lib/admin/slug";
import { allowedHostsHint, isAllowedImageHost } from "@/lib/image-hosts";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type MediaResult = { ok: true } | { ok: false; error: string };

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};
const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadMedia(formData: FormData): Promise<{ ok: true; count: number; errors: string[] } | { ok: false; error: string }> {
  const { ctx, error } = await requireAdmin("editor");
  if (!ctx) return { ok: false, error };

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { ok: false, error: "Tidak ada file." };

  const supabase = await createClient();
  const admin = createAdminClient();
  let count = 0;
  const errors: string[] = [];

  // Per-file: skip invalid/failed files but keep committing the valid ones (never abort the whole
  // batch and hide already-committed uploads). The client refreshes on count>0 and shows errors.
  for (const file of files) {
    const ext = ALLOWED_TYPES[file.type];
    if (!ext) { errors.push(`${file.name}: format tidak didukung`); continue; }
    if (file.size > MAX_BYTES) { errors.push(`${file.name}: > 5 MB`); continue; }

    const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "media";
    const hash = crypto.randomUUID().slice(0, 8);
    const path = `uploads/${base}-${hash}.${ext}`;

    const { error: upErr } = await admin.storage.from("media").upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) { errors.push(`${file.name}: gagal upload`); continue; }

    const { error: insErr } = await supabase.from("media").insert({ kind: "upload", storage_path: path, is_placeholder: false, created_by: ctx.userId });
    if (insErr) {
      await admin.storage.from("media").remove([path]); // roll back the orphaned object
      errors.push(`${file.name}: gagal menyimpan record`);
      continue;
    }
    count += 1;
  }
  return { ok: true, count, errors };
}

const externalSchema = z.object({
  external_url: z.string().url("URL tidak valid"),
  alt: z.string().trim().optional().nullable(),
  caption: z.string().trim().optional().nullable(),
  source_license: z.string().trim().min(1, "Source/lisensi wajib untuk URL eksternal"),
  is_placeholder: z.boolean().default(true),
});

export async function registerExternalMedia(input: unknown): Promise<MediaResult> {
  const { ctx, error } = await requireAdmin("editor");
  if (!ctx) return { ok: false, error };
  const parsed = externalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  const v = parsed.data;

  if (!isAllowedImageHost(v.external_url)) {
    return { ok: false, error: `Domain belum diizinkan. Tambahkan ke next.config remotePatterns dulu. Diizinkan: ${allowedHostsHint()}` };
  }

  // Verify the URL actually resolves to an image (01-PRD §7.5): HTTP 200 + content-type image/*.
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(v.external_url, { method: "HEAD", signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return { ok: false, error: `URL mengembalikan HTTP ${res.status} (harus 200).` };
    const ctype = res.headers.get("content-type") ?? "";
    if (!ctype.startsWith("image/")) return { ok: false, error: `Content-type bukan gambar (${ctype || "kosong"}).` };
  } catch {
    return { ok: false, error: "Tidak bisa memverifikasi URL (timeout / gagal fetch)." };
  }

  const supabase = await createClient();
  const { error: insErr } = await supabase.from("media").insert({
    kind: "external",
    external_url: v.external_url,
    alt: v.alt || null,
    caption: v.caption || null,
    source_license: v.source_license,
    is_placeholder: v.is_placeholder,
    created_by: ctx.userId,
  });
  if (insErr) return { ok: false, error: "Gagal menyimpan record." };
  return { ok: true };
}

const updateSchema = z.object({
  id: z.string().uuid(),
  alt: z.string().trim().optional().nullable(),
  caption: z.string().trim().optional().nullable(),
  source_license: z.string().trim().optional().nullable(),
  is_placeholder: z.boolean().default(true),
});

export async function updateMedia(input: unknown): Promise<MediaResult> {
  const { ctx, error } = await requireAdmin("editor");
  if (!ctx) return { ok: false, error };
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  const v = parsed.data;

  const supabase = await createClient();
  const { data, error: upErr } = await supabase
    .from("media")
    .update({ alt: v.alt || null, caption: v.caption || null, source_license: v.source_license || null, is_placeholder: v.is_placeholder })
    .eq("id", v.id)
    .select("id")
    .single();
  if (upErr || !data) return { ok: false, error: "Gagal menyimpan (source/lisensi wajib untuk eksternal?)." };
  return { ok: true };
}

export async function deleteMedia(id: string): Promise<MediaResult> {
  const { ctx, error } = await requireAdmin("editor");
  if (!ctx) return { ok: false, error };

  const usage = await findMediaUsage(id);
  if (usage.length > 0) {
    const list = usage.slice(0, 5).map((u) => `${u.where}: ${u.label}`).join("; ");
    return { ok: false, error: `Masih dipakai (${usage.length}) — ${list}${usage.length > 5 ? "…" : ""}` };
  }

  const admin = createAdminClient();
  const { data: row } = await admin.from("media").select("kind, storage_path").eq("id", id).maybeSingle();

  const supabase = await createClient();
  const { data: deleted, error: delErr } = await supabase.from("media").delete().eq("id", id).select("id");
  if (delErr) return { ok: false, error: "Gagal menghapus media." };
  if (!deleted || deleted.length === 0) return { ok: false, error: "Tidak bisa menghapus (akses ditolak)." };

  if (row?.kind === "upload" && row.storage_path) {
    await admin.storage.from("media").remove([row.storage_path]);
  }
  return { ok: true };
}
