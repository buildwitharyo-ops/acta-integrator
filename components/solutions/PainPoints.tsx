import { FocusRail, type FocusRailItem } from "@/components/ui/focus-rail";

type PainPoint = { title?: string; body?: string; image_url?: string };

// Dark showcase fallback so a pain point saved without an image never renders a broken <img>.
const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='300'%20height='400'%3E%3Cdefs%3E%3ClinearGradient%20id='g'%20x1='0'%20y1='0'%20x2='1'%20y2='1'%3E%3Cstop%20offset='0'%20stop-color='%23222528'/%3E%3Cstop%20offset='1'%20stop-color='%230b0c0e'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect%20width='300'%20height='400'%20fill='url(%23g)'/%3E%3C/svg%3E";

export function PainPoints({
  eyebrow,
  heading,
  items,
}: {
  eyebrow: string;
  heading: string;
  items: PainPoint[];
}) {
  const points = items.filter((p) => p.title);
  if (points.length === 0) return null;

  const railItems: FocusRailItem[] = points.map((p, i) => {
    const url = p.image_url?.trim();
    return {
      id: i,
      title: p.title!,
      description: p.body,
      // Only trust an http(s) URL; anything else (blank or garbage) degrades to the gradient.
      imageSrc: url && /^https?:\/\//i.test(url) ? url : FALLBACK_IMG,
      meta: `PROBLEM ${String(i + 1).padStart(2, "0")}`,
    };
  });

  return (
    <section className="bg-neutral-950 text-white">
      <div className="container pb-6 pt-16 md:pt-24">
        <p className="mono-label text-[#E4A548]">{eyebrow}</p>
        <h2 className="display-lg mt-3 max-w-[24ch] text-white">{heading}</h2>
      </div>
      <FocusRail items={railItems} ariaLabel={heading} className="pb-16" />
    </section>
  );
}
