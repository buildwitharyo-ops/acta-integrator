import type { Metadata } from "next";
import Link from "next/link";
import { GlossaryEntry, type GlossaryEntryLink } from "@/components/learn/glossary/GlossaryEntry";
import { GlossaryIndex } from "@/components/learn/glossary/GlossaryIndex";
import { formatReviewMonth } from "@/components/learn/hub/ReviewedStamp";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { CornerTicks } from "@/components/shared/CornerTicks";
import { JsonLd } from "@/components/shared/JsonLd";
import { MeterDivider } from "@/components/shared/MeterDivider";
import {
  GLOSSARY_PATH,
  GLOSSARY_PUBLISHED_AT,
  GLOSSARY_REVIEWED_AT,
  GLOSSARY_TERM_COUNT,
  REGISTER_LABEL,
  alternateNames,
  glossaryAlphabet,
  glossaryGroups,
  glossaryLetterAnchor,
  glossarySummary,
  inlineDefinedTerms,
  type GlossaryTerm,
} from "@/lib/learn/glossary";
import { ORG_ID, breadcrumbNode } from "@/lib/jsonld";
import { LEARN_LAUNCH_MIN_LESSONS, learnRobotsMeta } from "@/lib/learn/noindex";
import { getLearnLessons, getPublishedLessonCount } from "@/lib/queries/learn/lessons";
import { getLearnTools } from "@/lib/queries/learn/tools";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site-url";

/**
 * `/learn/glosarium` — ONE page, one `#anchor` per term (02-DATA-SEO §8.5, D8).
 *
 * **Why this is not 150 URLs.** The brief implied a full glossary section. The
 * adjudicated decision deleted it: 150 per-term pages behind a real quality bar
 * is 45,000 words and 150 diagrams on a team publishing 2.5 lessons a month —
 * arithmetically impossible, so the bar gets waived under deadline. The risk is
 * not a page-level penalty; it is **index selection operating on the directory
 * in aggregate**, which means 130 thin stubs would be paid for out of the 24
 * lessons the whole strategy is bet on. One dense page keeps 100% of the
 * internal-linking and entity-grounding value, and makes a kill-switch
 * unnecessary because there is no shard to lose. A term graduates to its own URL
 * only when Search Console shows that anchor earning impressions.
 *
 * **Zero client JavaScript on this route.** Exit criterion 3 of 04-ROADMAP §17.3
 * is a ≥90 mobile Lighthouse score with ~54 entries in the HTML, so there is no
 * in-page search here — the command palette on the hub covers that — no
 * disclosure widgets, and no motion wrappers. Every affordance is an anchor.
 *
 * **Prerendered.** No `searchParams`, no dynamic input, so the page is
 * `force-static` and invalidated only by the `learn` cache tag, which the lesson
 * and tool queries below carry. There is no time-based revalidation anywhere in
 * this codebase.
 */
export const dynamic = "force-static";

const COPY = {
  eyebrow: "GLOSARIUM AV",
  headline: "Satu istilah, tiga bahasa yang berbeda.",
  lede: "Pembeli menyebutnya videotron. Datasheet menyebutnya LED display. Dokumen tender menyebutnya layar LED. Halaman ini menyatukan ketiganya untuk setiap istilah, supaya rapat dan dokumen berhenti membicarakan benda berbeda dengan kata yang sama.",
  howHeading: "Cara membaca halaman ini",
  howBody:
    "Tiap entri membuka dengan satu kalimat definisi, lalu menjelaskan batas dan konsekuensinya. Di mana sebuah nilai berasal dari standar, standarnya disebut namanya. Di mana kami belum memverifikasi angkanya, kami menjelaskan konsepnya tanpa mengarang angka — dan mengatakan begitu.",
  registerNote:
    "Tiga baris di tiap entri adalah tiga kosakata yang dipakai untuk benda yang sama.",
  scopeNote:
    "Halaman ini satu URL. Tiap istilah punya jangkar sendiri yang bisa ditautkan langsung, tetapi tidak punya halaman sendiri — dan itu keputusan, bukan keterbatasan.",
} as const;

