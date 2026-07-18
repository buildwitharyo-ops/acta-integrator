import { z } from "zod";

// Word-boundary-aware truncation to <=80 chars — products.short_spec has a DB-level CHECK
// (char_length <= 80). A model's own sense of "80 characters" is never reliable enough to trust
// via prompting alone (confirmed live: Gemini overshot it on a real run), so clamp instead of
// rejecting the whole draft over a cosmetic length overflow.
function clamp80(s: string): string {
  if (s.length <= 80) return s;
  let cut = s.slice(0, 80);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > 50) cut = cut.slice(0, lastSpace);
  return cut.replace(/[,;—\-\s]+$/, "");
}

// Structured output contract for one product research call (PRD §4.5). Every AI provider
// adapter MUST return data matching this schema — validated here, not trusted blindly.
export const specSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]*$/, "key harus snake_case"),
  label: z.string().min(1),
  group: z.string().min(1),
  data_type: z.enum(["number", "text", "boolean", "enum"]),
  unit: z.string().nullable().optional(),
  value_text: z.string().min(1),
  value_number: z.number().nullable().optional(),
  value_boolean: z.boolean().nullable().optional(),
  better_direction: z.enum(["higher", "lower"]).nullable().optional(),
});
export type ResearchSpec = z.infer<typeof specSchema>;

export const proposedImageSchema = z.object({
  url: z.string().url(),
  angle_note: z.string().nullable().optional(),
});
export type ProposedImage = z.infer<typeof proposedImageSchema>;

export const researchOutputSchema = z.object({
  name: z.string().min(1),
  name_correction: z.string().nullable().optional(),
  category_guess: z.string().min(1),
  product_type_name: z.string().min(1),
  short_spec: z.string().nullable().optional().transform((v) => (v ? clamp80(v) : v)),
  description_md: z.string().nullable().optional(),
  suitable_for: z.string().nullable().optional(),
  spec_source_url: z.string().url().nullable().optional(),
  confidence: z.enum(["tinggi", "sedang", "rendah"]),
  confidence_notes: z.string().nullable().optional(),
  status_recommendation: z.enum(["publish", "draft", "skip"]),
  skip_reason: z.string().nullable().optional(),
  specs: z.array(specSchema).default([]),
  images: z.array(proposedImageSchema).default([]),
});
export type ResearchOutput = z.infer<typeof researchOutputSchema>;

export type ResearchInput = {
  brand: string;
  model: string;
  fungsi: string;
  hargaHint: string | null;
  existingCategoryNames: string[];
  existingProductTypeNames: string[];
  existingSpecKeysHint: string;
};

// Plain JSON Schema mirror of researchOutputSchema above — shared by every provider adapter that
// needs to hand the model a literal schema object (Anthropic tool input_schema, Gemini
// responseJsonSchema, etc). Keep this in lockstep with researchOutputSchema by hand; there's no
// zod-to-json-schema dependency in this project.
export const RESEARCH_JSON_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    name_correction: { type: ["string", "null"] },
    category_guess: { type: "string" },
    product_type_name: { type: "string" },
    short_spec: { type: ["string", "null"] },
    description_md: { type: ["string", "null"] },
    suitable_for: { type: ["string", "null"] },
    spec_source_url: { type: ["string", "null"] },
    confidence: { type: "string", enum: ["tinggi", "sedang", "rendah"] },
    confidence_notes: { type: ["string", "null"] },
    status_recommendation: { type: "string", enum: ["publish", "draft", "skip"] },
    skip_reason: { type: ["string", "null"] },
    specs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { type: "string" },
          label: { type: "string" },
          group: { type: "string" },
          data_type: { type: "string", enum: ["number", "text", "boolean", "enum"] },
          unit: { type: ["string", "null"] },
          value_text: { type: "string" },
          value_number: { type: ["number", "null"] },
          value_boolean: { type: ["boolean", "null"] },
          better_direction: { type: ["string", "null"], enum: ["higher", "lower", null] },
        },
        required: ["key", "label", "group", "data_type", "value_text"],
      },
    },
    images: {
      type: "array",
      items: {
        type: "object",
        properties: { url: { type: "string" }, angle_note: { type: ["string", "null"] } },
        required: ["url"],
      },
    },
  },
  required: ["name", "category_guess", "product_type_name", "confidence", "status_recommendation", "specs", "images"],
};
