import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { draftMode } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { ArticleBody } from "@/components/article/ArticleBody";
import { LessonCta, type LessonPrimaryCta } from "@/components/learn/cta/LessonCta";
import { SaveButton } from "@/components/learn/save/SaveButton";
import { LessonNav, type LessonNavRelated } from "@/components/learn/shell/LessonNav";
import {
  LessonSubHeader,
  buildLessonCrumbs,
  reviewedStamp,
  type LessonCrumb,
  type LessonPathRef,
} from "@/components/learn/shell/LessonSubHeader";
import { LessonToc, LESSON_TOC_MIN_HEADINGS } from "@/components/learn/shell/LessonToc";
import { JsonLd } from "@/components/shared/JsonLd";
import { MeterDivider } from "@/components/shared/MeterDivider";
import { collectHeadings, isDoc, type TiptapDoc } from "@/lib/article";
import { humanCtaFor, resolveLessonCta } from "@/lib/learn/cta";
import { learnRobotsMeta } from "@/lib/learn/noindex";
import { primaryRoleFromTags } from "@/lib/learn/roles";
import type { LearnLesson, LearnPathLesson, LessonPathContext } from "@/lib/learn/types";
import { learnRefPrefix } from "@/lib/learn/wa-ref";
import { ORG_ID, breadcrumbNode } from "@/lib/jsonld";
import { mediaUrl } from "@/lib/media";
import { getArticleBySlug, getRelatedArticles } from "@/lib/queries/articles";
import { getLearnLesson, getLearnLessonSlugs, getPublishedLessonCount } from "@/lib/queries/learn/lessons";
import { getLessonPrimaryPath, groupSyllabusSections } from "@/lib/queries/learn/paths";
import { getRedirectDestination } from "@/lib/queries/redirects";
import { buildMetadata } from "@/lib/seo";
import { SITE_URL, absoluteUrl } from "@/lib/site-url";
import { cn } from "@/lib/utils";

type Params = { slug: string };

/**
 * SSG over every published lesson, plus on-demand rendering for anything new
 * (§14.1). Caching is TAG-BASED ONLY — `getLearnLesson()` carries `learn` and
 * `learn:{slug}`, and there is no time-based revalidation anywhere in this
 * codebase, so a page is fresh until a mutation fires its tag and stale forever
 * if one is missed. Do not add `revalidate = N` here.
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getLearnLessonSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const [lesson, publishedLessons] = await Promise.all([getLearnLesson(slug), getPublishedLessonCount()]);
  if (!lesson) return {};

  // OG image comes from ./opengraph-image.tsx (branded template + cover) — no ogImage here.
  const meta = buildMetadata({
    title: lesson.seo_title ?? `${lesson.title} | ACTA`,
    description: lesson.seo_description ?? lesson.excerpt,
    path: `/learn/${slug}`,
  });

  // The launch gate is data-driven and self-resolving: /learn/* becomes indexable
  // the moment the 8th lesson publishes and the `learn` tag revalidates. No flag,
  // no env var, no deploy (§P0-4).
  return { ...meta, robots: learnRobotsMeta(publishedLessons) };
}

/* ------------------------------------------------------------------ *
 * JSON-LD — TechArticle + BreadcrumbList, and nothing else (§8.4)
 * ------------------------------------------------------------------ */

/**
 * `TechArticle`, built here rather than in `lib/jsonld.ts`, because
 * `articleNode()` emits `Article` and maps `dateModified` from `updated_at` —
 * both wrong for a lesson.
 *
 * `dateModified` maps from **`reviewed_at`, never `updated_at`**. A typo fix
 * restamps `updated_at`; it must not restamp freshness. When a lesson has never
 * been technically re-read, the key is omitted entirely rather than backfilled
 * from `published_at` — an unverified freshness claim is worth less than none.
 *
 * Nothing else ships on this page: no `FAQPage` (the rich result ended
 * 2026-05-07), no `HowTo` (removed), no `LearningResource`, no `Course`
 * (Course Info retired June 2025; `ItemList` + `Course` live only on the /learn
 * hub, the one place Google's Course List carousel still applies).
 */
