type Pillar = { title?: string; description?: string };

export function ScopePillars({
  eyebrow,
  heading,
  items,
}: {
  eyebrow: string;
  heading: string;
  items: Pillar[];
}) {
  const pillars = items.filter((p) => p.title).slice(0, 4);

  return (
    <section className="container py-section">
      <p className="mono-label text-accent-text">{eyebrow}</p>
      <h2 className="display-lg mt-3 max-w-[20ch]">{heading}</h2>

      <div className="mt-10 grid gap-px overflow-hidden rounded-lg bg-border sm:grid-cols-2">
        {pillars.map((p, i) => (
          <div key={i} className="bg-background p-6 md:p-8">
            <span className="font-mono text-2xl tabular-nums text-foreground/25">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="heading-md mt-3">{p.title}</h3>
            {p.description ? (
              <p className="body-md mt-2 text-muted-foreground">{p.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
