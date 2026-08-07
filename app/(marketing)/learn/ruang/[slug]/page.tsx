import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { AssumptionsList } from "@/components/learn/alat/_shared/AssumptionsList";
import { ReferenceTable } from "@/components/learn/alat/_shared/ReferenceTable";
import { RoomSection } from "@/components/learn/alat/ukuran-layar/RoomSection";
import { WaLearnCta } from "@/components/learn/cta/WaLearnCta";
import { formatReviewMonth } from "@/components/learn/hub/ReviewedStamp";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { CornerTicks } from "@/components/shared/CornerTicks";
import { JsonLd } from "@/components/shared/JsonLd";
import { MeterDivider } from "@/components/shared/MeterDivider";
import { LEARN_TOOL_BASE, TOOL_NAME, type LearnToolSlug } from "@/lib/learn/cta";
import { fmt, fmtFixed } from "@/lib/learn/format";
import { ORG_ID, breadcrumbNode } from "@/lib/jsonld";
import { LEARN_LAUNCH_MIN_LESSONS, learnRobotsMeta } from "@/lib/learn/noindex";
import {
  ROOM_ARCHETYPES,
  ROOM_BASE_PATH,
  ROOM_SPEC_COLUMNS,
  getRoomArchetype,
  pendingMeasurements,
  roomAltDisplayRows,
  roomHref,
  roomNumbers,
  roomSpecRows,
  roomWaDetailLines,
  type RoomArchetype,
  type RoomNumbers,
} from "@/lib/learn/rooms";
import { getLearnLessons, getPublishedLessonCount } from "@/lib/queries/learn/lessons";
import { getLearnToolSlugs } from "@/lib/queries/learn/tools";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site-url";

/**
 * `/learn/ruang/{slug}` — one hand-written room archetype.
 *
 * ## The contract this template enforces
 *
 * Every number on the page comes from `lib/learn/rooms.ts`, which runs the same
 * audited `compute()` functions the public calculators run. Nothing is
 * transcribed. The screen-section diagram is the calculator's own `RoomSection`
 * fed the same `ScreenSizeAnswer` the spec table was built from, so the drawing
 * cannot disagree with the table above it, and neither can disagree with
 * `/learn/alat/ukuran-layar`.
 *
 * Everything that is not a number — prose, failure modes, product joins — is
 * hand-authored per archetype. No parametric generation, ever (04-ROADMAP §17.3
 * "NOT built", R3).
 *
 * ## Structured data
 *
 * `TechArticle` + `BreadcrumbList`. Nothing else — no `FAQPage` (the rich result
 * ended 2026-05-07), no `HowTo` (removed), no `LearningResource`, no `ItemList`
 * (confined to the /learn hub). `citation` names the standards the numbers rest
 * on, which is the cheapest differentiator available here: no Indonesian
 * competitor cites one.
 *
 * ## Caching
 *
 * Tags `learn` and `learn:ruang:{slug}` (03-UI §14.4). The lesson and tool
 * queries carry `learn`; `roomRevision()` below binds the route's cache entry to
 * the per-room tag so a targeted `revalidateTag` can rebuild exactly this page.
 * There is no time-based revalidation anywhere in this codebase — tags are the
 * whole contract.
 */

type Params = { slug: string };

export const dynamic = "force-static";
/** The archetype set is a version-controlled constant; anything else is a 404. */
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return ROOM_ARCHETYPES.map((room) => ({ slug: room.slug }));
}

/**
 * Binds this route's cache entry to `learn:ruang:{slug}`.
 *
 * The archetype body is a constant, so this performs no I/O by design — the
 * value returned is the review date, which is exactly what changes when the page
 * is substantively edited. What the call buys is the tag: with it, publishing a
 * lesson this room links to, or correcting the archetype, can invalidate this one
 * URL instead of the whole `learn` surface.
 */
