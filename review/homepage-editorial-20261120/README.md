# ACTA homepage refinement · 20 November 2026

Branch `feat/homepage-editorial-20261120` starts from production baseline `3636218`. This is a refinement of that homepage: its section sequence, room links, catalog data, four-stage workflow, delivery accordion, marquees, and contact routes remain in place. The previous experimental refresh branch is not the implementation baseline.

[Open the desktop and mobile comparison](index.html)

## What changed for visitors

| Section | Refined visitor experience |
| --- | --- |
| Hero | The production component, CMS content, network effect, navigation, and both CTA destinations are preserved. |
| Technology | The existing brand marks move through a compact strip. Visitors can pause the marquee or expand the full list. Reduced motion presents the marks in a static grid. |
| Solutions | The published room links share a consistent image-led grid: a featured meeting room, the other core applications, and supporting applications. English descriptions explain use and system scope. Published names, imagery, and destination URLs remain authoritative. |
| How We Work | Manual and timed tabs pair each stage with genuine equipment photography and a concise description. The longer reading interval, progress line, keyboard navigation, image transition, and explicit pause control retain the original interaction. Autoplay pauses while a pointer or keyboard focus remains within the section’s interactive area. |
| Catalog | The split selector retains live category counts and catalog media. Selection, preview imagery, and category destinations update together. Every category has a crawlable browse link. Autoplay, progress, keyboard selection, hover selection, and pause remain available. |
| What We Deliver | The desktop image accordion covers room operation, acoustics, support beyond handover, and operator handover. Hover, focus, and click expand a panel; wide layouts retain the staggered-height emphasis. Mobile presents all four in reading order. The sparkle effect has its own pause control. |
| Testimonials position | The original source explicitly identified its names and attributions as fabricated placeholders. Their operational themes are now clearly labeled planning scenarios, with no implied customer endorsement. The moving tracks, hover pause, playback control, and static reading view are retained. |
| Insights | The conditional article feed retains the original published records and routes. Its homepage heading and archive action use English. At capture time the feed returned no published items, so no empty section is added. |
| Contact | A concise project prompt directs visitors to the existing WhatsApp and contact routes. The dotted surface, signal meter, CTA orbit, and analytics identifiers remain. Contact facts continue to come from site settings. |

## Editorial and visual decisions

The design retains ACTA’s amber, charcoal, daylight theme, General Sans, and technical interface character. Section headings are shorter; body copy describes applications, delivery scope, and operating tasks. The homepage now uses English editorial copy while preserving the existing hero exactly.

Layouts have distinct purposes: image-led room discovery, a stage-and-equipment split, a selectable catalog preview, a delivery image accordion, moving scenario tracks, and a concise final contact block. Shared content edges and a restrained heading scale connect them. Controls provide hover, focus, press, and selected-state feedback without replacing the established motion language.

Known published default copy is translated by its exact value. Genuine new or unknown CMS copy remains authoritative rather than being overwritten by an index-based mapping. This also preserves reordered workflow descriptions. A future editorial change can therefore still appear on the homepage; editors should use English to maintain its current voice.

No new measured outcomes, product specifications, service-level guarantees, certifications, project results, or customer endorsements are introduced. The former unsupported delivery figures are replaced by descriptive service priorities. Support and maintenance are explicitly limited to the arrangements agreed for the project.

## Material and image provenance

Equipment photographs are six compressed derivatives of existing published ACTA catalog media. [The source manifest](../../public/images/home-engineering/sources.json) records every source URL and intended use. The images show real Telycam, AUDAC, Yamaha, and Martin Audio equipment. They are identified as catalog product photographs, not documentation of ACTA installations.

Room imagery continues to use the original published solution media. At inspection, both public project covers were marked as placeholders and the public project-image view contained no records. This iteration does not replace them with invented project photographs or introduce a new portfolio section. Approved project photography and client-attributed testimonials remain future content work requiring genuine source material.

## Implementation inventory

Paths below are relative to the repository root.

