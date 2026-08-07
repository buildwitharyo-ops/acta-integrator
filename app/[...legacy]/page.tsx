import { notFound, permanentRedirect } from "next/navigation";
import { getRedirectDestination } from "@/lib/queries/redirects";

// Root-level legacy catch-all (04 §17.0 P0-3, §18 R7; 01-PRD G3).
//
// The four nested [slug] pages consult the `redirects` table on a miss, but a legacy WordPress URL
// that lived at the ROOT (`/nama-artikel-lama`) matched no route at all, so it 404'd without the
// table ever being read. This file closes that hole. Absolute rule (R7): never 404 a URL that has
// ever been published — superseded content 308s, genuinely wrong content is answered deliberately,
// nothing is silently deleted.
//
// Route precedence: an optional-free catch-all is the LOWEST-priority match in the App Router. Every
// static route, every dynamic [slug] inside (marketing)/(admin), every route handler under /api,
// every metadata route (robots.txt, sitemap.xml, icons), every /public asset, and every rule in
// next.config's redirects() is resolved before Next considers this segment. It therefore only ever
// executes on a request that would otherwise have been a 404 — it cannot shadow a working route.
//
// force-dynamic because the answer lives in a table an editor mutates at will: a redirect added at
// 10:00 must work at 10:01, with no deploy and no revalidation event to fire. Nothing here is cached.
export const dynamic = "force-dynamic";

type Params = { legacy: string[] };

// Requests longer than this are scanner noise, not URLs anyone ever published. Answered without a
// database round-trip so bot traffic cannot turn a 404 into query volume.
const MAX_PATH_LENGTH = 1024;

// Namespaces that have their own 404 semantics and can never hold a legacy marketing slug. Skipped
// before any lookup so an unmatched /api/* stays a cheap miss.
const IGNORED_ROOTS = new Set(["api", "_next"]);

function joinPath(segments: string[]): string {
  return `/${segments.join("/")}`;
}

// Legacy slugs carry emoji (`…power-sequencer…-⚡🔌🎚️/`), so segments arrive percent-encoded.
// decodeURIComponent throws URIError on a malformed escape (`/%E0%A4`) — scanners send those on
// purpose. Catch it and treat the path as unknown, so a hand-crafted URL is a 404, never a 500.
function decodePath(segments: string[]): string | null {
  try {
    return joinPath(segments.map((s) => decodeURIComponent(s)));
  } catch {
    return null;
  }
}

// `redirects.destination_path` is admin-authored and validated on write (path or absolute http(s)
// URL), but this is the one place its value becomes a Location header, so it is re-checked here.
// safeInternalPath() is deliberately NOT used: it collapses external destinations to "/", and an
// external destination is legal in this table. Protocol-relative "//host" and its backslash variant
// (browsers normalise `\`→`/`) are rejected — those are open redirects wearing a path's clothes.
function isSafeDestination(destination: string): boolean {
  if (destination.startsWith("/")) {
    return !(destination.length >= 2 && (destination[1] === "/" || destination[1] === "\\"));
  }
  return /^https?:\/\/\S+$/i.test(destination);
}

// A Search Console export gives URLs percent-encoded and with a trailing slash; an editor pastes
// whichever form they copied. `trailingSlash: false` (next.config) has already stripped the slash
// from the incoming request, so a row stored WITH one is only reachable by asking for it explicitly.
// All four spellings are probed in one round, first hit wins in listed order — this runs on 404s
// only, against a unique index on source_path.
async function findDestination(segments: string[]): Promise<string | null> {
  const raw = joinPath(segments);
  const decoded = decodePath(segments);
  if (decoded === null) return null;

  const candidates = Array.from(new Set([decoded, raw, `${decoded}/`, `${raw}/`]));
  const hits = await Promise.all(candidates.map((candidate) => getRedirectDestination(candidate)));
  return hits.find((hit): hit is string => typeof hit === "string" && hit.length > 0) ?? null;
}

export default async function LegacyPathPage({ params }: { params: Promise<Params> }): Promise<never> {
  const { legacy } = await params;
  const segments = legacy.filter((segment) => segment.length > 0);
  const first = segments[0] ?? "";

  if (segments.length === 0 || IGNORED_ROOTS.has(first) || joinPath(segments).length > MAX_PATH_LENGTH) {
    notFound();
  }

  const destination = await findDestination(segments);
  // permanentRedirect → 308, which preserves the method and is treated as a permanent move: the
  // legacy URL's accumulated authority transfers to the destination instead of dying at a 404.
  if (destination !== null && isSafeDestination(destination)) permanentRedirect(destination);

  notFound();
}
