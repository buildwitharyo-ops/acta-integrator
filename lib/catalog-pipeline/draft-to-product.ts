import "server-only";
import type { DraftSpec, ProposedImage } from "@/lib/catalog-pipeline/types";

// Shared by the review page (prefilling ProductForm) and bulkApproveReady() (Fase 4 §10 item 1)
// — one conversion, so bulk-approve can never drift from what a human reviewer sees/gets.
type SpecDefLite = { id: string; product_type_id: string | null; key: string; data_type: string };

export function buildSpecValues(draftSpecs: DraftSpec[], specDefs: SpecDefLite[], productTypeId: string | null) {
  const typeDefs = productTypeId ? specDefs.filter((d) => d.product_type_id === productTypeId) : [];
  const byKey = new Map(typeDefs.map((d) => [d.key, d]));
  const values: {
    spec_definition_id: string;
    value_text: string;
    value_number: number | null;
    value_boolean: boolean | null;
    value_options: string[] | null;
  }[] = [];

  for (const s of draftSpecs) {
    const def = byKey.get(s.key);
    if (!def) continue;
    if (def.data_type === "number") {
      values.push({ spec_definition_id: def.id, value_text: s.value_text, value_number: s.value_number ?? (Number(s.value_text) || null), value_boolean: null, value_options: null });
    } else if (def.data_type === "boolean") {
      values.push({ spec_definition_id: def.id, value_text: s.value_text, value_number: null, value_boolean: s.value_boolean ?? s.value_text === "true", value_options: null });
    } else if (def.data_type === "enum") {
      values.push({ spec_definition_id: def.id, value_text: s.value_text, value_number: null, value_boolean: null, value_options: [s.value_text] });
    } else {
      values.push({ spec_definition_id: def.id, value_text: s.value_text, value_number: null, value_boolean: null, value_options: null });
    }
  }
  return values;
}

export function buildImageInputs(proposedImages: ProposedImage[]) {
  return proposedImages
    .filter((img): img is ProposedImage & { committed_media_id: string } => Boolean(img.committed_media_id))
    .map((img) => ({ media_id: img.committed_media_id, image_annotation: img.angle_note ?? "" }));
}