function techArticleNode(input: {
  headline: string;
  description?: string | null;
  image?: string | null;
  datePublished?: string | null;
  reviewedAt?: string | null;
  authorName?: string | null;
  authorRole?: string | null;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: input.headline,
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: [input.image] } : {}),
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.reviewedAt ? { dateModified: input.reviewedAt } : {}),
    ...(input.authorName
      ? {
          author: {
            "@type": "Person",
            name: input.authorName,
            ...(input.authorRole ? { jobTitle: input.authorRole } : {}),
          },
        }
      : {}),
    publisher: { "@id": ORG_ID },
    inLanguage: "id-ID",
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(input.path) },
    url: absoluteUrl(input.path),
  };
}

/* ------------------------------------------------------------------ *
 * Searcher mode: hoist the lede above the fold
 * ------------------------------------------------------------------ */

/**
 * Split a leading `answerBlock` (+ an immediately following `specBlock`) out of
 * the body so the template can render them **above the cover image** — the exact
 * order 01 §5.2 specifies: breadcrumb → H1 → meta → JAWABAN SINGKAT → RINGKASAN
 * CEPAT → cover → body.
 *
 * This is the whole searcher/student resolution, and it is **ordering, not
 * modes** (§5.4): ~70–80% of traffic arrives from Google on one lesson holding a
 * question, and it must be answered before any teaching prose. A reader who
 * leaves at 15% scroll got the answer; at 60%, the answer plus a worked example;
 * at 100%, everything. Student chrome — syllabus rail, prev/next, Simpan — sits
 * *around* the column and removing all of it still leaves a complete lesson.
 *
 * Heading ids are unaffected: `collectHeadings` walks heading nodes only, and the
 * hoisted lede contains none, so the TOC anchors computed over the full document
 * match the ids `ArticleBody` emits over the remainder, one for one.
 */
function splitLessonLede(doc: unknown): { lede: TiptapDoc | null; body: TiptapDoc | null } {
  if (!isDoc(doc)) return { lede: null, body: null };
  const content = doc.content ?? [];
  const first = content[0];
  if (!first || first.type !== "answerBlock") return { lede: null, body: doc };

  const second = content[1];
  const end = second && second.type === "specBlock" ? 2 : 1;
  return {
    lede: { type: "doc", content: content.slice(0, end) },
    body: { type: "doc", content: content.slice(end) },
  };
}

