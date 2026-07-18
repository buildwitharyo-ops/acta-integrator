// Single source of truth for allowed remote image hosts — imported by both next.config.ts
// (images.remotePatterns) and the Media module's external-URL validator (08 §3.6).
export const IMAGE_REMOTE_HOSTS: { protocol: "https"; hostname: string }[] = [
  { protocol: "https", hostname: "images.unsplash.com" },
  { protocol: "https", hostname: "images.pexels.com" },
  { protocol: "https", hostname: "**.supabase.co" },
  { protocol: "https", hostname: "www.crestron.com" },
  { protocol: "https", hostname: "www.qsc.com" },
  { protocol: "https", hostname: "www.shure.com" },
];

// Mirrors Next's remotePatterns hostname matching (`**.` / `*.` wildcards) for a given hostname.
function hostMatchesPattern(host: string, pattern: string): boolean {
  if (pattern.startsWith("**.")) return host.endsWith(pattern.slice(2)); // **.supabase.co → *.supabase.co at any depth
  if (pattern.startsWith("*.")) {
    const suffix = pattern.slice(1); // ".example.com"
    return host.endsWith(suffix) && host.slice(0, -suffix.length).length > 0 && !host.slice(0, -suffix.length).includes(".");
  }
  return host === pattern;
}

function extractHttpsHost(url: string): string | null {
  try {
    const u = new URL(url);
    return u.protocol === "https:" ? u.hostname : null;
  } catch {
    return null;
  }
}

export function isAllowedImageHost(url: string): boolean {
  const host = extractHttpsHost(url);
  if (!host) return false;
  return IMAGE_REMOTE_HOSTS.some(({ hostname }) => hostMatchesPattern(host, hostname));
}

// Fase 4 (PRD §7.7/§10 item 5): union of the hardcoded list above with an admin-managed DB table
// (allowed_image_hosts) — for server-side URL validators ONLY (registerExternalMedia and friends).
// next.config.ts's images.remotePatterns can never call this (needs a static list at build time),
// so the hardcoded array above is never removed, exactly per the PRD's own instruction.
export async function isAllowedImageHostAsync(url: string): Promise<boolean> {
  if (isAllowedImageHost(url)) return true;
  const host = extractHttpsHost(url);
  if (!host) return false;

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const sb = createAdminClient();
  const { data } = await sb.from("allowed_image_hosts").select("hostname");
  return (data ?? []).some((row) => hostMatchesPattern(host, row.hostname));
}

export function allowedHostsHint(): string {
  return IMAGE_REMOTE_HOSTS.map((h) => h.hostname).join(", ");
}
