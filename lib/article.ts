export type TiptapMark = { type: string; attrs?: Record<string, unknown> };
export type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
};
export type TiptapDoc = { type: "doc"; content?: TiptapNode[] };

export function isDoc(doc: unknown): doc is TiptapDoc {
  return Boolean(doc && typeof doc === "object" && (doc as { type?: unknown }).type === "doc");
}

export function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "bagian";
}

export function nodeText(node: TiptapNode): string {
  if (typeof node.text === "string") return node.text;
  return (node.content ?? []).map(nodeText).join("");
}

export type Heading = { id: string; text: string; level: number };

// Deterministic heading ids (deduped) — shared by ArticleBody and the TOC so anchors match 1:1.
export function collectHeadings(doc: unknown): Heading[] {
  if (!isDoc(doc)) return [];
  const out: Heading[] = [];
  const counts = new Map<string, number>();
  for (const node of doc.content ?? []) {
    const level = node.attrs?.level;
    if (node.type === "heading" && (level === 2 || level === 3)) {
      const text = nodeText(node).trim();
      const base = slugify(text);
      const seen = counts.get(base) ?? 0;
      counts.set(base, seen + 1);
      out.push({ id: seen > 0 ? `${base}-${seen}` : base, text, level });
    }
  }
  return out;
}

// Learn freshness signal (07 §6): show "Diperbarui" when updated_at > published_at + 7 days.
export function isRecentlyUpdated(publishedAt: string | null, updatedAt: string | null): boolean {
  if (!publishedAt || !updatedAt) return false;
  const p = Date.parse(publishedAt);
  const u = Date.parse(updatedAt);
  if (Number.isNaN(p) || Number.isNaN(u)) return false;
  return u - p > 7 * 86_400_000;
}

export function formatArticleDate(value: string | null, opts?: Intl.DateTimeFormatOptions): string {
  if (!value) return "";
  const t = Date.parse(value);
  if (Number.isNaN(t)) return "";
  return new Date(t).toLocaleDateString("id-ID", opts ?? { day: "2-digit", month: "short", year: "numeric" });
}
