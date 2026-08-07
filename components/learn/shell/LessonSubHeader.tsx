import Link from "next/link";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { LessonObjective } from "@/components/learn/body/LessonObjective";
import { formatArticleDate } from "@/lib/article";
import { primaryRoleFromTags } from "@/lib/learn/roles";

/** A crumb in the shape both the visible trail and the JSON-LD need. */
export type LessonCrumb = { name: string; path: string };

/** The single parent that drives breadcrumb, prev/next and the pillar link. */
export type LessonPathRef = {
  title: string;
  slug: string;
  /** 1-based position inside the published syllabus. */
  position: number;
  /** `steps.length` — never a count taken from the join table. */
  total: number;
  /** The `section_label` run this lesson sits in, if any. */
  section?: string | null;
};

export type LessonSubHeaderProps = {
  title: string;
  /**
   * Built by the route with {@link buildLessonCrumbs} and passed to the
   * `BreadcrumbList` node from the same array — that shared array is what makes
   * the 1:1 mirror a fact rather than a convention.
   */
  crumbs: readonly LessonCrumb[];
  /** `null` for an orphan lesson — a normal, costless state (§8.1). */
  path?: LessonPathRef | null;
  /** TUJUAN, from the lesson's RINGKASAN CEPAT. */
  objective?: string | null;
  /** `articles.tags[]`. The role chip and the `bentuk` label are read from it. */
  tags?: readonly string[] | null;
  readingTime?: number | null;
  /** `articles.reviewed_at` — never `updated_at`. */
  reviewedAt?: string | null;
  id?: string;
  className?: string;
};

const BENTUK_PREFIX = "bentuk:";

const BENTUK_LABEL: Record<string, string> = {
  konsep: "Konsep",
  hitungan: "Hitungan",
  spesifikasi: "Spesifikasi",
  checklist: "Checklist",
  "studi-kasus": "Studi kasus",
};

function bentukFromTags(tags: readonly string[] | null | undefined): string | null {
  for (const tag of tags ?? []) {
    if (!tag.startsWith(BENTUK_PREFIX)) continue;
    const id = tag.slice(BENTUK_PREFIX.length);
    return BENTUK_LABEL[id] ?? null;
  }
  return null;
}

/** "Ditinjau Jul 2026" — the only editorial act that survives a fully-booked month. */
export function reviewedStamp(reviewedAt: string | null | undefined): string | null {
  const formatted = formatArticleDate(reviewedAt ?? null, { month: "short", year: "numeric" });
  return formatted ? `Ditinjau ${formatted}` : null;
}

/**
 * The breadcrumb trail for a lesson, in one place so the visible trail and the
 * `BreadcrumbList` JSON-LD are mirrored 1:1 by construction (01 §4.4).
 *
 * **The middle crumb points at `/learn/jalur/{slug}` — a real, indexable pillar
 * page — and never at `/learn?topik={slug}`.** That facet URL is `noindex`;
 * emitting a followed internal link to it from the highest-authority position on
 * every lesson, then asserting it as a hierarchy node in structured data, either
 * kills the breadcrumb rich result or indexes the facet.
 *
 * Where a lesson has no path, the trail drops to three levels. **A shorter trail
 * is valid; a trail through a noindex node is not.**
 */
export function buildLessonCrumbs(input: {
  title: string;
  slug: string;
  path?: LessonPathRef | null;
}): LessonCrumb[] {
  const crumbs: LessonCrumb[] = [
    { name: "Home", path: "/" },
    { name: "Learn", path: "/learn" },
  ];
  if (input.path) {
    crumbs.push({ name: input.path.title, path: `/learn/jalur/${input.path.slug}` });
  }
  crumbs.push({ name: input.title, path: `/learn/${input.slug}` });
  return crumbs;
}

/**
 * The lesson header: breadcrumb, curriculum position, H1, objective and the meta
 * rail (01 §5.2 items 1–3).
 *
 * **The `<h1>` is the LCP element** (§14.6), so it is final in the server HTML
 * with no entrance animation and no `opacity: 0` — a fade here is a direct LCP
 * regression on a 4G Android, which is the device this platform is budgeted for.
 *
 * Two rules the meta rail encodes:
 *
 *  • **`Pelajaran 3 dari 7` is a position, not progress.** It is true for every
 *    visitor on first paint, needs no state, and survives the WhatsApp in-app
 *    webview's separate storage partition — unlike anything that counts what the
 *    reader has finished. There is deliberately no `3/8` completion counter
 *    anywhere on this page (01 §5.5).
 *  • **`Ditinjau` reads `reviewed_at`, never `updated_at` or `published_at`.**
 *    A typo fix must not restamp freshness; a re-read must. That distinction is
 *    the whole value of the stamp.
 *
 * The mobile path bar is `sticky top-[72px] h-10`, under the existing 72px navbar
 * — together exactly 112px, which is why `ArticleBody` anchors headings at
 * `scroll-mt-32` (8rem = 128px) rather than 28 (01 §4.5): at 28 an anchored
 * heading lands flush against this bar's bottom edge with no clearance at all.
 */
export function LessonSubHeader({
  title,
  crumbs,
  path = null,
  objective,
  tags,
  readingTime,
  reviewedAt,
  id,
  className,
}: LessonSubHeaderProps) {
  const role = primaryRoleFromTags(tags);
  const bentuk = bentukFromTags(tags);
  const stamp = reviewedStamp(reviewedAt);

  const meta = [
    bentuk,
    readingTime ? `${readingTime} menit baca` : null,
    stamp,
  ].filter((part): part is string => Boolean(part));

  return (
    <header id={id} className={className}>
      {path ? (
        // Mobile chrome layer 2 (01 §4.3): where am I, one tap back to the jalur.
        // Sticky, full-bleed, square, hairline — never a floating rounded pill (C7).
        <div className="sticky top-[72px] z-20 -mx-6 mb-6 border-b border-border bg-background/95 backdrop-blur-sm lg:hidden print:hidden">
          <div className="flex h-10 items-center justify-between gap-4 px-6">
            <Link
              href={`/learn/jalur/${path.slug}`}
              className="caption truncate text-muted-foreground transition-colors hover:text-foreground"
            >
              ‹ {path.title}
            </Link>
            <span className="mono-spec shrink-0 text-muted-foreground">
              {path.position}/{path.total}
            </span>
          </div>
        </div>
      ) : null}

      <Breadcrumb
        className="print:hidden"
        items={crumbs.map((crumb, index) => ({
          name: crumb.name,
          href: index === crumbs.length - 1 ? undefined : crumb.path,
        }))}
      />

      <h1 className="display-lg mt-5 text-balance">{title}</h1>

      {objective ? <LessonObjective className="mt-5" text={objective} /> : null}

      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
        {role ? (
          <span className="caption rounded-pill px-2.5 py-1 text-muted-foreground ring-1 ring-border">
            {role.label}
          </span>
        ) : null}
        {meta.length > 0 ? (
          <p className="mono-spec text-muted-foreground">{meta.join(" · ")}</p>
        ) : null}
        {path ? (
          <p className="mono-spec hidden text-muted-foreground lg:block">
            Pelajaran {path.position} dari {path.total}
            {path.section ? ` · ${path.section}` : ""}
          </p>
        ) : null}
      </div>
    </header>
  );
}