const REGISTER_EXPLAINER: readonly { label: string; body: string }[] = [
  {
    label: REGISTER_LABEL.pembeli,
    body: "Kata yang dipakai klien, pengguna, dan pemilik gedung saat menyampaikan keluhan atau permintaan.",
  },
  {
    label: REGISTER_LABEL.integrator,
    body: "Kata yang dipakai insinyur dan datasheet. Sebagian besar berbahasa Inggris dan memang dipakai begitu di lapangan Indonesia.",
  },
  {
    label: REGISTER_LABEL.spesifikasi,
    body: "Kata yang muncul di RKS, BoQ, dan dokumen tender. Kosakata ini hanya ada dalam bahasa Indonesia, dan justru inilah yang menentukan siapa yang menang tender.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const publishedLessons = await getPublishedLessonCount();
  return {
    ...buildMetadata({
      title: "Glosarium Audio Visual — Istilah AV dalam Tiga Bahasa | ACTA",
      description: `Kamus istilah audio visual berbahasa Indonesia: ${GLOSSARY_TERM_COUNT} istilah, masing-masing dengan kosakata pembeli, integrator, dan dokumen RKS, serta standar yang menjadi acuannya.`,
      path: GLOSSARY_PATH,
    }),
    // The /learn launch gate (P0-4). Data-driven and self-resolving — see
    // lib/learn/noindex.ts. `follow` stays true in both states.
    robots: learnRobotsMeta(publishedLessons),
  };
}

/**
 * `DefinedTermSet` (02-DATA-SEO §8.4). The inline `hasDefinedTerm` list is capped
 * at 40 refs by `inlineDefinedTerms()`; above that the payload stops summarising
 * the page and starts duplicating it.
 *
 * `alternateName` is the load-bearing field: it carries all three registers, and
 * it is how English-register queries get captured without shipping an English
 * twin site — the bilingual decision in §8.5 is Bahasa Indonesia only, no
 * `hreflang`, not now and not at month 24.
 */
function definedTermSetNode(terms: readonly GlossaryTerm[]) {
  const setId = `${absoluteUrl(GLOSSARY_PATH)}#glosarium`;
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "@id": setId,
    name: "Glosarium Audio Visual ACTA",
    description:
      "Istilah sistem audio visual dalam bahasa pembeli, bahasa integrator, dan bahasa dokumen RKS.",
    url: absoluteUrl(GLOSSARY_PATH),
    inLanguage: "id-ID",
    publisher: { "@id": ORG_ID },
    hasDefinedTerm: terms.map((term) => ({
      "@type": "DefinedTerm",
      "@id": `${absoluteUrl(GLOSSARY_PATH)}#${term.id}`,
      name: term.term,
      alternateName: alternateNames(term),
      description: glossarySummary(term),
      url: `${absoluteUrl(GLOSSARY_PATH)}#${term.id}`,
      inDefinedTermSet: { "@id": setId },
    })),
  };
}

/**
 * `TechArticle` for the page as a written work. No `FAQPage` (the rich result
 * ended 2026-05-07), no `HowTo` (removed), no `LearningResource`.
 *
 * `dateModified` maps to the hand-maintained review date, never to a row's
 * `updated_at` — §9.5's rule that a typo fix must not claim a review.
 */
function techArticleNode(standards: readonly string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${absoluteUrl(GLOSSARY_PATH)}#article`,
    headline: "Glosarium Audio Visual: Istilah AV dalam Tiga Bahasa",
    description:
      "Kamus istilah audio visual berbahasa Indonesia yang menyatukan kosakata pembeli, integrator, dan dokumen tender untuk setiap istilah.",
    inLanguage: "id-ID",
    isAccessibleForFree: true,
    datePublished: GLOSSARY_PUBLISHED_AT,
    dateModified: GLOSSARY_REVIEWED_AT,
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    citation: [...standards],
    url: absoluteUrl(GLOSSARY_PATH),
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(GLOSSARY_PATH) },
  };
}