function roomRevision(slug: string) {
  return unstable_cache(
    async () => getRoomArchetype(slug)?.reviewedAt ?? null,
    ["learn", "ruang", slug],
    { tags: ["learn", `learn:ruang:${slug}`] },
  )();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const room = getRoomArchetype(slug);
  if (!room) return {};

  const publishedLessons = await getPublishedLessonCount();
  return {
    ...buildMetadata({
      title: `${room.seoTitle} | ACTA`,
      description: room.seoDescription,
      path: roomHref(room.slug),
    }),
    robots: learnRobotsMeta(publishedLessons),
  };
}

function techArticleNode(room: RoomArchetype, numbers: RoomNumbers) {
  const path = roomHref(room.slug);
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${absoluteUrl(path)}#article`,
    headline: room.title,
    description: room.seoDescription,
    inLanguage: "id-ID",
    isAccessibleForFree: true,
    datePublished: room.publishedAt,
    // Substantive-review date, never a row's `updated_at` (02-DATA-SEO §9.5).
    dateModified: room.reviewedAt,
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    citation: [...room.standards],
    about: {
      "@type": "Thing",
      name: room.title,
      description: `Ruangan ${fmtFixed(room.inputs.acoustics.length, 1)} × ${fmtFixed(room.inputs.acoustics.width, 1)} × ${fmtFixed(room.inputs.acoustics.height, 1)} m dengan kapasitas ${room.capacity}, waktu dengung hitungan ${fmt(numbers.acoustics.tMid)} detik.`,
    },
    url: absoluteUrl(path),
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(path) },
  };
}