| File or asset | Responsibility |
| --- | --- |
| `app/(marketing)/page.tsx` | Preserves the existing homepage composition and server queries; mounts the homepage-specific technology strip in its original position. |
| `components/sections/SolutionsBento.tsx` | Room grid, typography, image treatment, scope copy, and retained solution links. |
| `components/sections/CatalogTeaser.tsx` | Live category data, equipment preview items, English section copy. |
| `components/ui/feature-carousel.tsx` | Synchronized preview, autoplay, progress, explicit pause, keyboard and pointer selection, and direct category links. This component is used by the homepage catalog. |
| `components/sections/homepage-equipment-copy.ts` | Exact-source editorial mapping for known published defaults. |
| `components/sections/HowWeWork.tsx` | Timed/manual workflow, stage copy, accessible tab controls, and equipment crossfades. |
| `components/sections/ImpactSection.tsx` | Delivery image accordion, scoped service copy, sparkle effect, and pause behavior. |
| `components/sections/engineering.module.css` | Scoped styling for the workflow and delivery sections, including their responsive layouts. |
| `components/shared/HomeTechnologyStrip.tsx` and `.module.css` | Homepage brand marquee with pause and expanded reading view; the About page retains its original strip. |
| `components/sections/Testimonials.tsx` and `Testimonials.module.css` | Clearly identified planning scenarios in the preserved animated-section position, plus full static reading view. |
| `components/sections/ArticlesPreview.tsx` | English homepage feed heading and archive action, with the existing conditional feed behavior. |
| `components/sections/FinalCta.tsx` | English project prompt, contact details, and preserved CTA destinations/effects. |
| `components/sections/useHomeReducedMotion.ts` | Stable server/hydration snapshot and live reduced-motion preference updates for homepage interactions. |
| `components/sections/usePreviewPlayback.ts` | Shared playback state for catalog categories and project stages. Explicit Play resumes while its button retains focus. |
| `components/shared/Reveal.tsx` | Optional subtle reveal mode used by homepage wrappers; the existing default behavior remains available to other callers. |
| `public/images/home-engineering/` | Optimized equipment WebPs and their provenance manifest. |
| `lib/homepage-brand-masks.json`, `public/images/home-brand-masks/`, `scripts/prepare-homepage-brand-masks.mjs` | Homepage-only logo sources, their lossless derivatives, provenance manifest and deterministic regeneration script. |
| `tests/e2e/homepage-impact.spec.ts` | Tablet keyboard focus remains on the chosen accordion panel when its width animates under a stationary pointer. |
| `tests/e2e/homepage-catalog.spec.ts` | Regression coverage for category synchronization, reduced-motion hydration, explicit playback and reading both marquees without JavaScript. |

Hero source, shared navigation/dropdowns, footer, structured data, homepage metadata, underlying product queries, API behavior, database structures, dependencies, and application configuration are preserved. No production data writes, push, merge, or deployment form part of this review bundle.

## Verification evidence

Repository lint, TypeScript checks, unit tests, and targeted Playwright regressions were executed. The targeted browser regressions cover category/panel synchronization, reduced-motion hydration with a readable scenario list, and the existing theme toggle. The production build was also exercised; final build details are recorded in the delivery verification summary.

The browser review exercises desktop, tablet, and mobile widths in both themes. It checks the original hero and SEO output, navigation, brand controls, persistent solution links, workflow tabs, catalog selection, delivery panels, scenario playback/static reading, image loading, heading order, and horizontal fit. Additional checks exercise timed advance, durable pause, reduced motion, and scoped accessibility. The final verification summary below supplies the final counts, gate status, and performance findings; those results are not inferred from screenshots.

Browser checks do not send real inquiries. The local review harness checks the WhatsApp destination and blocks non-read requests. The contact CTA is exercised through an actual touch navigation to the local contact route. Form submission, notifications, CRM delivery, hosting behavior, field Core Web Vitals, and actual conversion lift are not claimed as verified. Screenshot review and automated accessibility checks do not establish complete WCAG conformance or real-device coverage.

Local raw evidence is under `test-results/homepage-editorial-20261120/`, including `verification.json`, lint/type/unit/build logs, Playwright results, the full-resolution PNG captures, and layout/performance/gate reports. That generated directory is not the durable source of truth for implementation; this folder keeps compressed comparison images and a client-readable report.

## Visual references and skill use

The Onda template’s public layout informed heading proportions and split compositions. The other supplied references informed selected-image pairing, short panel transitions, focus-driven accordion expansion, and marquee controls. ACTA’s own components and approved media supply the implementation; reference-site source code, imagery, and distinctive effects were not copied.

