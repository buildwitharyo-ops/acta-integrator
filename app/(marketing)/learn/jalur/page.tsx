import type { Metadata } from "next";
import Link from "next/link";
import { PathCard } from "@/components/learn/hub/PathCard";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { JsonLd } from "@/components/shared/JsonLd";
import { MeterDivider } from "@/components/shared/MeterDivider";
import { LEARN_LAUNCH_MIN_LESSONS, learnRobotsMeta } from "@/lib/learn/noindex";
import { getLearnRole } from "@/lib/learn/roles";
import type { LearnPathLesson } from "@/lib/learn/types";
import { breadcrumbNode } from "@/lib/jsonld";
import { getPublishedLessonCount } from "@/lib/queries/learn/lessons";
import { getLearnPathLessons, getLearnPaths } from "@/lib/queries/learn/paths";
import { buildMetadata } from "@/lib/seo";

/**
 * /learn/jalur — the path index (01 §3.2).
 *
 * Static, no `searchParams`, no pagination. It exists so the jalur namespace has
 * a real root: the hub links here, breadcrumbs pass through here, and the
 * command palette's zero state offers it. A published jalur is the only thing
 * this page can render — a path below five published lessons stays a draft, and
 * a draft is absent from `v_learn_paths` entirely, so there is no "segera hadir"
 * row to build and no counter to keep honest.
 *
 * `Course` markup lives on the /learn hub and nowhere else (02 §8.4), so this
 * page emits `BreadcrumbList` only.
 */
export const dynamic = "force-static";

const COPY = {
  headline: "Urutan yang masuk akal, bukan tumpukan artikel.",
  lede: "Setiap jalur menyusun pelajaran dari memahami masalahnya, mengukurnya, sampai menuliskannya di dokumen yang bisa ditenderkan. Pelajaran tetap berdiri sendiri — Anda boleh masuk dari mana saja.",
  note: "Sebuah jalur baru terbit setelah minimal lima pelajarannya selesai. Yang belum selesai tidak muncul sebagai slot kosong di mana pun.",
  orphanTitle: "Tidak semua pelajaran masuk jalur",
  orphanBody:
    "Sebagian materi berdiri sendiri karena topiknya tidak menuntut urutan. Semuanya ada di daftar lengkap.",
  orphanLink: "Lihat semua pelajaran",
} as const;

function totalMinutes(steps: readonly LearnPathLesson[]): number {
  return steps.reduce((sum, step) => sum + (step.reading_time ?? 0), 0);
}

export async function generateMetadata(): Promise<Metadata> {
  const publishedLessons = await getPublishedLessonCount();
  return {
    ...buildMetadata({
      title: "Jalur Belajar AV — Akustik, Tata Suara, dan Spesifikasi | ACTA",
      description:
        "Jalur belajar sistem audio visual berbahasa Indonesia: akustik ruang, tata suara, dan penyusunan RKS serta pengadaan AV.",
      path: "/learn/jalur",
    }),
    robots: learnRobotsMeta(publishedLessons),
  };
}

export default async function LearnJalurIndexPage() {
  const [paths, publishedLessons] = await Promise.all([
    getLearnPaths(),
    getPublishedLessonCount(),
  ]);

  const syllabi = await Promise.all(paths.map((path) => getLearnPathLessons(path.slug)));

  // Only assert a hierarchy once the section is indexable — every /learn URL is
  // noindex below the launch gate, and a BreadcrumbList through noindex nodes is
  // markup Google is simultaneously told to ignore.
  const indexed = publishedLessons >= LEARN_LAUNCH_MIN_LESSONS;

  return (
    <>
      {indexed ? (
        <JsonLd
          data={breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Learn", path: "/learn" },
            { name: "Jalur", path: "/learn/jalur" },
          ])}
        />
      ) : null}

      <section className="container py-section">
        <Breadcrumb
          items={[
            { name: "Home", href: "/" },
            { name: "Learn", href: "/learn" },
            { name: "Jalur" },
          ]}
        />

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
          <div>
            {/* A lowercase spec line rather than another all-caps mono eyebrow:
                the PathCard eyebrows below already carry that register, and
                13 §T6 caps a viewport at two all-caps mono strings. */}
            <p className="mono-spec tabular-nums text-muted-foreground">
              {paths.length} jalur · {publishedLessons} pelajaran terbit
            </p>
            <h1 className="display-lg mt-4 max-w-[18ch] text-balance">{COPY.headline}</h1>
          </div>
          <p className="body-md max-w-[46ch] text-muted-foreground lg:pt-14">{COPY.lede}</p>
        </div>

        <MeterDivider className="mt-10" />

        {paths.length > 0 ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2">
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
          </div>
        ) : null}

        <p className="caption mt-8 max-w-[58ch] text-muted-foreground">{COPY.note}</p>
      </section>

      <section className="container py-compact">
        <div className="grid gap-4 border-t border-border pt-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div>
            <h2 className="heading-lg">{COPY.orphanTitle}</h2>
            <p className="body-sm mt-2 max-w-[52ch] text-muted-foreground">
              {COPY.orphanBody}
            </p>
          </div>
          <Link
            href="/learn"
            className="mono-spec inline-flex min-h-11 items-center text-accent-text underline decoration-1 underline-offset-4 hover:decoration-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {COPY.orphanLink}
          </Link>
        </div>
      </section>
    </>
  );
}
