import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { CornerTicks } from "@/components/shared/CornerTicks";
import { JsonLd } from "@/components/shared/JsonLd";
import { breadcrumbNode } from "@/lib/jsonld";
import { TOOL_ENTRIES, getToolEntry, type ToolEntry } from "@/lib/learn/tool-registry";
import { getLearnTools } from "@/lib/queries/learn/tools";
import { buildMetadata } from "@/lib/seo";

/**
 * `/learn/alat` — the calculator index.
 *
 * Static by construction: it reads no `searchParams`, no cookies and no headers,
 * and its one query is `unstable_cache`d under the `learn` tag. Caching is
 * tag-based only — do not add `revalidate = N`.
 *
 * Structured data is `BreadcrumbList` and nothing else. `ItemList` belongs to the
 * /learn hub, which is the one place Google's Course List carousel still applies
 * (§8.4); repeating it here would be markup that earns nothing and still has to be
 * kept true.
 */

export const metadata: Metadata = buildMetadata({
  title: "Alat Hitung AV — Kalkulator Ukuran Layar, RT60, dan Proyektor | ACTA",
  description:
    "Tiga kalkulator audio visual yang menunjukkan perhitungannya: ukuran layar menurut AVIXA DISCAS, waktu dengung RT60 Sabine/Eyring, dan throw distance plus kecerahan proyektor. Gratis, tanpa daftar.",
  path: "/learn/alat",
});

const PRINCIPLES: readonly { title: string; body: string }[] = [
  {
    title: "Perhitungannya ditunjukkan, bukan disembunyikan",
    body:
      "Setiap alat membuka panel berisi rumus, angka yang sudah disubstitusikan, dan model yang dipilih beserta alasannya. Seorang engineer bisa memeriksa aritmetikanya dalam lima detik, dan itu satu-satunya cara menaruh kepercayaan pada angka yang keluar dari kotak hitam orang lain.",
  },
  {
    title: "Berfungsi penuh tanpa JavaScript",
    body:
      "Formulirnya formulir HTML biasa: tekan Hitung, halaman dimuat ulang dengan parameter di URL, server menghitung, dan hasil lengkap muncul. Di jaringan seluler Indonesia dan di ponsel Android kelas menengah, itu bukan kemewahan.",
  },
  {
    title: "Angka yang tidak bisa kami pastikan tidak kami terbitkan",
    body:
      "Kalkulator RT60 menolak mengeluarkan angka STI, dan kalkulator proyektor tidak menerbitkan nilai rasio kontras per kategori. Keduanya menjelaskan alasannya. Angka yang terlihat meyakinkan dan salah lebih mahal daripada tidak ada angka sama sekali.",
  },
  {
    title: "Asumsi dan batasnya ditulis di halaman yang sama",
    body:
      "Setiap alat mencantumkan apa yang tidak dimodelkannya — offset lensa, kebisingan latar, balok struktur, bentuk ruang yang tidak kotak. Itu juga jawaban jujur atas pertanyaan kenapa survei lokasi tetap ada.",
  },
];

function ToolCard({ entry, intro }: { entry: ToolEntry; intro: string }) {
  return (
    <article className="relative flex flex-col rounded-md border border-border bg-card p-6 md:p-7">
      <CornerTicks size={10} />
      <p className="mono-label text-muted-foreground">{entry.eyebrow}</p>
      <h2 className="display-md mt-4 text-balance">
        <Link
          href={entry.path}
          className="transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          {entry.shortName}
        </Link>
      </h2>
      <p className="body-md mt-4 text-foreground">{entry.answers}</p>
      <p className="body-sm mt-4 text-muted-foreground">{intro}</p>

      <dl className="mt-6 space-y-3 border-t border-border pt-5">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="caption text-muted-foreground">Standar</dt>
          <dd className="mono-spec text-right text-foreground">
            {entry.standardChips.join(" · ")}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="caption text-muted-foreground">Diverifikasi</dt>
          <dd className="mono-spec text-right text-foreground">{entry.verifiedAt} · ACTA</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="caption text-muted-foreground">Tabel acuan</dt>
          <dd className="mono-spec text-right text-foreground">
            {entry.reference().length} tabel
          </dd>
        </div>
      </dl>

      <Link
        href={entry.path}
        className="mono-label mt-6 inline-flex min-h-11 items-center text-accent-text underline decoration-primary/40 underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
      >
        Buka kalkulator →
      </Link>
    </article>
  );
}

export default async function ToolIndexPage() {
  const rows = await getLearnTools();

  // The registry decides which calculators exist; the CMS only reorders them and
  // may supply a better intro line. A row naming code nobody wrote is skipped
  // rather than rendered as a dead link.
  const published = rows
    .map((row) => ({ entry: getToolEntry(row.component_key), intro: row.intro_md }))
    .filter((item): item is { entry: ToolEntry; intro: string } => item.entry !== null);

  const seen = new Set(published.map((item) => item.entry.key));
  const cards = [
    ...published,
    ...TOOL_ENTRIES.filter((entry) => !seen.has(entry.key)).map((entry) => ({
      entry,
      intro: entry.intro,
    })),
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbNode([
          { name: "Home", path: "/" },
          { name: "Learn", path: "/learn" },
          { name: "Alat", path: "/learn/alat" },
        ])}
      />

      <div className="container py-section">
        <Breadcrumb items={[{ name: "Learn", href: "/learn" }, { name: "Alat" }]} />

        <header className="mt-6 max-w-[72ch]">
          <p className="mono-label text-muted-foreground">ALAT HITUNG</p>
          <h1 className="display-lg mt-3 text-balance">
            Kalkulator yang menunjukkan perhitungannya
          </h1>
          <p className="body-lg mt-5 text-muted-foreground">
            Tiga alat untuk tiga pertanyaan yang paling sering salah dijawab di ruangan
            Indonesia: berapa besar layarnya, berapa lama suaranya menggantung, dan apakah
            proyektornya cukup terang. Semuanya gratis, tanpa daftar, dan tetap berfungsi
            penuh dengan JavaScript dimatikan.
          </p>
        </header>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {cards.map(({ entry, intro }) => (
            <ToolCard key={entry.key} entry={entry} intro={intro} />
          ))}
        </div>

        <section aria-labelledby="prinsip-judul" className="mt-16">
          <header className="max-w-[72ch]">
            <p className="mono-label text-muted-foreground">Cara kerja</p>
            <h2 id="prinsip-judul" className="display-md mt-3">
              Empat hal yang membedakan alat ini
            </h2>
          </header>
          <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {PRINCIPLES.map((principle) => (
              <div key={principle.title} className="border-t border-border pt-5">
                <h3 className="heading-md text-balance">{principle.title}</h3>
                <p className="body-sm mt-3 text-muted-foreground">{principle.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