[Onda composition](https://onda-design-studio-website-template-v1.21st.app/) · [Split panel](https://21st.dev/@aloksivastava1025/components/cue-split-panel-image-synced-faq-features) · [Tab transitions](https://21st.dev/@ibelick/components/transition-panel/with-tabs) · [Image accordion](https://21st.dev/@uilayout.contact/components/tailwind-image-accordion) · [Marquee](https://magicui.design/docs/components/marquee)

The original Taste Skill by Leonxlnx (MIT) and the installed ChatGPT adaptation informed the work. Explicit user requirements take precedence over generic skill defaults: the existing hero, autoplay, marquees, effects, and section sequence remain; ACTA’s brand fonts/colors are retained; real business contact details are not replaced with `.example` values. Sections grow naturally where content or small viewports require it rather than clipping content to enforce exact viewport heights. Skill findings and limitations must be read with the final verification summary.

## How to review

Open [the comparison gallery](index.html). Compare the desktop and mobile captures first, then check the intermediate and narrow widths. Full-length images can be opened individually. On a local running branch, try selecting a catalog category with the keyboard, changing workflow stages, expanding a delivery panel, pausing both marquees, and switching to the full brand/scenario lists.

The result remains on its dedicated feature branch for review. No merge or production release is included.

## Final verification

GATE: OPEN 111 (rounds used up)

All 85 grouped browser checks passed across five widths in light and dark themes. All 21 internal destinations returned HTTP 200. The runtime recorded zero uncaught page errors. Two reduced-motion accessibility scans of the updated sections, at 390 and 1440 px in dark mode, returned zero axe violations. [Browser checks](verification.json)

Production build generated 356 pages. TypeScript, ESLint and 209 unit tests passed. Seven targeted Playwright tests passed, including keyboard/pointer conflicts, explicit Play with focus retained, static lists with JavaScript disabled, reduced-motion hydration, and the existing theme toggle.

Layout was checked at 1440 × 900, 1024 × 768, 768 × 1024, 390 × 844 and 320 × 740. None had horizontal overflow. The layout report also includes the checker’s line alignment and section-height findings. [Layout measurements](layout.json)

| Local Chrome measurement | 1440 px | 390 px |
| --- | --- | --- |
| Total transfer | 7280.7 KiB → 2021.8 KiB | 7257.8 KiB → 1998.9 KiB |
| Images bytes | 6012.3 KiB → 751.3 KiB | 5989.4 KiB → 728.5 KiB |
| Js parsed | 1112.8 KiB → 1116.9 KiB | 1112.8 KiB → 1116.9 KiB |
| Layout shift | 0.000 → 0.000 | 0.000 → 0.000 |

Each arrow compares the same local redesign before and after the final asset and interaction refinements. These are two-run local measurements. Production network conditions and inquiry conversion have not been measured. The 29 homepage logo masks decreased from 5,512,018 to 124,856 source bytes. [Previous performance run](performance-before-mask.json) · [Final performance run](performance.json)

### Open findings and scope

The final Taste check recorded 111 open findings and 38 non-blocking warnings. [All open findings, affected elements and waiver reasons](taste-gate.txt)

The checker flags fixed section-height and grid-edge preferences, the preserved card reveals, and clipping at moving marquee boundaries. Static view and reduced-motion controls expose every brand and scenario. The final CTA paragraph measures 6.14:1 against the skill’s 7:1 body-text target. Muted shared-footer text measures 3.96:1 against the 4.5:1 target. The Vercel Analytics script returns 404 on this local server. Hosting analytics and shared site styling were outside this change. The performance report also flags the existing JavaScript/font budget and image-sizing heuristics.

Three individual Taste exceptions apply to the published hero background effects, the existing word “effortless” in the hero, and the real telephone number supplied by ACTA.


Open findings by rule, grouped across checked viewports.

| Rule | Findings |
| --- | ---: |
| `edge-left` | 35 |
| `scroll-reveal` | 12 |
| `container-edges` | 7 |
| `one-section` | 6 |
| `edge-right` | 6 |
| `section-height` | 5 |
| `cut-text` | 3 |
| `card-layout` | 3 |
| `heading-scale` | 3 |
| `section-air` | 3 |
| `overlap-text` | 2 |
| `top-stagger` | 2 |
| `text-contrast` | 2 |
| `section-gaps` | 2 |
| `row-lines` | 2 |
| `screen-short` | 2 |
| `neighbour` | 2 |
| `screen-height` | 2 |
| `assets` | 1 |
| `spill` | 1 |
| `button-styles` | 1 |
| `copy-headline` | 1 |
| `copy-fact` | 1 |
| `copy-headings` | 1 |
| `moment-none` | 1 |
| `one-heading` | 1 |
| `split-pair` | 1 |
| `visual-empty` | 1 |
| `bleed-one-side` | 1 |
| `hero-fold` | 1 |
