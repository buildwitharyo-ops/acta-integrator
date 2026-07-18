// Shapes shared between the review page (Server Component) and CatalogReviewPanel (Client
// Component) — mirrors the jsonb shape written by lib/ai/schemas.ts's researchOutputSchema.
export type DraftSpec = {
  key: string;
  label: string;
  group: string;
  data_type: string;
  unit: string | null;
  value_text: string;
  value_number: number | null;
  value_boolean: boolean | null;
};

// PRD §4.4/§10 (Fase 3): fields beyond url/angle_note are added by trigger/process-image.ts as
// each image's background-removal job progresses, and by materializeDraftImages() once an admin
// reviewing this specific draft causes it to be copied into the public media bucket. All optional
// so Fase 1/2 drafts (created before Fase 3 existed) keep parsing correctly.
export type ProposedImage = {
  url: string;
  angle_note: string | null;
  job_id?: string;
  status?: "pending" | "processing" | "ok" | "failed";
  processed_path?: string; // path inside the private catalog-raw bucket, set when status="ok"
  fail_reason?: string;
  committed_media_id?: string; // set once copied into the public media bucket for real use
};
