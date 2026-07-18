import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { researchOutputSchema, RESEARCH_JSON_SCHEMA, type ResearchInput, type ResearchOutput } from "@/lib/ai/schemas";
import type { AiProvider } from "@/lib/ai/provider";

// Sole file that knows Anthropic SDK/tool-use details (mirrors the lib/acta-os.ts adapter
// pattern: one locked-contract file per external system — PRD §4.5).
//
// NOTE: unlike lib/ai/providers/gemini.ts, this adapter does NOT ground its answers in a live web
// search — tool_choice below forces the single submit_research tool, which leaves no room for the
// model to also call a search tool in the same turn. It answers from training-data memory only,
// constrained by the "official sources only, skip if unsure" prompt rules. Currently inactive
// (AI_PROVIDER defaults to "gemini") — kept for provider-swap flexibility (PRD §4.5 goal). If this
// is ever made active again, give it the same grounded two-step treatment as gemini.ts first.
const TOOL_SCHEMA = {
  name: "submit_research",
  description: "Kirim hasil riset satu produk yang sudah diverifikasi dari sumber resmi.",
  input_schema: RESEARCH_JSON_SCHEMA,
};

function buildPrompt(input: ResearchInput): string {
  return `Kamu adalah peneliti produk AV profesional untuk ACTA Integrator (system integrator AV komersial Indonesia). Riset SATU produk berikut dan kembalikan data terverifikasi lewat tool submit_research.

## Produk
Brand: ${input.brand}
Model: ${input.model}
Deskripsi singkat dari sheet vendor: ${input.fungsi || "(tidak ada)"}
${input.hargaHint ? `Harga internal (hint konteks saja, JANGAN dijadikan spec value): ${input.hargaHint}` : ""}

## Aturan ketat (ZERO fabrication — ini instruksi paling penting)
1. HANYA sumber resmi: situs/datasheet manufaktur, atau distributor resmi nasional dengan tabel spec asli. Marketplace (Tokopedia/Shopee/Lazada/Amazon) dan blog review BUKAN sumber sah. Kalau tidak ketemu sumber kredibel untuk model PERSIS ini → status_recommendation="skip" dengan skip_reason yang jelas. Skip adalah hasil BAGUS kalau data tidak terverifikasi — JANGAN MENGARANG spec apa pun.
2. Nama model di sheet vendor bisa typo/longgar — cari nama resmi yang benar, taruh koreksinya di name_correction kalau beda dari input.
3. specs: 5–12 nilai NYATA dari sumber resmi. Kalau key yang sudah dipakai di katalog (lihat vocabulary di bawah) konsepnya cocok, PAKAI KEY YANG SAMA (mis. frequency_response, power_output, impedance, channel_count) — jangan buat key baru yang maknanya sama. Untuk konsep yang genuinely baru, buat key snake_case bersih.
4. images: 1–3 URL gambar LANGSUNG dari sumber resmi (CDN manufaktur diutamakan), beda angle kalau tersedia. Array kosong OK kalau tidak ada yang terverifikasi — jangan pakai foto marketplace berwatermark.
5. Bahasa Indonesia, faktual, nada enterprise-engineering, TANPA hiperbola, TANPA klaim yang tidak ada di sumber.
6. confidence: "tinggi" (sumber resmi, model persis cocok), "sedang" (resmi tapi kurang lengkap/varian ambigu), "rendah" (sumber lemah, tetap draft).
7. status_recommendation="publish" HANYA kalau confidence="tinggi" DAN >=3 specs DAN >=1 gambar terverifikasi; selain itu "draft" atau "skip".

## Kategori & product type yang SUDAH ADA di katalog (pakai salah satu kalau maknanya cocok — jangan buat variasi baru untuk hal yang sama)
Kategori: ${input.existingCategoryNames.join(", ") || "(belum ada kategori)"}
Product type: ${input.existingProductTypeNames.join(", ") || "(belum ada product type)"}

## Vocabulary spec key yang sudah dipakai di katalog (reuse kalau konsepnya sama)
${input.existingSpecKeysHint || "(belum ada)"}

Panggil tool submit_research dengan hasil risetmu.`;
}

export class AnthropicProvider implements AiProvider {
  private client: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY belum diset — tambahkan di .env.local sebelum menjalankan riset.");
    this.client = new Anthropic({ apiKey });
  }

  async research(input: ResearchInput): Promise<ResearchOutput> {
    const message = await this.client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 4096,
      // RESEARCH_JSON_SCHEMA is a plain-JSON description shared with gemini.ts's
      // responseJsonSchema (which takes `unknown`) — Anthropic's own Tool type wants literal
      // `"object"`/mutable arrays baked into the TS type, which a shared runtime object can't
      // satisfy structurally. Cast; the actual JSON shape sent is correct.
      tools: [TOOL_SCHEMA as unknown as Anthropic.Tool],
      tool_choice: { type: "tool", name: "submit_research" },
      messages: [{ role: "user", content: buildPrompt(input) }],
    });

    const toolUse = message.content.find(
      (block): block is Anthropic.Messages.ToolUseBlock => block.type === "tool_use",
    );
    if (!toolUse) throw new Error("Model tidak memanggil tool submit_research — respons tidak terstruktur.");

    const parsed = researchOutputSchema.safeParse(toolUse.input);
    if (!parsed.success) {
      throw new Error(`Output AI tidak lolos validasi schema: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
    }
    return parsed.data;
  }
}
