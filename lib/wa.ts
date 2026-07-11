const WA_NUMBER = "6281563905555";

export type WaContext = "product" | "compare" | "solution" | "general";

type BuildWaLinkArgs = {
  context: WaContext;
  name?: string;
  items?: string[];
};

export function buildWaLink({ context, name, items }: BuildWaLinkArgs): string {
  let text = "Halo ACTA, saya ingin minta penawaran";

  if (context === "product" && name) {
    text += ` untuk ${name}`;
  } else if (context === "compare" && items?.length) {
    text += ` untuk perbandingan: ${items.join(", ")}`;
  } else if (context === "solution" && name) {
    text += ` untuk solusi ${name}`;
  }

  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`${text}.`)}`;
}