export default async function RuangDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const room = getRoomArchetype(slug);
  if (!room) notFound();

  const [publishedLessons, lessons, publishedToolSlugs] = await Promise.all([
    getPublishedLessonCount(),
    getLearnLessons(),
    getLearnToolSlugs(),
    roomRevision(slug),
  ]);

  const numbers = roomNumbers(room);
  const specRows = roomSpecRows(room, numbers);
  const altRows = roomAltDisplayRows(numbers);
  const pending = pendingMeasurements(room);
  const indexable = publishedLessons >= LEARN_LAUNCH_MIN_LESSONS;
  const reviewedMonth = formatReviewMonth(room.reviewedAt);
  const path = roomHref(room.slug);

  // Resolved against what is actually published — an unresolved slug is dropped.
  const lessonBySlug = new Map(lessons.map((lesson) => [lesson.slug, lesson]));
  const relatedLessons = room.relatedLessons
    .map((lessonSlug) => lessonBySlug.get(lessonSlug))
    .filter((lesson): lesson is NonNullable<typeof lesson> => Boolean(lesson));

  const toolLinks = (Object.keys(TOOL_NAME) as LearnToolSlug[])
    .filter((toolSlug) => publishedToolSlugs.includes(toolSlug))
    .map((toolSlug) => ({
      slug: toolSlug,
      href: `${LEARN_TOOL_BASE}/${toolSlug}`,
      name: TOOL_NAME[toolSlug],
    }));

  const input = room.inputs.acoustics;

  return (
    <>
      {/* Withheld while the launch gate is closed — a BreadcrumbList may contain
          zero items pointing at a noindex URL, and /learn is noindex below the
          lesson threshold. Both lift on the same condition, with no deploy. */}
      {indexable ? (
        <JsonLd
          data={[
            techArticleNode(room, numbers),
            breadcrumbNode([
              { name: "Home", path: "/" },
              { name: "Learn", path: "/learn" },
              { name: "Arsitektur Ruang", path: ROOM_BASE_PATH },
              { name: room.title, path },
            ]),
          ]}
        />
      ) : null}

      <div className="container pt-8 md:pt-10">
        <Breadcrumb
          items={[
            { name: "Home", href: "/" },
            { name: "Learn", href: "/learn" },
            { name: "Arsitektur Ruang", href: ROOM_BASE_PATH },
            { name: room.title },
          ]}
        />
      </div>

      {/* ── Hero: headline anchored to a spec panel on the same row (13 §L7) ── */}
      <header className="container py-compact">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-end lg:gap-14">
          <div>
            <p className="mono-label text-muted-foreground">{room.eyebrow}</p>
            <h1 className="display-lg mt-5 max-w-[16ch] text-pretty">{room.title}</h1>
            <p className="body-lg mt-6 max-w-[54ch] text-muted-foreground">{room.promise}</p>
          </div>

          <div className="relative border border-border bg-card p-6">
            <CornerTicks size={9} />
            <p className="mono-label text-muted-foreground">Ruangan acuan</p>
            <dl className="mt-4 space-y-3">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="body-sm text-muted-foreground">Dimensi</dt>
                <dd className="mono-spec text-foreground">
                  {fmtFixed(input.length, 1)} × {fmtFixed(input.width, 1)} ×{" "}
                  {fmtFixed(input.height, 1)} m
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="body-sm text-muted-foreground">Kapasitas</dt>
                <dd className="mono-spec text-foreground">{room.capacity}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="body-sm text-muted-foreground">RT60 hitungan</dt>
                <dd className="mono-spec text-foreground">
                  {fmt(numbers.acoustics.tMid)} detik
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="body-sm text-muted-foreground">Layar minimum</dt>
                <dd className="mono-spec text-foreground">
                  {fmt(numbers.display.required.diagonalIn)} inci
                </dd>
              </div>
              {reviewedMonth ? (
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="body-sm text-muted-foreground">Ditinjau</dt>
                  <dd className="mono-spec text-foreground">
                    <time dateTime={room.reviewedAt}>{reviewedMonth}</time>
                  </dd>
                </div>
              ) : null}
            </dl>
            <p className="mono-spec mt-5 border-t border-border pt-4 text-muted-foreground">
              {room.standards.join(" · ")}
            </p>
          </div>
        </div>
      </header>

      <div className="container">
        <MeterDivider annotation="DITULIS TANGAN · ANGKA DARI KALKULATOR" />
      </div>

      {/* ── Intro prose ── */}
      <section aria-label="Pengantar" className="container py-compact">
        <div className="max-w-[68ch] space-y-5">
          {room.intro.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="body-md text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      {/* ── The spec table ── */}
      <section aria-labelledby="ringkasan-angka" className="container py-compact">
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
          <h2 id="ringkasan-angka" className="display-md max-w-[22ch] text-pretty">
            Berapa angka acuan untuk ruangan ini?
          </h2>
          <p className="mono-spec text-muted-foreground">{specRows.length} baris</p>
        </div>
        <p className="body-md mt-4 max-w-[62ch] text-muted-foreground">
          Setiap baris di bawah dihitung ulang saat halaman ini dibangun, oleh mesin yang sama
          dengan kalkulator publik di situs ini. Kolom terakhir menyebut mesin dan standarnya,
          supaya Anda bisa memeriksanya sendiri, bukan mempercayainya.
        </p>

        <ReferenceTable
          id={`spesifikasi-${room.slug}`}
          className="mt-8"
          caption={`Angka acuan — ${room.title}`}
          columns={ROOM_SPEC_COLUMNS}
          rows={specRows}
          minWidth="44rem"
          note="Angka hitungan, bukan hasil pengukuran. Nilai yang mengikat di dokumen kontrak adalah nilai terukur di ruangan yang sudah jadi."
        />

        {altRows && numbers.displayAlt ? (
          <ReferenceTable
            id={`spesifikasi-alt-${room.slug}`}
            className="mt-8"
            caption={`Skenario kedua — ${numbers.displayAlt.label}`}
            columns={ROOM_SPEC_COLUMNS}
            rows={altRows}
            minWidth="44rem"
            note="Jenis konten mengubah syarat ukuran layar secara melompat, bukan bergeser sedikit. Dua baris ini adalah ruangan yang sama dengan konten yang berbeda."
          />
        ) : null}
      </section>

      {/* ── The section drawing: the calculator's own renderer, same answer ── */}
      <section aria-labelledby="potongan-ruang" className="container py-compact">
        <h2 id="potongan-ruang" className="display-md max-w-[24ch] text-pretty">
          Bagaimana layar itu duduk di ruangan
        </h2>
        <p className="body-md mt-4 max-w-[62ch] text-muted-foreground">
          Gambar di bawah dibuat oleh komponen yang sama dengan yang dipakai kalkulator ukuran
          layar, dan diberi jawaban yang sama dengan tabel di atas — sehingga gambar dan tabel
          tidak bisa berbeda. Di bawahnya ada tabel data yang memuat isi gambar dalam bentuk teks.
        </p>
        <RoomSection
          answer={numbers.display}
          id={`potongan-${room.slug}`}
          className="mt-8"
        />
      </section>

      {/* ── Design assumptions ── */}
      <section aria-labelledby="catatan-rancangan" className="container py-compact">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-12">
          <div>
            <h2 id="catatan-rancangan" className="display-md max-w-[18ch] text-pretty">
              Asumsi yang menghasilkan angka itu
            </h2>
            <p className="body-sm mt-4 max-w-[40ch] text-muted-foreground">
              Ganti satu asumsi di bawah dan seluruh tabel berubah. Itulah sebabnya asumsinya
              ditulis, bukan disembunyikan di balik kata &ldquo;standar industri&rdquo;.
            </p>
            {toolLinks.length > 0 ? (
              <ul className="mt-6 space-y-2">
                {toolLinks.map((tool) => (
                  <li key={tool.slug}>
                    <Link
                      href={tool.href}
                      className="mono-spec inline-flex min-h-11 items-center text-foreground underline decoration-1 underline-offset-4 transition-colors hover:text-accent-text"
                    >
                      {tool.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <AssumptionsList
            items={room.designNotes}
            title="Asumsi arketipe"
            id={`asumsi-${room.slug}`}
          />
        </div>
      </section>

      {/* ── Failure modes: numbered editorial list, not a card grid (13 §L5) ── */}
      <section aria-labelledby="yang-biasanya-salah" className="container py-section">
        <h2 id="yang-biasanya-salah" className="display-md max-w-[24ch] text-pretty">
          Apa yang biasanya salah di ruangan seperti ini
        </h2>
        <p className="body-md mt-4 max-w-[62ch] text-muted-foreground">
          Ketiganya kami temui berulang di lapangan, dan ketiganya menyalahkan hal yang salah —
          biasanya perangkat, padahal penyebabnya geometri atau akustik.
        </p>

        <ol className="mt-10 space-y-12">
          {room.failureModes.map((mode, index) => {
            const evidence = mode.evidence?.(numbers);
            return (
              <li key={mode.id} className="grid gap-6 border-t border-border pt-8 md:grid-cols-[3rem_minmax(0,1fr)]">
                <span aria-hidden className="mono-spec tabular-nums text-muted-foreground/60">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <h3 className="heading-lg max-w-[34ch] text-pretty">{mode.title}</h3>

                  <dl className="mt-5 space-y-4">
                    <div className="grid gap-x-6 gap-y-1 sm:grid-cols-[7rem_minmax(0,1fr)]">
                      <dt className="mono-label pt-1 text-muted-foreground">Gejala</dt>
                      <dd className="body-sm max-w-[64ch] text-foreground">{mode.symptom}</dd>
                    </div>
                    <div className="grid gap-x-6 gap-y-1 sm:grid-cols-[7rem_minmax(0,1fr)]">
                      <dt className="mono-label pt-1 text-muted-foreground">Sebab</dt>
                      <dd className="body-sm max-w-[64ch] text-muted-foreground">{mode.cause}</dd>
                    </div>
                    <div className="grid gap-x-6 gap-y-1 sm:grid-cols-[7rem_minmax(0,1fr)]">
                      <dt className="mono-label pt-1 text-muted-foreground">Perbaikan</dt>
                      <dd className="body-sm max-w-[64ch] text-muted-foreground">{mode.fix}</dd>
                    </div>
                  </dl>

                  {evidence ? (
                    <p className="mono-spec mt-5 max-w-[70ch] border-l-2 border-primary/60 pl-4 text-foreground">
                      {evidence}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ── The measurement gap, stated rather than filled with invention ── */}
      {pending.length > 0 ? (
        <section aria-labelledby="pengukuran-acta" className="container py-compact">
          <div className="relative border border-dashed border-primary/70 bg-card p-6 md:p-8">
            <CornerTicks size={9} />
            <p className="mono-label text-accent-text">PERLU DATA ACTA</p>
            <h2 id="pengukuran-acta" className="heading-lg mt-4 max-w-[34ch] text-pretty">
              Yang belum kami ukur di ruangan nyata
            </h2>
            <p className="body-sm mt-4 max-w-[64ch] text-muted-foreground">
              Semua angka di halaman ini adalah hitungan dari koefisien publikasi, dan itu ditulis
              apa adanya. Slot di bawah menunggu pengukuran lapangan ACTA. Kami membiarkannya
              kosong dan terlihat, bukan mengisinya dengan angka yang terdengar meyakinkan —
              karena data terukur adalah satu-satunya bagian dari halaman ini yang tidak bisa
              dibuat ulang siapa pun hanya dengan menulis ulang teksnya.
            </p>

            <ul className="mt-8 space-y-6">
              {pending.map((measurement) => (
                <li key={measurement.id} className="border-t border-border pt-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <h3 className="heading-md max-w-[46ch] text-pretty">{measurement.label}</h3>
                    <span className="mono-label text-accent-text">Belum diisi</span>
                  </div>
                  <dl className="mt-3 space-y-2">
                    <div className="grid gap-x-6 sm:grid-cols-[7rem_minmax(0,1fr)]">
                      <dt className="mono-label pt-1 text-muted-foreground">Metode</dt>
                      <dd className="body-sm max-w-[62ch] text-muted-foreground">
                        {measurement.method}
                      </dd>
                    </div>
                    <div className="grid gap-x-6 sm:grid-cols-[7rem_minmax(0,1fr)]">
                      <dt className="mono-label pt-1 text-muted-foreground">Kenapa</dt>
                      <dd className="body-sm max-w-[62ch] text-muted-foreground">
                        {measurement.why}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ── Product and solution joins ── */}
      <section aria-labelledby="sistem-terkait" className="container py-compact">
        <h2 id="sistem-terkait" className="display-md max-w-[24ch] text-pretty">
          Sistem yang kami pasang di ruangan seperti ini
        </h2>
        <ul className="mt-8 divide-y divide-border border-y border-border">
          {room.joins.map((join) => (
            <li key={join.href}>
              <Link
                href={join.href}
                className="group grid min-h-11 gap-2 py-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-8"
              >
                <span className="min-w-0">
                  <span className="mono-label block text-muted-foreground">
                    {join.kind === "solusi" ? "Solusi" : "Katalog"}
                  </span>
                  <span className="heading-md mt-2 block decoration-1 underline-offset-4 group-hover:underline group-hover:decoration-primary">
                    {join.label}
                  </span>
                </span>
                <span className="body-sm max-w-[62ch] text-muted-foreground">{join.why}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Related lessons, only when they exist ── */}
      {relatedLessons.length > 0 ? (
        <section aria-labelledby="pelajaran-terkait" className="container py-compact">
          <h2 id="pelajaran-terkait" className="heading-lg">
            Pelajaran yang menjelaskan angka di halaman ini
          </h2>
          <ul className="mt-6 space-y-1">
            {relatedLessons.map((lesson) => (
              <li key={lesson.slug}>
                <Link
                  href={`/learn/${lesson.slug}`}
                  className="body-md inline-flex min-h-11 items-center text-foreground underline decoration-1 underline-offset-4 transition-colors hover:text-accent-text"
                >
                  {lesson.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ── One commercial ask, at the end (03-UI §13.1) ── */}
      <section className="container pb-expansive pt-compact">
        <WaLearnCta
          cta="tanya_engineer"
          source={{ kind: "lesson", title: room.title, path }}
          detailLines={roomWaDetailLines(room, numbers)}
          resultUrl={path}
          slug={room.slug}
          className="max-w-[56ch]"
        />
      </section>
    </>
  );
}
