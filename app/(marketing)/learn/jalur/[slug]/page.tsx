import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { PathSyllabus } from "@/components/learn/shell/PathSyllabus";
import { ReviewedStamp } from "@/components/learn/hub/ReviewedStamp";
import { WaLearnCta } from "@/components/learn/cta/WaLearnCta";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { CornerTicks } from "@/components/shared/CornerTicks";
import { JsonLd } from "@/components/shared/JsonLd";
import { MeterDivider } from "@/components/shared/MeterDivider";
import { LEARN_LAUNCH_MIN_LESSONS, learnRobotsMeta } from "@/lib/learn/noindex";
import { getLearnRole } from "@/lib/learn/roles";
import { learnRefPrefix } from "@/lib/learn/wa-ref";
import type { LearnPathLesson } from "@/lib/learn/types";
import { breadcrumbNode } from "@/lib/jsonld";
import { getPublishedLessonCount } from "@/lib/queries/learn/lessons";
import { getLearnPath, getLearnPathLessons, getLearnPathSlugs } from "@/lib/queries/learn/paths";
import { getRedirectDestination } from "@/lib/queries/redirects";
import { getSolutions } from "@/lib/queries/solutions";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

/**
 * /learn/jalur/{slug} — the JALUR pillar page (01 §3.1–§3.2, 03-UI §11.1–§11.2).
 *
 * This is one of only two routed levels in the whole section: `JALUR` →
 * `PELAJARAN`. `Kelas`/`Course` and `Modul` do not exist as pages, tables or CMS
 * objects. Grouping inside a path is a `section_label` string on the ordered
 * join, rendered by `PathSyllabus` as a heading with no URL, no metadata and no
 * review cycle.
 *
 * The page is hand-written prose — `intro_md`, the promise, the outcomes — and
 * then the syllabus. It is NOT a list of lists: the anti-cannibalisation rule
 * (01 §3.4) makes this the "bagaimana ini bekerja / bagaimana saya memutuskan"
 * page, and the commercial answer lives at `/solutions/{slug}`, linked exactly
 * once, in a labelled block, at the bottom.
 *
 * Lessons stay flat at `/learn/{slug}` and are never re-parented under this URL:
 * a lesson genuinely belongs to more than one jalur, and taxonomies get re-cut
 * while addresses must not.
 */

type Params = { slug: string };

const COPY = {
  syllabusHeading: "Silabus",
  syllabusNote:
    "Nomor menunjukkan urutan yang kami sarankan, bukan gerbang. Setiap pelajaran berdiri sendiri dan punya alamat tetap.",
  outcomesHeading: "Setelah jalur ini Anda bisa",
  metaHeading: "Ringkasan jalur",
  metaLessons: "Pelajaran",
  metaMinutes: "Perkiraan baca",
  metaRole: "Ditulis untuk",
  allPaths: "Semua jalur belajar",
  solutionHeading: "Sisi komersialnya",
  solutionBody:
    "Halaman ini menjelaskan cara kerjanya. Kalau yang Anda cari adalah siapa yang mengerjakan dan bagaimana lingkup pekerjaannya, halaman solusi berikut yang menjawab.",
} as const;

/* ------------------------------------------------------------------ *
 * Minimal Markdown for `intro_md`
 *
 * `learn_paths.intro_md` is hand-authored editorial prose written by the ACTA
 * editor, not user input, and this project carries no Markdown dependency —
 * lesson bodies are Tiptap JSON walked by `ArticleBody.tsx`, and adding a parser
 * for two or three pillar pages is not a trade worth making.
 *
 * This renderer builds React elements and never touches `dangerouslySetInnerHTML`,
 * so a stray `<script>` in the column is printed as text rather than executed,
 * and link destinations are validated before they become an `href`. It supports
 * exactly what the editorial style guide uses: h2/h3 (the two levels the Tiptap
 * editor is configured for), paragraphs, bullet and numbered lists, blockquote,
 * and inline bold / italic / code / link. Anything else renders as plain text —
 * degradation is a sentence, never a hole (§11.3).
 * ------------------------------------------------------------------ */

