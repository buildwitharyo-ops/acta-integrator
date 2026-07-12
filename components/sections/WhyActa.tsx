import Link from "next/link";
import { MeterDivider } from "@/components/shared/MeterDivider";

type Point = { title?: string; description?: string };

const DEFAULT_POINTS: Point[] = [
  {
    title: "Berangkat dari kebutuhan, bukan katalog.",
    description:
      "Kami analisis ruang, akustik, dan cara tim Anda bekerja — lalu merancang sistem tepat ukuran. Tidak kurang, tidak berlebihan.",
  },
  {
    title: "Satu sistem, bukan kumpulan perangkat.",
    description:
      "Audio, visual, dan kontrol dirancang terintegrasi sejak desain — bukan dipaksa bersama di lapangan.",
  },
  {
    title: "RAB transparan.",
    description:
      "Desain sistem dan rancangan anggaran yang jelas. Anda tahu persis apa yang dibayar dan kenapa.",
  },
  {
    title: "Tidak lepas tangan setelah instalasi.",
    description:
      "Pelatihan operator dan dukungan teknis berkelanjutan — sistem terbaik pun butuh tim yang menguasainya.",
  },
];

export function WhyActa({
  content,
}: {
  content: { headline?: string; intro?: string; points?: Point[] };
}) {
  const points = content.points && content.points.length > 0 ? content.points : DEFAULT_POINTS;

  return (
    <section className="container py-section">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="mono-label text-accent-text">06 / WHY ACTA</p>
          <h2 className="display-md mt-3 max-w-[14ch]">
            {content.headline ?? "A Technology Partner, Not Just an Installer."}
          </h2>
          <p className="body-md mt-5 max-w-[40ch] text-muted-foreground">
            {content.intro ??
              "Akar teknis kami di sound engineering dan integrasi sistem — kami paham sistem sampai ke detail sinyal."}
          </p>
          <Link href="/about" className="mono-label mt-6 inline-block text-accent-text underline-offset-4 hover:underline">
            Kenali Tim ACTA
          </Link>
        </div>

        <ol>
          {points.map((p, i) => (
            <li key={i}>
              {i > 0 ? <MeterDivider className="my-7" /> : null}
              <div className="flex gap-6">
                <span className="font-mono text-2xl font-medium tabular-nums text-accent-text">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="heading-md">{p.title}</p>
                  <p className="body-md mt-2 text-muted-foreground">{p.description}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
