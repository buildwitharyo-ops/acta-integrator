import "server-only";
import { GoogleGenAI } from "@google/genai";
import { researchOutputSchema, RESEARCH_JSON_SCHEMA, type ResearchInput, type ResearchOutput } from "@/lib/ai/schemas";
import type { AiProvider } from "@/lib/ai/provider";
import { searchWeb, fetchPageText } from "@/lib/catalog-pipeline/web-search";

// Sole file that knows the Gemini SDK's details (mirrors lib/acta-os.ts / lib/ai/providers/
// anthropic.ts — one adapter, locked contract, PRD §4.5).
//
// Gemini's own googleSearch grounding tool returned 429 RESOURCE_EXHAUSTED on the free-tier key
// (confirmed live — grounding appears to require billing enabled even for a free allowance), so
// this does its own real web search + page fetch (lib/catalog-pipeline/web-search.ts, Brave
// Search API — mechanical, not a reasoning task) and feeds the ACTUAL fetched content to Gemini.
// Still two Gemini calls:
//   1) analysis — plain call (no tools), given real search results as context, free text out.
//   2) structuring — responseJsonSchema forced, extracts ONLY what step 1 found into our schema
//      (never adds new facts) — this is what actually fixes the "no real browsing" gap.
//
// "gemini-2.5-flash" (the original literal name) started returning 404 "no longer available to
// new users" — confirmed live against a real key. Use Google's own floating alias instead so this
// never goes stale again; verified live (currently resolves to gemini-3.5-flash).
const MODEL = "gemini-flash-latest";

async function gatherSearchContext(input: ResearchInput): Promise<string> {
  const query = `${input.brand} ${input.model} official specifications datasheet`;
  const results = await searchWeb(query, 5);
  if (results.length === 0) return "(Tidak ada hasil pencarian web ditemukan untuk query ini.)";

  // Fetch full page text for the top few results only — slower, and diminishing returns past
  // that; the rest still contribute title+snippet.
  const withText = await Promise.all(
    results.map(async (r, i) => ({ ...r, text: i < 3 ? await fetchPageText(r.url) : null })),
  );

  return withText
    .map(
      (r, i) =>
        `### Hasil ${i + 1}: ${r.title}\nURL: ${r.url}\nSnippet: ${r.description || "(tidak ada)"}\n${
          r.text ? `Isi halaman (diambil langsung):\n${r.text}` : "(Halaman tidak berhasil diambil — hanya snippet di atas yang tersedia.)"
        }`,
    )
    .join("\n\n");
}