export default async function GlosariumPage() {
  const [lessons, tools, publishedLessons] = await Promise.all([
    getLearnLessons(),
    getLearnTools(),
    getPublishedLessonCount(),
  ]);

  // Related links resolve against what is actually published. An unresolved slug
  // is dropped, never rendered as a dead link or a "segera hadir" promise.
  const lessonBySlug = new Map(lessons.map((lesson) => [lesson.slug, lesson]));
  const toolBySlug = new Map(tools.map((tool) => [tool.slug, tool]));

  function lessonLinks(term: GlossaryTerm): GlossaryEntryLink[] {
    const out: GlossaryEntryLink[] = [];
    for (const slug of term.related?.lessons ?? []) {
      const lesson = lessonBySlug.get(slug);
      if (lesson) out.push({ href: `/learn/${lesson.slug}`, label: lesson.title });
    }
    return out;
  }

  function toolLinks(term: GlossaryTerm): GlossaryEntryLink[] {
    const out: GlossaryEntryLink[] = [];
    for (const slug of term.related?.tools ?? []) {
      const tool = toolBySlug.get(slug);
      if (tool) out.push({ href: `/learn/alat/${tool.slug}`, label: tool.name });
    }
    return out;
  }

  const groups = glossaryGroups();
  const letters = glossaryAlphabet();

  // Every standard named anywhere in the glossary, deduped — the `citation`
  // array, and the single cheapest differentiator in this market: no Indonesian
  // competitor cites a standard next to its terminology.
  const standards = [
    ...new Set(
      groups.flatMap((group) => group.terms.flatMap((term) => term.standards ?? [])),
    ),
  ].sort((a, b) => a.localeCompare(b, "id"));

  const indexable = publishedLessons >= LEARN_LAUNCH_MIN_LESSONS;
  const reviewedMonth = formatReviewMonth(GLOSSARY_REVIEWED_AT);

  return (
    <>
      {/* BreadcrumbList must contain zero items pointing at a noindex URL
          (02-DATA-SEO §8.4). While the launch gate is closed, /learn and this
          page are both noindex, so the whole payload is withheld rather than
          shipped with crumbs that point into a noindexed section. Gate and
          markup lift together, on the same threshold, with no deploy. */}
      {indexable ? (
        <JsonLd
          data={[
            definedTermSetNode(inlineDefinedTerms()),
            techArticleNode(standards),
            breadcrumbNode([
              { name: "Home", path: "/" },
              { name: "Learn", path: "/learn" },
              { name: "Glosarium", path: GLOSSARY_PATH },
            ]),
          ]}
        />
      ) : null}

      <div className="container pt-8 md:pt-10">
        <Breadcrumb
          items={[
            { name: "Home", href: "/" },
            { name: "Learn", href: "/learn" },
            { name: "Glosarium" },
          ]}
        />
      </div>

      {/* Hero — anchored to a spec panel on the same row (13 §L7), not centred
          in an empty viewport. */}
      <header className="container py-compact">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-end lg:gap-14">
          <div>
            <p className="mono-label text-muted-foreground">{COPY.eyebrow}</p>
            <h1 className="display-lg mt-5 max-w-[18ch] text-pretty">{COPY.headline}</h1>
            <p className="body-lg mt-6 max-w-[52ch] text-muted-foreground">{COPY.lede}</p>
          </div>

          <div className="relative border border-border bg-card p-6">
            <CornerTicks size={9} />
            <p className="mono-label text-muted-foreground">Isi halaman</p>
            <dl className="mt-4 space-y-3">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="body-sm text-muted-foreground">Istilah</dt>
                <dd className="mono-spec text-foreground">{GLOSSARY_TERM_COUNT}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="body-sm text-muted-foreground">Kosakata per istilah</dt>
                <dd className="mono-spec text-foreground">3</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="body-sm text-muted-foreground">Standar dirujuk</dt>
                <dd className="mono-spec text-foreground">{standards.length}</dd>
              </div>
              {reviewedMonth ? (
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="body-sm text-muted-foreground">Ditinjau</dt>
                  <dd className="mono-spec text-foreground">
                    <time dateTime={GLOSSARY_REVIEWED_AT}>{reviewedMonth}</time>
                  </dd>
                </div>
              ) : null}
            </dl>
            <p className="caption mt-5 border-t border-border pt-4 text-muted-foreground">
              {COPY.scopeNote}
            </p>
          </div>
        </div>
      </header>

      <div className="container">
        <MeterDivider annotation={COPY.registerNote} />
      </div>

      {/* How to read — opens mid-narrative, no eyebrow/headline/grid stack. */}
      <section aria-labelledby="cara-membaca" className="container py-section">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] md:gap-12">
          <div>
            <h2 id="cara-membaca" className="heading-lg text-pretty">
              {COPY.howHeading}
            </h2>
            <p className="body-md mt-4 max-w-[42ch] text-muted-foreground">{COPY.howBody}</p>
          </div>
          <dl className="space-y-5">
            {REGISTER_EXPLAINER.map((row) => (
              <div key={row.label} className="border-t border-border pt-4">
                <dt className="mono-label text-muted-foreground">{row.label}</dt>
                <dd className="body-sm mt-2 max-w-[56ch] text-foreground">{row.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* The glossary itself: sticky letter rail beside the entries. */}
      <div className="container pb-expansive">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_14rem] lg:gap-14">
          <div className="order-2 lg:order-1">
            {groups.map((group) => (
              <section
                key={group.letter}
                aria-labelledby={glossaryLetterAnchor(group.letter)}
                className="pt-12 first:pt-0"
              >
                <h2
                  id={glossaryLetterAnchor(group.letter)}
                  className="display-md scroll-mt-28 text-muted-foreground/70 md:scroll-mt-32"
                >
                  {group.letter}
                </h2>

                <div className="mt-6 space-y-10">
                  {group.terms.map((term) => (
                    <GlossaryEntry
                      key={term.id}
                      term={term}
                      lessonLinks={lessonLinks(term)}
                      toolLinks={toolLinks(term)}
                    />
                  ))}
                </div>
              </section>
            ))}

            <div className="relative mt-16 border border-border bg-card p-6 md:p-8">
              <CornerTicks size={9} />
              <p className="mono-label text-muted-foreground">Standar yang dirujuk halaman ini</p>
              <p className="mono-spec mt-4 max-w-[70ch] text-foreground">
                {standards.join(" · ")}
              </p>
              <p className="body-sm mt-5 max-w-[62ch] text-muted-foreground">
                Kami menyebut nama dan nomor standar, bukan mengutip tabelnya. Di mana angka yang
                beredar untuk sebuah standar saling bertentangan dan belum kami periksa terhadap
                dokumen aslinya, kami menuliskan konsepnya dan menahan angkanya — lihat entri{" "}
                <Link
                  href="#iscr"
                  className="underline decoration-1 underline-offset-4 hover:text-accent-text"
                >
                  Kontras Sistem Citra (ISCR)
                </Link>
                .
              </p>
            </div>
          </div>

          <aside className="order-1 lg:order-2">
            <GlossaryIndex letters={letters} total={GLOSSARY_TERM_COUNT} />
          </aside>
        </div>
      </div>
    </>
  );
}
