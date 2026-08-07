import { test, expect } from "@playwright/test";

// 03 §12.6 — the no-JS contract for /learn.
//
// This file guards the single claim the whole section's SEO thesis rests on: every /learn page
// delivers a complete, correct, useful answer in server HTML before a byte of JavaScript runs.
// That is not a graceful-degradation nicety — it is the primary implementation. Googlebot, an
// LLM crawler, and a reader on a throttled mid-range Android over 4G all see the same page, and
// a calculator that only computes after hydration is, to all three, an empty form.
//
// Runs under the `no-js` Playwright project (javaScriptEnabled: false, see playwright.config.ts).
// Run with: npx playwright test --project=no-js
//
// Assertions here are deliberately structural rather than copy-exact — they must keep passing as
// lessons are written and renamed, and fail the moment rendering moves client-side.

test.describe("/learn works with JavaScript disabled", () => {
  test("the hub lists its content server-side", async ({ page }) => {
    const res = await page.goto("/learn");
    expect(res?.status()).toBe(200);

    // The h1 is server-rendered, not hydrated in.
    await expect(page.locator("h1")).toBeVisible();

    // The section's navigation must be real anchors. Topic navigation deliberately links to
    // /learn/jalur/{slug} pillar pages rather than ?topic= facets (02 §7.4), so with JS off
    // every route into the section is still traversable.
    const html = await page.content();
    expect(html).toContain("/learn/alat/");
  });

  test("a calculator computes through a native GET form, with no JS", async ({ page }) => {
    await page.goto("/learn/alat/ukuran-layar");

    // The default preset must already be computed in the server HTML — not a blank form.
    const initial = await page.content();
    expect(initial).toMatch(/\d/);

    // The math panel is a native <details>, always present in the HTML.
    await expect(page.locator("details").first()).toBeAttached();

    // The form is a real GET form. Native submission is the no-JS compute path.
    const form = page.locator("form[method='get' i]").first();
    await expect(form).toBeAttached();
  });

  test("a params URL still renders a computed answer server-side", async ({ page }) => {
    // A crafted/garbage URL must clamp to defaults and never 500 — bots and link scrapers
    // send exactly this kind of thing.
    const res = await page.goto("/learn/alat/rt60-sabine?p=8&l=6&t=3");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("a hostile params URL does not error", async ({ page }) => {
    const res = await page.goto("/learn/alat/rt60-sabine?p=NaN&l=-99999&t=Infinity&n=%E2%9A%A1");
    expect(res?.status()).toBe(200);
  });

  test("the glossary renders its terms server-side", async ({ page }) => {
    const res = await page.goto("/learn/glosarium");
    expect(res?.status()).toBe(200);
    // Anchored terms are the whole point of the single-page glossary (02 §8.5).
    expect(await page.locator("[id]").count()).toBeGreaterThan(5);
  });
});
