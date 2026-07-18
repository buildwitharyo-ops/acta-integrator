import { defineConfig } from "@trigger.dev/sdk/v3";

// AI Product Lifecycle Fase 2 queue (docs/14-AI-PRODUCT-LIFECYCLE-PRD.md §4.4, Opsi A).
// Project ref is not a secret (unlike TRIGGER_SECRET_KEY in .env.local) — Trigger.dev's own CLI
// doesn't read Next.js's .env.local when running standalone (`trigger.dev dev`/`deploy`), so this
// must be a literal here rather than env-var-driven.
export default defineConfig({
  project: "proj_cfqhjwizuaeytwtadoro",
  dirs: ["./trigger"],
  maxDuration: 300,
  retries: {
    enabledInDev: true,
  },
});