/** TUJUAN, read off the RINGKASAN CEPAT block so it can also render under the H1. */
function objectiveFromLede(lede: TiptapDoc | null): string | null {
  for (const node of lede?.content ?? []) {
    if (node.type !== "specBlock") continue;
    const rows = node.attrs?.rows;
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      if (typeof row !== "object" || row === null) continue;
      const { label, value } = row as { label?: unknown; value?: unknown };
      if (typeof label !== "string" || !/^tujuan$/i.test(label.trim())) continue;
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * Student mode: the syllabus rail
 * ------------------------------------------------------------------ */

/**
 * The curriculum rail — **fully server-rendered, including every lesson title**
 * (01 §4.2). It is high-value internal linking for the topic cluster and must not
 * depend on JS, on `localStorage`, on a referrer or on a query param: path
 * context comes from `is_primary` on the lesson's own row, so the rail renders
 * identically for every visitor and the page stays SSG.
 *
 * Zero checkmarks, zero progress, zero `3/8` completion counter. The current row
 * is marked with the `ArticleToc` amber segment (`w-5 bg-primary` against
 * `w-2.5 bg-border`) and nothing else. An unpublished lesson is *absent*, not
 * greyed: `getLearnPathLessons()` joins published-on-both-sides, so a
 * planned-but-unwritten step is unrepresentable rather than shown as a promise.
 */
function SyllabusRail({
  path,
  steps,
  currentArticleId,
}: {
  path: LessonPathContext["path"];
  steps: readonly LearnPathLesson[];
  currentArticleId: string;
}) {
  const sections = groupSyllabusSections(steps);

  return (
    <nav aria-label={`Daftar pelajaran jalur ${path.title}`} className="print:hidden">
      <p className="mono-label text-muted-foreground">JALUR</p>
      <Link
        href={`/learn/jalur/${path.slug}`}
        className="heading-md mt-2 block text-balance text-foreground transition-colors hover:text-accent-text"
      >
        {path.title}
      </Link>
      <p className="mono-spec mt-1 text-muted-foreground">{steps.length} pelajaran</p>

      <div className="mt-6 space-y-6">
        {sections.map((section, sectionIndex) => (
          <div key={`${section.label ?? "tanpa-bagian"}-${sectionIndex}`}>
            {section.label ? (
              <p className="mono-label mb-3 text-muted-foreground/80">{section.label}</p>
            ) : null}
            <ul className="space-y-1">
              {section.lessons.map((step) => {
                const isCurrent = step.article_id === currentArticleId;
                const marker = (
                  <span
                    aria-hidden
                    className={cn(
                      "mt-2 h-0.5 shrink-0 rounded-full",
                      isCurrent ? "w-5 bg-primary" : "w-2.5 bg-border group-hover:bg-foreground/40",
                    )}
                  />
                );
                return (
                  <li key={step.article_id}>
                    {isCurrent ? (
                      <span
                        aria-current="page"
                        className="flex min-h-11 items-start gap-3 py-1.5 pr-1"
                      >
                        {marker}
                        <span className="body-sm text-foreground">{step.title}</span>
                      </span>
                    ) : (
                      <Link
                        href={`/learn/${step.slug}`}
                        className={cn(
                          "group flex min-h-11 items-start gap-3 rounded-sm py-1.5 pr-1",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        )}
                      >
                        {marker}
                        <span className="body-sm text-muted-foreground transition-colors group-hover:text-foreground">
                          {step.title}
                        </span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ *
 * Print (03-UI §11.6) — a first-class requirement on /learn/[slug]
 * ------------------------------------------------------------------ */

/**
 * Procurement people print lessons into tender folders, and nobody else in this
 * market designs for it. Route-scoped rather than global because only the three
 * long-form learn routes need it; move it to `app/globals.css` when
 * `/learn/ruang/*` and `/learn/alat/*` want the same treatment.
 *
 * The token override is the load-bearing rule: a Control Room (dark) page prints
 * as a black rectangle, so the light palette is forced regardless of the reader's
 * theme. Only the tokens this page actually paints with are restated.
 */
const PRINT_CSS = `
@media print {
  :root, .dark {
    --background: 48 20% 95%;
    --foreground: 220 6% 10%;
    --card: 45 40% 98%;
    --muted: 48 14% 91%;
    --muted-foreground: 222 5% 38%;
    --border: 45 13% 88%;
    --primary: 36 69% 52%;
    --accent-text: 36 70% 33%;
    --status: 149 51% 49%;
    --status-text: 149 55% 30%;
    --destructive: 0 70% 45%;
    color-scheme: light;
  }
  body { background: #fff; }
  body > header, body > footer { display: none !important; }
  /* Every <details> prints open: the tender folder gets the arithmetic and the
     diagram data tables, not a row of collapsed summaries. Two mechanisms,
     because engines disagree on how a closed <details> hides its content. */
  details > summary { display: none !important; }
  details:not([open]) > *:not(summary) { display: block !important; }
  details::details-content { content-visibility: visible !important; }
  #lesson-content a[href^="/"]::after {
    content: " (${SITE_URL.replace(/^https?:\/\//, "")}" attr(href) ")";
    font-size: 0.75em;
    color: #555;
    word-break: break-all;
  }
}
`;

/** Off-screen until focused, then a real, visible, hit-target-sized control. */
const SKIP_LINK = cn(
  "mono-label sr-only rounded-md bg-card px-4 py-3 text-foreground ring-1 ring-border",
  "focus:not-sr-only focus:absolute focus:left-0 focus:top-0 focus:z-30 focus:inline-flex focus:min-h-11 focus:items-center",
);

/* ------------------------------------------------------------------ */

export default async function LearnLessonPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const lesson = await getLearnLesson(slug);

  if (!lesson) {
    // draftMode()'s `isEnabled` getter does not call `trackDynamicDraftMode`, so
    // reading it here does NOT opt this route out of prerendering (§14.1).
    const { isEnabled: preview } = await draftMode();
    if (preview) {
      // A draft has no reviewed_at, no path membership and no CTA budget, so it
      // gets the reading surface only — enough to check copy before publishing.
      const draft = await getArticleBySlug("learn", slug, { preview: true });
      if (draft) {
        return (
          <article className="container max-w-[72ch] py-section">
            <p className="mono-label text-accent-text">PRATINJAU DRAF</p>
            <h1 className="display-lg mt-4 text-balance">{draft.title}</h1>
            {draft.excerpt ? <p className="body-lg mt-4 text-muted-foreground">{draft.excerpt}</p> : null}
            <div className="mt-10">
              <ArticleBody doc={draft.body} />
            </div>
          </article>
        );
      }
    }
    const destination = await getRedirectDestination(`/learn/${slug}`);
    if (destination) permanentRedirect(destination);
    notFound();
  }

  const pathContext = await getLessonPrimaryPath(lesson.id);
  // Curated related reading is fetched only for orphans — it is what LessonNav
  // renders instead of prev/next, and a path lesson never shows it.
  const relatedRows = pathContext ? [] : await getRelatedArticles("learn", slug, lesson.tags ?? []);

  return (
    <LessonView lesson={lesson} pathContext={pathContext} relatedRows={relatedRows} />
  );
}

type RelatedRow = { slug: string | null; title: string | null; excerpt: string | null };

function LessonView({
  lesson,
  pathContext,
  relatedRows,
}: {
  lesson: LearnLesson;
  pathContext: LessonPathContext | null;
  relatedRows: readonly RelatedRow[];
}) {
  const { slug } = lesson;
  const lessonPath = `/learn/${slug}`;

  const pathRef: LessonPathRef | null = pathContext
    ? {
        title: pathContext.path.title,
        slug: pathContext.path.slug,
        position: pathContext.position,
        total: pathContext.total,
        section: pathContext.current.section_label,
      }
    : null;

  const crumbs: LessonCrumb[] = buildLessonCrumbs({ title: lesson.title, slug, path: pathRef });

  const { lede, body } = splitLessonLede(lesson.body);
  const objective = objectiveFromLede(lede);
  const headings = collectHeadings(lesson.body).filter((heading) => heading.level === 2);
  const hasToc = headings.length >= LESSON_TOC_MIN_HEADINGS;

  const cover = lesson.cover_is_placeholder
    ? null
    : mediaUrl({ storage_path: lesson.cover_image_path, external_url: lesson.cover_image_url_ext });

  const role = primaryRoleFromTags(lesson.tags);

  // §13.1 via lib/learn/cta: nothing in the first 40% of a jalur, then every
  // third lesson counted backwards from the last, so the final lesson always
  // carries the ask and density stays ≤ 1:3. An orphan gets its role's CTA once.
  const ctaId = pathContext
    ? resolveLessonCta({ position: pathContext.position, total: pathContext.total, role: role?.id ?? null })
    : humanCtaFor(role?.id ?? null);

  const primaryCta: LessonPrimaryCta | null =
    ctaId === "tanya_engineer" || ctaId === "review_spesifikasi"
      ? {
          kind: "whatsapp",
          cta: ctaId,
          source: { kind: "lesson", title: lesson.title, path: lessonPath },
          refJalur: learnRefPrefix({
            kind: "pelajaran",
            jalurSlug: pathContext?.path.slug,
            slug,
          }),
          refIndex: pathContext?.position ?? null,
          slug,
          jalur: pathContext?.path.slug ?? null,
        }
      : null;

  const related: LessonNavRelated[] = relatedRows
    .filter((row): row is RelatedRow & { slug: string; title: string } => Boolean(row.slug && row.title))
    .slice(0, 4)
    .map((row) => ({ href: `/learn/${row.slug}`, title: row.title, excerpt: row.excerpt }));

  const jsonLd = [
    // Every crumb is an indexable URL when the page itself is indexable: /learn
    // and /learn/* share one launch gate, so the hub is never noindex while a
    // lesson is indexed. The middle crumb is the pillar page /learn/jalur/{slug},
    // never a `?topik=` facet (§4.4).
    breadcrumbNode(crumbs),
    techArticleNode({
      headline: lesson.title,
      description: lesson.excerpt,
      image: cover,
      datePublished: lesson.published_at,
      reviewedAt: lesson.reviewed_at,
      authorName: lesson.author_name,
      authorRole: lesson.author_role,
      path: lessonPath,
    }),
  ];

  const gridClass = pathContext
    ? cn(
        "lg:grid lg:grid-cols-[224px_minmax(0,1fr)] lg:gap-x-12",
        "xl:grid-cols-[240px_minmax(0,72ch)_252px] xl:gap-x-16",
      )
    : "xl:grid xl:grid-cols-[minmax(0,72ch)_252px] xl:gap-x-16";

  return (
    <>
      <JsonLd data={jsonLd} />
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <div className="container py-section">
        {/* Skip links (§11.6). Visible on focus, never a hidden keyboard trap.
            Two TOC links, each scoped to the viewport where its target actually
            exists — a skip link that lands on a `display:none` element is worse
            than no skip link, because it silently drops focus. */}
        <div className="relative print:hidden">
          <a href="#lesson-content" className={SKIP_LINK}>
            Lompat ke isi
          </a>
          {hasToc ? (
            <>
              <a href="#lesson-toc" className={cn(SKIP_LINK, "xl:hidden")}>
                Lompat ke daftar isi
              </a>
              <a href="#lesson-toc-rail" className={cn(SKIP_LINK, "hidden xl:inline")}>
                Lompat ke daftar isi
              </a>
            </>
          ) : null}
        </div>

        <div className={gridClass}>
          {/* ── Left: where am I in the CURRICULUM ────────────────────── */}
          {pathContext ? (
            <aside className="hidden lg:col-start-1 lg:row-start-1 lg:block">
              <div className="sticky top-28 max-h-[calc(100vh-7rem)] overflow-y-auto [scrollbar-gutter:stable]">
                <SyllabusRail
                  path={pathContext.path}
                  steps={pathContext.steps}
                  currentArticleId={lesson.id}
                />
              </div>
            </aside>
          ) : null}

          {/* ── Right: where am I in this DOCUMENT ────────────────────────
              The rail exists only at ≥1280px, where there is a third column to
              put it in. Below that the same two controls render inside the
              content column, AFTER the answer — see the `xl:hidden` block below.
              Rendering them twice under mutually exclusive media queries keeps
              exactly one of each in the accessibility tree at any viewport, and
              is the only arrangement that puts the mobile TOC after the H1
              instead of above it (the H1 is the LCP element, §14.6).

              No CTA lives in the rail: §13.1 forbids an ask above the first H2,
              and the rail's flow position is above the content on narrow
              viewports. The end-of-lesson slot owns the single ask. */}
          <aside
            className={cn(
              "hidden xl:block xl:row-start-1",
              pathContext ? "xl:col-start-3" : "xl:col-start-2",
            )}
          >
            <div className="sticky top-28 max-h-[calc(100vh-7rem)] overflow-y-auto [scrollbar-gutter:stable]">
              {hasToc ? <LessonToc id="lesson-toc-rail" variant="rail" headings={headings} /> : null}
              <div className={cn("print:hidden", hasToc && "mt-6")}>
                <SaveButton articleId={lesson.id} title={lesson.title} />
              </div>
            </div>
          </aside>

          {/* ── Content ───────────────────────────────────────────────── */}
          <article
            className={cn(
              "min-w-0",
              pathContext
                ? "lg:col-start-2 lg:row-start-1 xl:col-start-2 xl:row-start-1"
                : "xl:col-start-1 xl:row-start-1",
            )}
          >
            <LessonSubHeader
              title={lesson.title}
              crumbs={crumbs}
              path={pathRef}
              objective={objective}
              tags={lesson.tags}
              readingTime={lesson.reading_time}
              reviewedAt={lesson.reviewed_at}
            />

            {/* JAWABAN SINGKAT + RINGKASAN CEPAT — above the cover, by design. */}
            {lede ? (
              <div className="mt-8 space-y-6">
                <ArticleBody doc={lede} />
              </div>
            ) : null}

            {/* The rail's two controls, below 1280px, in flow — after the answer
                so a searcher never has to scroll past chrome to reach it. */}
            <div className="mt-8 space-y-6 xl:hidden">
              <div className="print:hidden">
                <SaveButton articleId={lesson.id} title={lesson.title} />
              </div>
              {hasToc ? <LessonToc id="lesson-toc" variant="inline" headings={headings} /> : null}
            </div>

            {cover ? (
              <figure className="mt-10">
                <div className="relative aspect-[16/9] overflow-hidden rounded-[22px] bg-muted ring-1 ring-border">
                  <Image
                    src={cover}
                    alt={lesson.cover_image_alt ?? lesson.title}
                    fill
                    sizes="(min-width: 1280px) 648px, (min-width: 1024px) 612px, 100vw"
                    className="object-cover"
                  />
                </div>
                {lesson.cover_caption || lesson.cover_credit ? (
                  <figcaption className="caption mt-2 text-muted-foreground">
                    {[lesson.cover_caption, lesson.cover_credit].filter(Boolean).join(" · ")}
                  </figcaption>
                ) : null}
              </figure>
            ) : null}

            <div id="lesson-content" className="mt-10 scroll-mt-32">
              <ArticleBody doc={body} />
            </div>

            <div className="mt-12 print:hidden">
              <MeterDivider />
              <p className="body-sm mt-4 text-muted-foreground">
                Ditulis oleh{" "}
                <Link href="/about#tim" className="text-accent-text underline underline-offset-2 hover:text-foreground">
                  {lesson.author_name}
                </Link>
                {lesson.author_role ? ` · ${lesson.author_role}` : ""}
                {reviewedStamp(lesson.reviewed_at) ? ` · ${reviewedStamp(lesson.reviewed_at)}` : ""}
              </p>
            </div>

            <LessonCta primary={primaryCta} secondary={null} />

            <LessonNav
              previous={
                pathContext?.previous
                  ? {
                      href: `/learn/${pathContext.previous.slug}`,
                      title: pathContext.previous.title,
                      index: pathContext.position - 1,
                      section: pathContext.previous.section_label,
                    }
                  : null
              }
              next={
                pathContext?.next
                  ? {
                      href: `/learn/${pathContext.next.slug}`,
                      title: pathContext.next.title,
                      index: pathContext.position + 1,
                      section: pathContext.next.section_label,
                    }
                  : null
              }
              path={pathContext ? { title: pathContext.path.title, slug: pathContext.path.slug } : null}
              related={related}
            />

            {/* Print footer: the URL and the review date, so a page pulled out of
                a tender folder can still be traced back and dated. */}
            <div className="mono-spec mt-10 hidden border-t border-border pt-4 text-muted-foreground print:block">
              <p>{absoluteUrl(lessonPath)}</p>
              <p>
                {[reviewedStamp(lesson.reviewed_at), "ACTA — PT ACTA Solusi Teknologi"]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
