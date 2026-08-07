import type { Metadata } from "next";
import Link from "next/link";
import { RoomArchetypeCard } from "@/components/learn/hub/RoomArchetypeCard";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { CornerTicks } from "@/components/shared/CornerTicks";
import { JsonLd } from "@/components/shared/JsonLd";
import { MeterDivider } from "@/components/shared/MeterDivider";
import { LEARN_TOOL_BASE, TOOL_NAME, type LearnToolSlug } from "@/lib/learn/cta";
import { breadcrumbNode } from "@/lib/jsonld";
import { LEARN_LAUNCH_MIN_LESSONS, learnRobotsMeta } from "@/lib/learn/noindex";
import { ROOM_BASE_PATH, roomSummaries } from "@/lib/learn/rooms";
import { getPublishedLessonCount } from "@/lib/queries/learn/lessons";
import { getLearnToolSlugs } from "@/lib/queries/learn/tools";
import { buildMetadata } from "@/lib/seo";

/**
 * `/learn/ruang` — the room archetype index.
 *
 * Three pages ship here, and the cap is **eight in year one, hand-written, ≤2 per
 * month** (04-ROADMAP §17.3, R3). The page says that out loud, because the
 * alternative shape — a dimensions table permuted into forty URLs — is the
 * competitor's content farm with better typography, and the penalty for it is
 * site-wide index-selection demotion rather than a page-level ranking loss. It
 * would therefore be paid for out of the lessons and the calculators.
 *
 * `ItemList` is deliberately absent. 02-DATA-SEO §8.4 confines `ItemList` and
 * `Course` to the /learn hub, which is the one surface where Google's Course List
 * carousel still applies. Marking a three-item index as a list earns nothing and
 * spends a rule.
 *
 * Prerendered: the archetypes are version-controlled constants and the only query
 * is the launch-gate lesson count, so this is `force-static` behind the `learn`
 * cache tag.
 */
export const dynamic = "force-static";

const COPY = {
  eyebrow: "ARSITEKTUR RUANG",
  headline: "Tiga ruangan, dihitung sampai selesai.",
  lede: "Setiap angka di halaman-halaman ini keluar dari kalkulator yang sama dengan yang bisa Anda jalankan sendiri di situs ini. Bukan angka pengalaman, bukan angka yang disalin dari brosur — hasil mesin yang perhitungannya ditampilkan.",
  capHeading: "Kenapa hanya tiga, dan kenapa tidak akan pernah empat puluh",
  capBody: [
    "Membuat halaman ruangan secara otomatis itu mudah. Ambil tabel dimensi, kalikan dengan jenis ruangan, terbitkan empat puluh URL yang isinya hanya berbeda angka. Hasilnya terlihat seperti perpustakaan dan berperilaku seperti pabrik konten.",
    "Kami tidak melakukannya, dan alasannya bukan idealisme. Mesin pencari menilai sebuah direktori secara agregat: tiga puluh halaman tipis akan dibayar dengan peringkat halaman-halaman yang benar-benar bagus di direktori yang sama. Batasnya ditetapkan di depan supaya tidak digeser saat sedang butuh trafik — maksimal delapan arketipe dalam satu tahun, ditulis tangan, tidak lebih dari dua per bulan.",
    "Konsekuensinya jelas: kalau ruangan Anda tidak ada di sini, halaman ini tidak akan berpura-pura punya jawabannya. Yang bisa Anda lakukan adalah menjalankan kalkulatornya dengan dimensi ruangan Anda sendiri.",
  ],
  methodHeading: "Dari mana angkanya",
  methodBody:
    "Setiap arketipe menjalankan tiga mesin yang sama dengan kalkulator publik di situs ini, dengan satu masukan yang ditulis terbuka. Lebar layar pada halaman auditorium dan masjid bahkan tidak diketik: nilainya diambil langsung dari hasil perhitungan ukuran layar, lalu dipakai kalkulator proyektor — sehingga kedua angka itu tidak mungkin berbeda.",
  handHeading: "Yang ditulis tangan",
  handBody:
    "Prosa, daftar kegagalan lapangan, dan rekomendasi sistem ditulis satu per satu untuk tiap ruangan. Tidak ada satu pun kalimat di halaman-halaman itu yang dihasilkan dari template.",
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const publishedLessons = await getPublishedLessonCount();
  return {
    ...buildMetadata({
      title: "Arsitektur Ruang — Angka Acuan per Tipe Ruangan | ACTA",
      description:
        "Ruang rapat, auditorium, dan masjid: ukuran layar, waktu dengung, dan kecerahan proyektor yang dihitung dengan kalkulator yang sama, lengkap dengan kegagalan yang paling sering terjadi.",
      path: ROOM_BASE_PATH,
    }),
    robots: learnRobotsMeta(publishedLessons),
  };
}

