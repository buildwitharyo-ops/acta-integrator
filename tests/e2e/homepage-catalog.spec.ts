import { expect, test } from "@playwright/test";
import { HOMEPAGE_BRAND_GROUPS, HOMEPAGE_BRAND_PARTNERS } from "../../lib/homepage-brand-partners";

test("keyboard category changes update the equipment panel and its destination together", async ({ page }) => {
  await page.goto("/");
  const catalog = page.getByRole("group", { name: "Equipment categories" });
  const previews = catalog.getByRole("button", { name: /^Preview / });
  expect(await previews.count()).toBeGreaterThan(1);

  // The first pointer entry can have zero reported movement.
  await previews.last().hover();
  await expect(previews.last()).toHaveAttribute("aria-current", "true");
  const lastName = (await previews.last().getAttribute("aria-label"))!.slice("Preview ".length);
  await expect(catalog.getByRole("heading", { name: lastName, exact: true })).toBeVisible();

  // Leave the pointer over the first row, then move through the list by keyboard.
  await previews.first().hover();
  await previews.first().focus();
  for (const preview of (await previews.all()).slice(1)) {
    const name = (await preview.getAttribute("aria-label"))!.slice("Preview ".length);
    await preview.focus();
    await page.keyboard.press("Enter");
    await expect(preview).toHaveAttribute("aria-current", "true");
    await expect(catalog.getByRole("heading", { name, exact: true })).toBeVisible();
    const category = catalog.getByRole("link", { name: `Browse ${name} products`, exact: true });
    await expect(catalog.getByRole("link", { name: "Browse category", exact: true }))
      .toHaveAttribute("href", (await category.getAttribute("href"))!);
  }
});

test("the homepage hydrates with reduced motion and exposes the full static scenario list", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const tabs = page.getByRole("tablist", { name: "Project stages" }).getByRole("tab");
  await tabs.first().focus();
  await page.keyboard.press("End");
  await expect(tabs.last()).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#home-testimonials").getByRole("article").last()).toBeVisible();
  await expect(page.getByRole("button", { name: "Pause catalog preview" })).toHaveCount(0);
  expect(errors).toEqual([]);
});

for (const preview of [
  { label: "catalog preview", region: "[aria-label='Equipment categories']", active: "button[aria-current='true']", input: "pointer" },
  { label: "stages", region: "#how-we-work", active: "[role='tab'][aria-selected='true']", input: "keyboard" },
]) {
  test(`Play ${preview.label} resumes while its control stays focused`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    const region = page.locator(preview.region);
    await region.getByRole("button", { name: `Pause ${preview.label}` }).click();
    const active = region.locator(preview.active);
    const before = await active.innerText();
    const play = region.getByRole("button", { name: `Play ${preview.label}` });
    if (preview.input === "pointer") {
      await play.click();
    } else {
      await play.focus();
      await play.press("Enter");
    }
    await expect(region.getByRole("button", { name: `Pause ${preview.label}` })).toBeFocused();
    await expect.poll(() => active.innerText(), { timeout: 10000 }).not.toBe(before);
  });
}


test("homepage partner marquee uses the profile lineup and preserves grouped access", async ({ page }) => {
  await page.goto("/");
  const brands = page.locator("#home-technology");
  await expect(brands.getByRole("img")).toHaveCount(HOMEPAGE_BRAND_PARTNERS.length);
  const movingNames = await brands.getByRole("img").evaluateAll((items) => items.map((item) => item.getAttribute("aria-label")));
  expect(movingNames.sort()).toEqual(HOMEPAGE_BRAND_PARTNERS.map((logo) => logo.name).sort());
  await brands.getByRole("button", { name: "View all brands", exact: true }).click();
  await expect(brands.getByRole("button", { name: "Show fewer", exact: true })).toHaveAttribute("aria-expanded", "true");
  for (const group of HOMEPAGE_BRAND_GROUPS) {
    const region = brands.getByRole("group", { name: group.label, exact: true });
    await expect(region).toBeVisible();
    await expect(region.getByRole("img")).toHaveCount(group.logos.length);
  }
  await brands.getByRole("button", { name: "Show fewer", exact: true }).click();
  await expect(brands.getByRole("button", { name: "View all brands", exact: true })).toHaveAttribute("aria-expanded", "false");
  await expect(brands.getByRole("button")).toHaveCount(1);
  await expect(brands.getByRole("img")).toHaveCount(HOMEPAGE_BRAND_PARTNERS.length);
});

test("delivery drawings and the handover overview open from their mobile previews", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const delivery = page.locator("#how-we-work");
  for (const preview of [
    { stage: "Design", file: "av-drawing-set.webp" },
    { stage: "Commission & hand over", file: "acta-care-overview.webp" },
  ]) {
    await delivery.getByRole("tab", { name: new RegExp(preview.stage) }).click();
    const image = delivery.locator('[aria-hidden="false"] img');
    await expect(image).toHaveCSS("object-fit", "contain");
    await image.scrollIntoViewIfNeeded();
    const bounds = (await image.boundingBox())!;
    const opened = page.waitForEvent("popup");
    await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    const popup = await opened;
    await expect(popup).toHaveURL(new URL(`/images/home-delivery/${preview.file}`, page.url()).href);
    await popup.locator("img").evaluate((asset: HTMLImageElement) => asset.decode());
    await popup.close();
  }
});

test.describe("homepage without JavaScript", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 320, height: 740 } });

  test("exposes every brand and scenario in readable static lists", async ({ page }) => {
    await page.goto("/");
    const brands = page.locator("#home-technology");
    const scenarios = page.locator("#home-testimonials");
    const placements = HOMEPAGE_BRAND_GROUPS.flatMap((group) => group.logos.map((logo) => logo.name));
    await expect(brands.getByRole("img")).toHaveCount(placements.length);
    const labels = await brands.getByRole("img").evaluateAll((items) => items.map((item) => item.getAttribute("aria-label")));
    expect(labels.sort()).toEqual(placements.sort());
    expect(new Set(labels).size).toBe(HOMEPAGE_BRAND_PARTNERS.length);
    for (const group of HOMEPAGE_BRAND_GROUPS) {
      await expect(brands.getByRole("group", { name: group.label, exact: true })).toBeVisible();
    }
    await expect(scenarios.getByRole("article")).toHaveCount(9);
    await expect(brands.getByRole("button")).toHaveCount(0);
    await expect(scenarios.getByRole("button")).toHaveCount(0);
    await expect(page.locator("#home-operating-scenarios")).toHaveCSS("overflow", "visible");
    await expect(page.locator("#home-technology-brands")).toHaveCSS("overflow", "visible");
  });
});
