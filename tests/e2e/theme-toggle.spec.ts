import { test, expect } from "@playwright/test";

// 10-TECH §11.4 smoke #5 — Theme: toggling sets html.dark + changes --background, and the reload
// stays FOUC-free because next-themes ships a synchronous blocking script (runs before hydration,
// reads localStorage, applies the class) rather than relying on a post-hydration effect.
test.describe("Theme toggle", () => {
  test("toggles dark mode, updates CSS tokens, and ships a no-FOUC blocking script", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Ganti tema" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    // 02-DESIGN-SYSTEM: --background lightness differs between themes (dark ~9%, light ~95%).
    const bg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--background").trim());
    expect(bg).toContain("9%");

    // No-FOUC proof: next-themes' blocking script (sets documentElement's class from localStorage
    // synchronously, before any hydration/paint) is present in the shipped HTML.
    const html = await page.content();
    const hasBlockingScript = /<script>[^<]*documentElement[^<]*localStorage\.getItem[^<]*<\/script>/.test(html);
    expect(hasBlockingScript).toBe(true);

    // Persists across reload (localStorage-driven, applied before hydration each time).
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});
