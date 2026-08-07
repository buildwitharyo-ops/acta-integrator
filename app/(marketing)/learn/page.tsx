import type { Metadata } from "next";
import Link from "next/link";
import { LearnHero } from "@/components/learn/hub/LearnHero";
import { LessonRow } from "@/components/learn/hub/LessonRow";
import { PathCard } from "@/components/learn/hub/PathCard";
import { formatReviewMonth } from "@/components/learn/hub/ReviewedStamp";
import { RoleChips } from "@/components/learn/hub/RoleChips";
import { SearchTrigger } from "@/components/learn/hub/SearchTrigger";
import { ToolCard } from "@/components/learn/hub/ToolCard";
import { CornerTicks } from "@/components/shared/CornerTicks";
import { JsonLd } from "@/components/shared/JsonLd";
import { MeterDivider } from "@/components/shared/MeterDivider";
import { Reveal } from "@/components/shared/Reveal";
import { LEARN_LAUNCH_MIN_LESSONS, learnRobotsMeta } from "@/lib/learn/noindex";
import { LEARN_ROLES, getLearnRole, rolesFromTags, type LearnRoleId } from "@/lib/learn/roles";
import { buildSearchCorpus, clampExcerpt, plainText } from "@/lib/learn/search/corpus";
import { TOOL_ENTRIES } from "@/lib/learn/tool-registry";
import type { LearnLesson, LearnPath, LearnPathLesson, LearnTool } from "@/lib/learn/types";
import { ORG_ID, breadcrumbNode, itemListNode } from "@/lib/jsonld";
import { getLearnLessons, getPublishedLessonCount } from "@/lib/queries/learn/lessons";
import { getLearnPathLessons, getLearnPaths } from "@/lib/queries/learn/paths";
import { getLearnTools } from "@/lib/queries/learn/tools";
import { getPageSections } from "@/lib/queries/pages";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site-url";

/**
 * /learn — the hub (01 §3.2, 02 §7.4, 03-UI §11.2).
 *
 * **This page reads no `searchParams`, by design.** It used to await
 * `{ topic, page }`, which made the most-linked page in the section render
 * dynamically on every request in order to perform an in-memory `Array.filter`
 * over ~18 rows, and it minted an unbounded `?topic=&page=` facet space that
 * then had to be kept out of the index. Both problems are deleted rather than
 * managed:
 *
 *   • Topic navigation is now real `<a>` links to `/learn/jalur/{slug}` pillar
 *     pages — indexable destinations that earn their own traffic, and legal
 *     `BreadcrumbList` nodes, which `?topic=` never was.
 *   • Role filtering is a client island that writes `history.replaceState`. The
 *     complete, unfiltered list stays in this page's server HTML.
 *   • There is no pagination. If the corpus ever outgrows one page, `?page=2..n`
 *     gets `noindex` — but building it now would re-introduce the facet space
 *     for a list that fits on one screen of a phone.
 *
 * The result is a `force-static` page: prerendered at build, served from the CDN,
 * and invalidated only by the `learn` cache tag. There is no time-based
 * revalidation anywhere in this codebase, so the tag is the whole contract.
 */
export const dynamic = "force-static";

type HubIntro = {
  eyebrow?: string;
  headline?: string;
  subheadline?: string;
};

const COPY = {
  eyebrow: "PUSAT BELAJAR ACTA",
  headline: "Belajar sistem audio visual dari orang yang memasangnya.",
  lede: "Setiap angka di sini punya sumber, setiap rumus ditampilkan perhitungannya. Bukan brosur — bahan untuk Anda memutuskan sendiri.",
  specNote:
    "Setiap materi menyebut standar yang dipakai — ISO, ANSI/AVIXA, IEC atau SNI — dan bulan terakhir ditinjau.",
  searchLabel: "Cari pelajaran, jalur, alat, atau istilah",
  pathsHeading: "Mulai dari jalur, bukan dari daftar.",
  pathsBody:
    "Satu jalur menyusun pelajaran dalam urutan yang masuk akal: memahami masalahnya, mengukurnya, lalu menuliskannya di dokumen yang bisa ditenderkan.",
  toolsHeading: "Hitung dulu, baru bicara anggaran.",
  toolsBody:
    "Kalkulator di sini menampilkan langkah perhitungan, asumsi, dan standar yang dipakai. Hasilnya bisa Anda periksa — bukan angka yang keluar dari kotak hitam.",
  toolsAll: "Semua alat hitung",
  lessonsHeading: "Semua pelajaran",
  lessonsBody:
    "Tidak setiap pelajaran masuk jalur. Daftar ini lengkap, terbaru di atas, dan tetap terbaca tanpa JavaScript.",
  referenceHeading: "Acuan cepat",
  referenceBody:
    "Tiga halaman yang paling sering dibuka ulang saat sedang menyusun dokumen atau menjelaskan ke atasan.",
} as const;

