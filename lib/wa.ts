const WA_NUMBER = "6281563905555";

export type WaContext = "product" | "compare" | "solution" | "general";

type BuildWaLinkArgs = {
  context: WaContext;
  name?: string;
  slug?: string;
  items?: string[];
  message?: string;
};

export function buildWaLink({ context, name, slug, items, message }: BuildWaLinkArgs): string {
  if (message?.trim()) {
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message.trim())}`;
  }

  let text: string;

  switch (context) {
    case "product":
      text = name
        ? `Halo ACTA, saya ingin minta penawaran untuk ${name}${slug ? ` (${slug})` : ""}.`
        : "Halo ACTA, saya ingin minta penawaran produk.";
      break;
    case "compare":
      text = items?.length
        ? `Halo ACTA, saya ingin minta penawaran untuk perbandingan: ${items.join(", ")}.`
        : "Halo ACTA, saya ingin minta penawaran beberapa produk.";
      break;
    case "solution":
      text = name
        ? `Halo ACTA, saya ingin konsultasi solusi ${name}.`
        : "Halo ACTA, saya ingin konsultasi solusi sistem AV.";
      break;
    default:
      text = "Halo ACTA, saya ingin berkonsultasi soal kebutuhan sistem AV kami.";
  }

  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function formatWaDisplay(number?: string | null): string {
  const digits = (number ?? WA_NUMBER).replace(/\D/g, "");
  const rest = digits.startsWith("62") ? digits.slice(2) : digits;
  return `+62 ${rest.replace(/(\d{3})(\d{4})(\d+)/, "$1 $2 $3")}`;
}
