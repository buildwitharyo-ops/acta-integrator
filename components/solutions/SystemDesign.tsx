import { SignalChainDiagram, type SignalStage } from "@/components/shared/SignalChainDiagram";

export function SystemDesign({
  eyebrow,
  heading,
  body,
  stages,
}: {
  eyebrow: string;
  heading: string;
  body?: string | null;
  stages: SignalStage[];
}) {
  const paragraphs = (body ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section className="container py-section">
      <div className="dark relative overflow-hidden rounded-[26px] bg-background px-6 py-12 text-foreground sm:px-10 sm:py-14 lg:px-14 lg:py-16">
        <p className="mono-label text-accent-text">{eyebrow}</p>
        <h2 className="display-lg mt-3 max-w-[24ch]">{heading}</h2>

        {stages.length > 0 ? <SignalChainDiagram stages={stages} className="mt-10" /> : null}

        {paragraphs.length > 0 ? (
          <div className="mt-10 max-w-[70ch] space-y-4">
            {paragraphs.map((p, i) => (
              <p key={i} className="body-md text-muted-foreground">
                {p}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
