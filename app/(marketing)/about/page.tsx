import type { Metadata } from "next";
import { JsonLd } from "@/components/shared/JsonLd";
import { MarqueeStrip } from "@/components/shared/MarqueeStrip";
import { MeterDivider } from "@/components/shared/MeterDivider";
import { Reveal } from "@/components/shared/Reveal";
import { ScopePillars } from "@/components/solutions/ScopePillars";
import { BRAND_LOGOS } from "@/lib/brand-logos";
import { aboutPageNode } from "@/lib/jsonld";
import { getPageSections } from "@/lib/queries/pages";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Tentang ACTA — Enterprise AV Integrator",
  description:
    "ACTA merancang, memasang, dan mendukung sistem audio visual komersial terintegrasi — dari konsultasi hingga serah terima. Jakarta & Tangerang.",
  path: "/about",
});

type Story = { eyebrow?: string; headline?: string; body_md?: string };
type Pillars = { headline?: string; steps?: { title?: string; description?: string }[] };
type Team = { headline?: string; members?: { name?: string; role?: string; bio?: string }[] };
type TechStrip = { label?: string };

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function AboutPage() {
  const sections = await getPageSections("about");
  const story = (sections["story"] ?? {}) as Story;
  const pillars = (sections["pillars"] ?? {}) as Pillars;
  const team = (sections["team"] ?? {}) as Team;
  const techStrip = (sections["tech_strip"] ?? {}) as TechStrip;

  const members = (team.members ?? []).filter((m) => m.name);
  const paragraphs = (story.body_md ?? "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <>
      <JsonLd
        data={aboutPageNode({
          path: "/about",
          team: members.map((m) => ({ name: m.name!, role: m.role ?? "" })),
        })}
      />

      <section className="container py-section">
        <header className="max-w-3xl">
          <p className="mono-label text-accent-text">{story.eyebrow ?? "ABOUT ACTA"}</p>
          <h1 className="display-xl mt-4 text-balance">
            {story.headline ?? "A Technology Partner, Not Just an Installer."}
          </h1>
          <div className="mt-6 max-w-[62ch] space-y-4">
            {(paragraphs.length ? paragraphs : [""]).map((p, i) => (
              <p key={i} className="body-lg text-muted-foreground">
                {p}
              </p>
            ))}
          </div>
        </header>
        <MeterDivider annotation="SIGNAL CHAIN" className="mt-8" />
      </section>

      {pillars.steps && pillars.steps.length > 0 ? (
        <Reveal>
          <ScopePillars
            eyebrow="PENDEKATAN"
            heading={pillars.headline ?? "From Consultation to Handover."}
            items={pillars.steps}
          />
        </Reveal>
      ) : null}

      {members.length > 0 ? (
        <Reveal>
          <section className="container py-section">
            <p className="mono-label text-accent-text">TEAM</p>
            <h2 className="display-lg mt-3">{team.headline ?? "The ACTA Team"}</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((m) => (
                <div key={m.name} className="rounded-xl border border-border bg-card p-6">
                  <span className="mono-label flex h-14 w-14 items-center justify-center rounded-full bg-muted text-foreground">
                    {initials(m.name!)}
                  </span>
                  <p className="heading-md mt-4">{m.name}</p>
                  {m.role ? <p className="mono-label mt-1 text-accent-text">{m.role} · ACTA</p> : null}
                  {m.bio ? <p className="body-sm mt-3 text-muted-foreground">{m.bio}</p> : null}
                </div>
              ))}
            </div>
          </section>
        </Reveal>
      ) : null}

      <MarqueeStrip logos={BRAND_LOGOS} heading={techStrip.label ?? "Technology We Work With"} />
    </>
  );
}