const INLINE_PATTERN =
  /(\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_|`[^`\n]+`|\[[^\]\n]+\]\([^)\s]+\))/;

function safeHref(raw: string): string | null {
  const href = raw.trim();
  if (href.startsWith("//")) return null;
  if (href.startsWith("/") || href.startsWith("#")) return href;
  if (/^https?:\/\//i.test(href) || /^mailto:/i.test(href)) return href;
  return null;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = new RegExp(INLINE_PATTERN.source, "g");
  let cursor = 0;
  let token = 0;
  let match = pattern.exec(text);

  while (match) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    const raw = match[0];
    const key = `${keyPrefix}-i${token}`;
    token += 1;

    if (raw.startsWith("**") || raw.startsWith("__")) {
      nodes.push(
        <strong key={key} className="font-medium text-foreground">
          {raw.slice(2, -2)}
        </strong>,
      );
    } else if (raw.startsWith("`")) {
      nodes.push(
        <code key={key} className="mono-spec rounded-sm bg-muted px-1.5 py-0.5">
          {raw.slice(1, -1)}
        </code>,
      );
    } else if (raw.startsWith("[")) {
      const split = raw.indexOf("](");
      const label = raw.slice(1, split);
      const href = safeHref(raw.slice(split + 2, -1));
      nodes.push(
        href ? (
          <Link
            key={key}
            href={href}
            className="text-accent-text underline decoration-1 underline-offset-4 hover:decoration-2"
          >
            {label}
          </Link>
        ) : (
          label
        ),
      );
    } else {
      nodes.push(<em key={key}>{raw.slice(1, -1)}</em>);
    }

    cursor = match.index + raw.length;
    pattern.lastIndex = cursor;
    match = pattern.exec(text);
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

function renderIntroMarkdown(md: string): ReactNode[] {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let listOrdered = false;
  let quote: string[] = [];
  let key = 0;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const text = paragraph.join(" ").trim();
    paragraph = [];
    if (!text) return;
    blocks.push(
      <p key={`p${key}`} className="body-md text-muted-foreground">
        {renderInline(text, `p${key}`)}
      </p>,
    );
    key += 1;
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    const items = listItems;
    const ordered = listOrdered;
    listItems = [];
    const ListTag = ordered ? "ol" : "ul";
    blocks.push(
      <ListTag key={`l${key}`} className="body-md space-y-2 text-muted-foreground">
        {items.map((item, index) => (
          <li key={index} className="flex gap-3">
            <span aria-hidden className="mono-spec pt-1 tabular-nums text-muted-foreground/60">
              {ordered ? `${index + 1}.` : "—"}
            </span>
            <span className="min-w-0">{renderInline(item, `l${key}-${index}`)}</span>
          </li>
        ))}
      </ListTag>,
    );
    key += 1;
  };

  const flushQuote = () => {
    if (quote.length === 0) return;
    const text = quote.join(" ").trim();
    quote = [];
    if (!text) return;
    blocks.push(
      <blockquote
        key={`q${key}`}
        className="body-md border-l-2 border-primary/60 pl-5 text-muted-foreground"
      >
        {renderInline(text, `q${key}`)}
      </blockquote>,
    );
    key += 1;
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushAll();
      continue;
    }

    const heading = /^(#{2,3})\s+(.*)$/.exec(trimmed);
    if (heading) {
      flushAll();
      const level = heading[1]?.length ?? 2;
      const text = heading[2] ?? "";
      blocks.push(
        level === 2 ? (
          <h2 key={`h${key}`} className="display-md pt-2 text-balance text-foreground">
            {renderInline(text, `h${key}`)}
          </h2>
        ) : (
          <h3 key={`h${key}`} className="heading-lg pt-2 text-foreground">
            {renderInline(text, `h${key}`)}
          </h3>
        ),
      );
      key += 1;
      continue;
    }

    const bullet = /^[-*+]\s+(.*)$/.exec(trimmed);
    if (bullet) {
      flushParagraph();
      flushQuote();
      if (listItems.length > 0 && listOrdered) flushList();
      listOrdered = false;
      listItems.push(bullet[1] ?? "");
      continue;
    }

    const numbered = /^\d+[.)]\s+(.*)$/.exec(trimmed);
    if (numbered) {
      flushParagraph();
      flushQuote();
      if (listItems.length > 0 && !listOrdered) flushList();
      listOrdered = true;
      listItems.push(numbered[1] ?? "");
      continue;
    }

    const quoted = /^>\s?(.*)$/.exec(trimmed);
    if (quoted) {
      flushParagraph();
      flushList();
      quote.push(quoted[1] ?? "");
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(trimmed);
  }

  flushAll();
  return blocks;
}

