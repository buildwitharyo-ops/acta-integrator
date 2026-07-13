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

// Mirrors Next's remotePatterns hostname matching (`**.` / `*.` wildcards) for a given URL.
export function isAllowedImageHost(url: string): boolean {
  let host: string;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    host = u.hostname;
  } catch {
    return false;
  }
  return IMAGE_REMOTE_HOSTS.some(({ hostname }) => {
    if (hostname.startsWith("**.")) return host.endsWith(hostname.slice(2)); // **.supabase.co → *.supabase.co at any depth
    if (hostname.startsWith("*.")) {
      const suffix = hostname.slice(1); // ".example.com"
      return host.endsWith(suffix) && host.slice(0, -suffix.length).length > 0 && !host.slice(0, -suffix.length).includes(".");
    }
    return host === hostname;
  });
}

export function allowedHostsHint(): string {
  return IMAGE_REMOTE_HOSTS.map((h) => h.hostname).join(", ");
}
