import { test, expect } from "@playwright/test";

// 10-TECH §11.4 smoke #1 — Catalog filter: category filter narrows the grid + updates the URL;
// search finds a specific known product.
test.describe("Catalog filter + search", () => {
  test("filtering by category narrows the grid and updates the URL", async ({ page }) => {
    await page.goto("/products");

    await page.getByRole("button", { name: "Audio", exact: true }).click();
    await expect(page).toHaveURL(/[?&]category=audio(&|$)/);

    // An Audio product should be visible; a Display-only product should not.
    await expect(page.getByRole("heading", { name: "Shure SM58", exact: false }).first()).toBeVisible();
    await expect(page.getByText("AVION AX Series", { exact: false })).toHaveCount(0);
  });

  test("search finds a known product by brand name", async ({ page }) => {
    await page.goto("/products");

    await page.getByPlaceholder("Cari produk, brand, atau spec…").fill("Shure");
    // Debounced 300ms (06 §1.3) before the URL/grid update.
    await expect(page).toHaveURL(/[?&]q=Shure(&|$)/, { timeout: 5000 });
    await expect(page.getByText("Shure SM58", { exact: false }).first()).toBeVisible();
  });
});