export default async function RuangIndexPage() {
  const [publishedLessons, publishedToolSlugs] = await Promise.all([
    getPublishedLessonCount(),
    getLearnToolSlugs(),
  ]);

  const summaries = roomSummaries();
  const indexable = publishedLessons >= LEARN_LAUNCH_MIN_LESSONS;

  // Only link calculators that are actually published. An unresolved tool is
  // dropped rather than rendered as a promise.
  const toolLinks = (Object.keys(TOOL_NAME) as LearnToolSlug[])
    .filter((slug) => publishedToolSlugs.includes(slug))
    .map((slug) => ({ slug, href: `${LEARN_TOOL_BASE}/${slug}`, name: TOOL_NAME[slug] }));

  return (
    <>
      {/* Withheld while the launch gate is closed: a BreadcrumbList may contain
          zero items pointing at a noindex URL (02-DATA-SEO §8.4), and /learn is
          noindex below the lesson threshold. Both lift on the same condition. */}
      {indexable ? (
        <JsonLd
          data={breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Learn", path: "/learn" },
            { name: "Arsitektur Ruang", path: ROOM_BASE_PATH },
          ])}
        />
      ) : null}

      <div className="container pt-8 md:pt-10">
        <Breadcrumb
          items={[
            { name: "Home", href: "/" },
            { name: "Learn", href: "/learn" },
            { name: "Arsitektur Ruang" },
          ]}
        />
      </div>

      <header className="container py-compact">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-end lg:gap-14">
          <div>
            <p className="mono-label text-muted-foreground">{COPY.eyebrow}</p>
            <h1 className="display-lg mt-5 max-w-[16ch] text-pretty">{COPY.headline}</h1>
            <p className="body-lg mt-6 max-w-[54ch] text-muted-foreground">{COPY.lede}</p>
          </div>

          <div className="relative border border-border bg-card p-6">
            <CornerTicks size={9} />
            <p className="mono-label text-muted-foreground">Batas yang kami pasang sendiri</p>
            <dl className="mt-4 space-y-3">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="body-sm text-muted-foreground">Terbit sekarang</dt>
                <dd className="mono-spec text-foreground">{summaries.length}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="body-sm text-muted-foreground">Maksimum setahun</dt>
                <dd className="mono-spec text-foreground">8</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="body-sm text-muted-foreground">Maksimum per bulan</dt>
                <dd className="mono-spec text-foreground">2</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="body-sm text-muted-foreground">Dibangkitkan otomatis</dt>
                <dd className="mono-spec text-foreground">0</dd>
              </div>
            </dl>
          </div>
        </div>
      </header>

      <div className="container">
        <MeterDivider annotation="ANGKA DARI MESIN YANG SAMA DENGAN KALKULATORNYA" />
      </div>

      <section aria-label="Daftar arketipe ruang" className="container py-section">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {summaries.map((summary, index) => (
            <RoomArchetypeCard
              key={summary.slug}
              summary={summary}
              index={index + 1}
              headingLevel="h2"
            />
          ))}
        </div>
      </section>

      {/* Editorial two-column prose — deliberately not a card grid (13 §L5). */}
      <section aria-labelledby="kenapa-tiga" className="container pb-expansive">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] md:gap-14">
          <div>
            <h2 id="kenapa-tiga" className="display-md max-w-[20ch] text-pretty">
              {COPY.capHeading}
            </h2>
          </div>
          <div className="space-y-5">
            {COPY.capBody.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="body-md max-w-[62ch] text-muted-foreground">
                {paragraph}
              </p>
            ))}

            <div className="grid gap-6 border-t border-border pt-8 sm:grid-cols-2">
              <div>
                <h3 className="heading-md">{COPY.methodHeading}</h3>
                <p className="body-sm mt-3 text-muted-foreground">{COPY.methodBody}</p>
                {toolLinks.length > 0 ? (
                  <ul className="mt-4 space-y-2">
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
              <div>
                <h3 className="heading-md">{COPY.handHeading}</h3>
                <p className="body-sm mt-3 text-muted-foreground">{COPY.handBody}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
