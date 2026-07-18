import "server-only";

// Real web search + page fetch — mechanical, not a reasoning task (PRD §4.4's own principle:
// AI should not do mechanical work). Used by lib/ai/providers/gemini.ts's research step instead
// of Gemini's own googleSearch grounding tool, which returned 429 RESOURCE_EXHAUSTED on the
// free-tier key (confirmed live — grounding appears to require billing enabled even for a free
// allowance). Brave Search API: free tier is a genuine recurring monthly quota (not a one-time
// credit that runs out), single API key, no separate "search engine" object to provision.

export type SearchResult = { title: string; url: string; description: string };

function stripHtmlEntities(s: string): string {
  return s.replace(/<\/?[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").trim();
}

export async function searchWeb(query: string, count = 5): Promise<SearchResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) throw new Error("BRAVE_SEARCH_API_KEY belum diset — tambahkan di .env.local sebelum menjalankan riset.");

  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(count));

  const res = await fetch(url, {
    headers: { Accept: "application/json", "X-Subscription-Token": apiKey },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Brave Search gagal: HTTP ${res.status}`);

  const data = (await res.json()) as { web?: { results?: { title?: string; url?: string; description?: string }[] } };
  return (data.web?.results ?? []).slice(0, count).map((r) => ({
    title: stripHtmlEntities(r.title ?? ""),
    url: r.url ?? "",
    description: stripHtmlEntities(r.description ?? ""),
  }));
}

// Best-effort readable-text extraction — no headless browser, just strip tags. Returns null on
// any failure (non-fatal to the caller; a page that can't be fetched just contributes less
// context, same "per-item failure is OK" philosophy as the rest of this pipeline).
export async function fetchPageText(url: string, maxChars = 6000): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) return null;

    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();
    return text.slice(0, maxChars) || null;
  } catch {
    return null;
  }
}