function buildAnalysisPrompt(input: ResearchInput, searchContext: string): string {
  return `Kamu adalah peneliti produk AV profesional untuk ACTA Integrator (system integrator AV komersial Indonesia). Di bawah ini adalah HASIL PENCARIAN WEB ASLI (sudah diambil, bukan hasil karanganmu) untuk satu produk. Analisis HANYA dari konten ini untuk meriset produk dari sumber RESMI saja.

## Produk
Brand: ${input.brand}
Model: ${input.model}
Deskripsi singkat dari sheet vendor: ${input.fungsi || "(tidak ada)"}
${input.hargaHint ? `Harga internal (hint konteks saja, JANGAN dijadikan spec value): ${input.hargaHint}` : ""}

## Hasil pencarian web (sumber kebenaran — JANGAN pakai pengetahuan lain di luar ini)
${searchContext}

## Aturan ketat (ZERO fabrication — instruksi paling penting)
1. HANYA percaya hasil dari situs/datasheet manufaktur resmi, atau distributor resmi dengan tabel spec asli, DI ANTARA hasil pencarian di atas. Marketplace (Tokopedia/Shopee/Lazada/Amazon) dan blog review BUKAN sumber sah walau muncul di hasil pencarian.
2. Kalau TIDAK ADA hasil di atas yang merupakan sumber resmi untuk model PERSIS ini, katakan itu dengan jelas ("TIDAK DITEMUKAN sumber resmi untuk model ini di hasil pencarian") — jangan menebak atau memakai data model lain yang mirip, dan jangan pakai pengetahuan dari luar hasil pencarian ini.
3. Untuk setiap spec yang kamu temukan DI DALAM hasil pencarian di atas, sebutkan NILAI PERSIS dan URL sumbernya (harus salah satu URL yang ada di hasil pencarian). Cari 5–12 spec kalau tersedia.
4. Cari juga 1–3 URL gambar produk LANGSUNG dari sumber resmi kalau disebut/terlihat di hasil pencarian.
5. Cari nama resmi produk yang benar (nama di sheet vendor bisa typo/longgar).
6. Tulis semua temuanmu sebagai teks naratif lengkap (bukan JSON) — sebutkan setiap angka/spec beserta URL sumber tepat di sampingnya, supaya langkah berikutnya bisa mengekstrak tanpa menebak.

## Kategori & product type yang SUDAH ADA di katalog (sebutkan mana yang cocok kalau ada)
Kategori: ${input.existingCategoryNames.join(", ") || "(belum ada kategori)"}
Product type: ${input.existingProductTypeNames.join(", ") || "(belum ada product type)"}

## Vocabulary spec key yang sudah dipakai di katalog (reuse kalau konsepnya sama)
${input.existingSpecKeysHint || "(belum ada)"}`;
}

function buildStructuringPrompt(input: ResearchInput, findings: string): string {
  return `Ubah HASIL RISET di bawah ini menjadi JSON sesuai schema yang diberikan. JANGAN menambahkan fakta/angka apa pun yang tidak ada di teks ini — kalau hasil riset bilang tidak ditemukan sumber resmi, set status_recommendation="skip" dan isi skip_reason dari alasan di teks. spec_source_url WAJIB salah satu URL yang benar-benar disebut di teks (jangan mengarang URL).

## Produk yang diriset
Brand: ${input.brand}, Model: ${input.model}

## Hasil riset (sumber kebenaran — HANYA ekstrak dari sini)
${findings}

## Aturan schema
- key spec: snake_case. Reuse vocabulary existing kalau konsepnya sama: ${input.existingSpecKeysHint || "(belum ada)"}
- confidence: "tinggi" (sumber resmi, model persis cocok), "sedang" (resmi tapi kurang lengkap/varian ambigu), "rendah" (sumber lemah).
- status_recommendation="publish" HANYA kalau confidence="tinggi" DAN >=3 specs DAN >=1 gambar; selain itu "draft" atau "skip".
- Bahasa Indonesia, faktual, nada enterprise-engineering, TANPA hiperbola.`;
}

export class GeminiProvider implements AiProvider {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY belum diset — tambahkan di .env.local sebelum menjalankan riset.");
    this.ai = new GoogleGenAI({ apiKey });
  }

  async research(input: ResearchInput): Promise<ResearchOutput> {
    const searchContext = await gatherSearchContext(input);

    const analysis = await this.ai.models.generateContent({
      model: MODEL,
      contents: buildAnalysisPrompt(input, searchContext),
    });
    const findings = analysis.text;
    if (!findings) throw new Error("Gemini tidak mengembalikan hasil analisis (langkah riset kosong).");

    const structured = await this.ai.models.generateContent({
      model: MODEL,
      contents: buildStructuringPrompt(input, findings),
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: RESEARCH_JSON_SCHEMA,
      },
    });
    const structuredText = structured.text;
    if (!structuredText) throw new Error("Gemini tidak mengembalikan hasil terstruktur (langkah ekstraksi kosong).");

    let raw: unknown;
    try {
      raw = JSON.parse(structuredText);
    } catch {
      throw new Error("Output ekstraksi Gemini bukan JSON valid.");
    }

    const parsed = researchOutputSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`Output Gemini tidak lolos validasi schema: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
    }
    return parsed.data;
  }
}