/* ------------------------------------------------------------------ */

function totalMinutes(steps: readonly LearnPathLesson[]): number {
  return steps.reduce((sum, step) => sum + (step.reading_time ?? 0), 0);
}

export async function generateStaticParams() {
  const slugs = await getLearnPathSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [path, publishedLessons] = await Promise.all([
    getLearnPath(slug),
    getPublishedLessonCount(),
  ]);
  if (!path) return {};

  return {
    ...buildMetadata({
      title: path.seo_title ?? `${path.title} | Learn ACTA`,
      description: path.seo_description ?? path.promise,
      path: `/learn/jalur/${slug}`,
    }),
    robots: learnRobotsMeta(publishedLessons),
  };
}

export default async function LearnJalurPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const path = await getLearnPath(slug);

  if (!path) {
    // Same contract as the lesson route: a jalur that has ever been published
    // must never 404 after a rename.
    const destination = await getRedirectDestination(`/learn/jalur/${slug}`);
    if (destination) permanentRedirect(destination);
    notFound();
  }

  const [steps, publishedLessons, solutions] = await Promise.all([
    getLearnPathLessons(slug),
    getPublishedLessonCount(),
    path.solution_slug ? getSolutions() : Promise.resolve([]),
  ]);

  const minutes = totalMinutes(steps);
  const role = getLearnRole(path.role);
  const indexed = publishedLessons >= LEARN_LAUNCH_MIN_LESSONS;
  const solution = path.solution_slug
    ? (solutions.find((row) => row.slug === path.solution_slug) ?? null)
    : null;

  const meta: readonly { label: string; value: string }[] = [
    { label: COPY.metaLessons, value: `${steps.length}` },
    ...(minutes > 0 ? [{ label: COPY.metaMinutes, value: `±${Math.round(minutes)} menit` }] : []),
    ...(role ? [{ label: COPY.metaRole, value: role.label }] : []),
  ];

  return (
    <>
      {indexed ? (
        <JsonLd
          data={breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Learn", path: "/learn" },
            { name: path.title, path: `/learn/jalur/${slug}` },
          ])}
        />
      ) : null}

      <section className="container py-section">
        <Breadcrumb
          items={[
            { name: "Home", href: "/" },
            { name: "Learn", href: "/learn" },
            { name: path.title },
          ]}
        />

        <header className="mt-8 max-w-[46ch]">
          {path.eyebrow ? (
            <p className="mono-label text-muted-foreground">{path.eyebrow}</p>
          ) : null}
          <h1 className="display-lg mt-4 text-balance">{path.title}</h1>
          <p className="body-lg mt-5 text-muted-foreground">{path.promise}</p>
        </header>

        <div className="mono-spec mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
          <span className="tabular-nums text-foreground">{steps.length} pelajaran</span>
          {minutes > 0 ? (
            <>
              <span aria-hidden className="text-muted-foreground/40">
                ·
              </span>
              <span className="tabular-nums">±{Math.round(minutes)} menit baca</span>
            </>
          ) : null}
          {role ? (
            <>
              <span aria-hidden className="text-muted-foreground/40">
                ·
              </span>
              <span>{role.label}</span>
            </>
          ) : null}
          <span aria-hidden className="text-muted-foreground/40">
            ·
          </span>
          <ReviewedStamp publishedAt={path.published_at} />
        </div>

        {/* Bare meter: `path.eyebrow` above ("JALUR 01") is this viewport's one
            all-caps mono string, and annotating the rule "JALUR" as well would
            say the same word twice (13 §T6/§O7). */}
        <MeterDivider className="mt-8" />
      </section>

      <div className="container grid gap-12 pb-16 md:pb-24 lg:grid-cols-[minmax(0,68ch)_minmax(0,15rem)] lg:gap-16">
        <div>
          {path.intro_md.trim() ? (
            <div className="space-y-5">{renderIntroMarkdown(path.intro_md)}</div>
          ) : null}

          {path.outcome_bullets.length > 0 ? (
            <section className="mt-12 border-t border-border pt-8">
              <h2 className="heading-lg">{COPY.outcomesHeading}</h2>
              <ol className="mt-5 space-y-4">
                {path.outcome_bullets.map((bullet, index) => (
                  <li
                    key={`${index}-${bullet}`}
                    className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4"
                  >
                    <span
                      aria-hidden
                      className="mono-spec pt-1 tabular-nums text-muted-foreground/70"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="body-md text-foreground">{bullet}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {/* No branch renders an empty syllabus: PathSyllabus returns null on an
              empty list, and a jalur below five published lessons never reaches
              `published` in the first place. */}
          {steps.length > 0 ? (
            <section className="mt-12 border-t border-border pt-8">
              <h2 className="display-md">{COPY.syllabusHeading}</h2>
              <p className="body-sm mt-3 max-w-[52ch] text-muted-foreground">
                {COPY.syllabusNote}
              </p>
              <PathSyllabus lessons={steps} className="mt-8" />
            </section>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="relative rounded-[18px] bg-card p-5 ring-1 ring-border">
            <CornerTicks className="rounded-[18px]" size={10} />
            <h2 className="mono-spec text-muted-foreground">{COPY.metaHeading}</h2>
            <dl className="mt-4">
              {meta.map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 last:border-b-0"
                >
                  <dt className="body-sm text-muted-foreground">{row.label}</dt>
                  <dd className="mono-spec tabular-nums text-foreground">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <Link
            href="/learn/jalur"
            className={cn(
              "mono-spec mt-4 inline-flex min-h-11 items-center text-accent-text underline decoration-1",
              "underline-offset-4 hover:decoration-2 focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
          >
            {COPY.allPaths}
          </Link>
        </aside>
      </div>

      <section className="container py-compact">
        {/* The path → solution bridge: exactly once, in a labelled block, at the
            bottom (01 §3.4). `solution_slug` is a soft reference with no FK, so a
            dangling value renders nothing rather than a dead link. */}
        {solution && path.solution_slug ? (
          <div className="grid gap-4 border-t border-border pt-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div>
              <h2 className="heading-lg">{COPY.solutionHeading}</h2>
              <p className="body-sm mt-2 max-w-[56ch] text-muted-foreground">
                {COPY.solutionBody}
              </p>
            </div>
            <Link
              href={`/solutions/${path.solution_slug}`}
              className="mono-spec inline-flex min-h-11 items-center text-accent-text underline decoration-1 underline-offset-4 hover:decoration-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {solution.name ?? "Lihat halaman solusi"}
            </Link>
          </div>
        ) : null}

        {/* The single H2 ask allowed on a jalur (§13.1). A lesson never carries
            this one; a jalur never carries more than one. */}
        <WaLearnCta
          className={cn(solution && "mt-12")}
          cta="jadwal_survey"
          source={{ kind: "jalur", title: path.title, path: `/learn/jalur/${slug}` }}
          refJalur={learnRefPrefix({ kind: "jalur", jalurSlug: slug })}
          slug={slug}
          jalur={slug}
        />
      </section>
    </>
  );
}
