import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 768, height: 1024 } });

test("delivery accordion keyboard selection survives a stationary pointer during expansion", async ({ page }) => {
  await page.route("**/*", (route) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(route.request().method())) {
      return route.fulfill({ status: 204, body: "" });
    }
    return route.continue();
  });
  await page.goto("/");
  const section = page.locator("#what-we-deliver");
  const triggers = section.locator("button[aria-expanded]");
  await expect(triggers).toHaveCount(4);

  // Let the final card expand under the pointer. Selecting the first by keyboard
  // then changes the geometry beneath that pointer, without a real mouse move.
  const first = triggers.first();
  const last = triggers.last();
  await last.hover();
  await expect(last).toHaveAttribute("aria-expanded", "true");
  await last.focus();
  await last.press("Home");
  await expect(first).toBeFocused();
  await expect(first).toHaveAttribute("aria-expanded", "true");

  // Wait on actual expanded geometry rather than a fixed animation delay.
  await expect.poll(async () => {
    const firstBox = await first.boundingBox();
    const lastBox = await last.boundingBox();
    return (firstBox?.width ?? 0) - (lastBox?.width ?? 0);
  }).toBeGreaterThan(50);
  await expect(first).toHaveAttribute("aria-expanded", "true");
  await expect(last).toHaveAttribute("aria-expanded", "false");

  await first.press("ArrowRight");
  await expect(triggers.nth(1)).toBeFocused();
  await expect(triggers.nth(1)).toHaveAttribute("aria-expanded", "true");
  await expect(section.locator("button[aria-expanded='true']")).toHaveCount(1);
});
