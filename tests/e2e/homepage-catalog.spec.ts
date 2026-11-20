import { expect, test } from "@playwright/test";

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

test.describe("homepage without JavaScript", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 320, height: 740 } });

  test("exposes every brand and scenario in readable static lists", async ({ page }) => {
    await page.goto("/");
    const brands = page.locator("#home-technology");
    const scenarios = page.locator("#home-testimonials");
    await expect(brands.getByRole("img")).toHaveCount(29);
    await expect(scenarios.getByRole("article")).toHaveCount(9);
    await expect(brands.getByRole("button")).toHaveCount(0);
    await expect(scenarios.getByRole("button")).toHaveCount(0);
    await expect(page.locator("#home-operating-scenarios")).toHaveCSS("overflow", "visible");
    await expect(page.locator("#home-technology-brands")).toHaveCSS("overflow", "visible");
  });
});