const REFERENCE_LINKS: readonly { href: string; title: string; body: string }[] = [
  {
    href: "/learn/ruang",
    title: "Arsitektur Ruang",
    body: "Ruang rapat, auditorium, dan rumah ibadah — lengkap dengan angka acuan per tipe ruang.",
  },
  {
    href: "/learn/glosarium",
    title: "Glosarium AV",
    body: "Satu halaman istilah: bahasa pembeli, bahasa integrator, dan bahasa RKS untuk hal yang sama.",
  },
  {
    href: "/learn/jalur",
    title: "Semua jalur belajar",
    body: "Daftar lengkap jalur beserta silabusnya, kalau Anda ingin melihat cakupannya sekaligus.",
  },
];

/**
 * `Course.description` truncates in the Course List carousel past roughly 60
 * characters, so the promise is cut on a word boundary rather than shipped long
 * and clipped by Google.
 */
function courseDescription(promise: string): string {
  const clean = promise.replace(/\s+/g, " ").trim();
  if (clean.length <= 60) return clean;
  const cut = clean.slice(0, 59);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 30 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:—-]$/, "")}…`;
}

/**
 * `ItemList` + `Course` — the ONE page on this site where `Course` earns
 * anything (02 §8.4). Google's Course List carousel requires **≥3** courses plus
 * a provider; below that the markup is inert at best and invalid at worst, so
 * the caller omits it entirely rather than shipping a carousel that cannot
 * render. `hasCourseInstance` is deliberately absent — it implies scheduled
 * cohorts ACTA does not run — and `isAccessibleForFree` is the honest signal.
 */
function courseListNode(paths: readonly LearnPath[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: paths.map((path, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Course",
        "@id": `${absoluteUrl(`/learn/jalur/${path.slug}`)}#course`,
        url: absoluteUrl(`/learn/jalur/${path.slug}`),
        name: path.title,
        description: courseDescription(path.promise),
        inLanguage: "id-ID",
        isAccessibleForFree: true,
        provider: { "@id": ORG_ID },
      },
    })),
  };
}

function totalMinutes(steps: readonly LearnPathLesson[]): number {
  return steps.reduce((sum, step) => sum + (step.reading_time ?? 0), 0);
}

function toolSummary(tool: LearnTool): string {
  return clampExcerpt(plainText(tool.intro_md), 130);
}

function newestReview(lessons: readonly LearnLesson[]): string | null {
  let newest: string | null = null;
  for (const lesson of lessons) {
    const candidate = lesson.reviewed_at ?? lesson.published_at;
    if (!candidate) continue;
    if (!newest || Date.parse(candidate) > Date.parse(newest)) newest = candidate;
  }
  return newest;
}

export async function generateMetadata(): Promise<Metadata> {
  const publishedLessons = await getPublishedLessonCount();
  return {
    ...buildMetadata({
      title: "Learn ACTA — Belajar Sistem Audio Visual dengan Angka dan Standar",
      description:
        "Jalur belajar, kalkulator akustik dan layar, arsitektur ruang, dan glosarium AV berbahasa Indonesia. Setiap angka menyebut standarnya.",
      path: "/learn",
    }),
    // The launch gate (P0-4). Data-driven and self-resolving: the moment the
    // eighth lesson publishes and the `learn` tag revalidates, this flips to
    // index with no deploy and no flag. `follow` is true in both states so links
    // out of /learn keep flowing.
    robots: learnRobotsMeta(publishedLessons),
  };
}

