// Guard against open redirects: only allow site-internal absolute paths. Rejects protocol-relative
// "//host" AND the backslash variant "/\host" (browsers normalize `\`→`/`, so /\host === //host).
export function safeInternalPath(path: string | null | undefined, fallback = "/"): string {
  if (!path || !path.startsWith("/")) return fallback;
  if (path.length >= 2 && (path[1] === "/" || path[1] === "\\")) return fallback;
  return path;
}