export default async function LearnHubPage() {
  const [paths, lessons, tools, publishedLessons, sections] = await Promise.all([
    getLearnPaths(),
    getLearnLessons(),
    getLearnTools(),
    getPublishedLessonCount(),
    getPageSections("learn_hub"),
  ]);

  // One query per path; there are two or three of them and every one is cached
  // under `learn` + `jalur:{slug}`, so this is a build-time cost, not a runtime one.
  const syllabi = await Promise.all(paths.map((path) => getLearnPathLessons(path.slug)));

  const intro = (sections["intro"] ?? {}) as HubIntro;

  const roleCounts = LEARN_ROLES.reduce(
    (acc, role) => {
      acc[role.id] = lessons.filter((lesson) => lesson.tags.includes(role.tag)).length;
      return acc;
    },
    {} as Record<LearnRoleId, number>,
  );

  // The registry decides which calculators exist; a CMS row only reorders them and
  // may supply a better intro. Union the two the same way /learn/alat does, so the
  // hub links the tools even before an editor has written a single `learn_tools`
  // row — on day one the calculators are the ONLY publishable content in the
  // section, and a hub that hides them because a table is empty hides the product.
  const seenToolKeys = new Set(tools.map((tool) => tool.component_key));
  const hubTools = [
    ...tools.map((tool) => ({
      key: tool.component_key,
      slug: tool.slug,
      name: tool.name,
      summary: toolSummary(tool),
      standardRef: tool.standard_ref,
    })),
    ...TOOL_ENTRIES.filter((entry) => !seenToolKeys.has(entry.key)).map((entry) => ({
      key: entry.key,
      slug: entry.slug,
      name: entry.name,
      summary: entry.intro,
      // The DB overlay stores one `standard_ref` string; the registry holds the
      // full standards list. Show the primary one so both sources render the same
      // shape of chip.
      standardRef: entry.standards[0]?.name ?? null,
    })),
  ];

  const docs = buildSearchCorpus({ lessons, paths, tools });
  const paletteJalur = paths.map((path) => ({
    label: path.title,
    href: `/learn/jalur/${path.slug}`,
    hint: path.promise,
  }));

  const reviewMonth = formatReviewMonth(newestReview(lessons));

  const specs = [
    { label: "pelajaran", value: String(lessons.length) },
    ...(paths.length > 0 ? [{ label: "jalur", value: String(paths.length) }] : []),
    ...(hubTools.length > 0 ? [{ label: "alat hitung", value: String(hubTools.length) }] : []),
    ...(reviewMonth ? [{ label: "ditinjau", value: reviewMonth }] : []),
  ];

  // Structured data is emitted only once the section is indexable. Below the
  // gate every /learn URL is `noindex`, and a `BreadcrumbList` whose nodes all
  // point at noindex URLs asserts a hierarchy Google is being told to ignore —
  // and an `ItemList` of Courses on a noindex hub can never surface a carousel.
  const indexed = publishedLessons >= LEARN_LAUNCH_MIN_LESSONS;
  const jsonLd: object[] = [];
  if (indexed) {
    jsonLd.push(
      breadcrumbNode([
        { name: "Home", path: "/" },
        { name: "Learn", path: "/learn" },
      ]),
    );
    if (paths.length >= 3) {
      jsonLd.push(courseListNode(paths));
    } else if (paths.length > 0) {
      // Below three published jalur the Course carousel cannot render, so the
      // list ships as a plain ItemList of pages — no Course markup at all.
      jsonLd.push(
        itemListNode(paths.map((path) => ({ name: path.title, path: `/learn/jalur/${path.slug}` }))),
      );
    }
  }

  return (
    <>
      {jsonLd.length > 0 ? <JsonLd data={jsonLd} /> : null}

      <LearnHero
        eyebrow={intro.eyebrow ?? COPY.eyebrow}
        headline={intro.headline ?? COPY.headline}
        lede={intro.subheadline ?? COPY.lede}
        specs={specs}
        specNote={COPY.specNote}
      >
        <SearchTrigger
          docs={docs}
          jalur={paletteJalur}
          label={COPY.searchLabel}
          variant="field"
        />
      </LearnHero>

      {paths.length > 0 ? (
        <section className="container py-section">
          {/* No mono annotation here on purpose: the two PathCard eyebrows below
              ("JALUR 01", "JALUR 02") already spend this viewport's two-all-caps-
              mono-strings budget (13 §T6). */}
          <MeterDivider />

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-16">
            <h2 className="display-lg max-w-[18ch] text-balance">{COPY.pathsHeading}</h2>
            <p className="body-md max-w-[46ch] text-muted-foreground lg:pt-2">
              {COPY.pathsBody}
            </p>
          </div>

          <Reveal className="mt-10 grid gap-5 md:grid-cols-2">
            {paths.map((path, index) => {
              const steps = syllabi[index] ?? [];
              const minutes = totalMinutes(steps);
              return (
                <PathCard
                  key={path.id}
                  href={`/learn/jalur/${path.slug}`}
                  title={path.title}
                  eyebrow={path.eyebrow}
                  promise={path.promise}
                  lessonCount={steps.length}
                  totalMinutes={minutes > 0 ? minutes : null}
                  roleLabel={getLearnRole(path.role)?.label ?? null}
                  publishedAt={path.published_at}
                />
              );
            })}
          </Reveal>
        </section>
      ) : null}

      {hubTools.length > 0 ? (
        <section className="container py-compact">
          <div className="relative overflow-hidden rounded-[26px] bg-muted/50 p-6 ring-1 ring-border sm:p-10">
            <CornerTicks className="rounded-[26px]" size={14} />

            <div className="grid gap-8 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-16">
              <div>
                <p className="mono-spec text-muted-foreground">
                  {hubTools.length} kalkulator · perhitungan ditampilkan
                </p>
                <h2 className="display-md mt-4 text-balance">{COPY.toolsHeading}</h2>
                <p className="body-md mt-4 max-w-[40ch] text-muted-foreground">
                  {COPY.toolsBody}
                </p>
                <Link
                  href="/learn/alat"
                  className="mono-spec mt-6 inline-flex min-h-11 items-center text-accent-text underline decoration-1 underline-offset-4 hover:decoration-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {COPY.toolsAll}
                </Link>
              </div>

              <Reveal>
                {hubTools.map((tool, index) => (
                  <ToolCard
                    key={tool.key}
                    href={`/learn/alat/${tool.slug}`}
                    name={tool.name}
                    summary={tool.summary}
                    standardRef={tool.standardRef}
                    index={index + 1}
                  />
                ))}
              </Reveal>
            </div>
          </div>
        </section>
      ) : null}

      {lessons.length > 0 ? (
        <section className="container py-section">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-b border-border pb-5">
            <h2 className="display-md">{COPY.lessonsHeading}</h2>
            <p className="mono-spec tabular-nums text-muted-foreground">
              {lessons.length} pelajaran
            </p>
          </div>

          <p className="body-md mt-5 max-w-[52ch] text-muted-foreground">
            {COPY.lessonsBody}
          </p>

          <RoleChips
            className="mt-8"
            counts={roleCounts}
            total={lessons.length}
            listClassName="border-t border-border"
          >
            <ul>
              {lessons.map((lesson) => (
                <LessonRow
                  key={lesson.id}
                  href={`/learn/${lesson.slug}`}
                  title={lesson.title}
                  excerpt={lesson.excerpt}
                  roleIds={rolesFromTags(lesson.tags).map((role) => role.id)}
                  readingTime={lesson.reading_time}
                  reviewedAt={lesson.reviewed_at}
                  publishedAt={lesson.published_at}
                />
              ))}
            </ul>
          </RoleChips>
        </section>
      ) : null}

      <section className="container py-compact">
        <div className="grid gap-8 border-t border-border pt-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
          <div>
            <h2 className="display-md text-balance">{COPY.referenceHeading}</h2>
            <p className="body-sm mt-3 max-w-[34ch] text-muted-foreground">
              {COPY.referenceBody}
            </p>
          </div>

          <ul>
            {REFERENCE_LINKS.map((item) => (
              <li key={item.href} className="border-b border-border last:border-b-0">
                <Link
                  href={item.href}
                  className="group flex min-h-11 flex-col justify-center py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <span className="heading-md decoration-1 underline-offset-4 group-hover:decoration-primary group-hover:underline">
                    {item.title}
                  </span>
                  <span className="body-sm mt-1 max-w-[52ch] text-muted-foreground">
                    {item.body}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
