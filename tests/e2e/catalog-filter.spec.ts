import { test, expect } from "@playwright/test";

// 10-TECH §11.4 smoke #1 — Catalog filter: category filter narrows the grid + updates the URL;
// search finds a specific known product.
test.describe("Catalog filter + search", () => {
  test("filtering by category narrows the grid and updates the URL", async ({ page }) => {
    await page.goto("/products");

    await page.getByRole("button", { name: "Audio", exact: true }).click();
    await expect(page).toHaveURL(/[?&]category=audio(&|$)/);

    const subcategories = page.getByRole("navigation", { name: "Subkategori produk" });
    await subcategories.getByRole("button", { name: "Mixer Audio", exact: true }).click();
    await expect(page).toHaveURL(/[?&]group=mixers(&|$)/);
    await expect(page.getByRole("heading", { name: "Allen & Heath CQ-18T", exact: true })).toBeVisible();
    await expect(page.getByText("AVION AX Series", { exact: false })).toHaveCount(0);
  });

  test("search finds a known product by brand name", async ({ page }) => {
    await page.goto("/products");

    await page.getByPlaceholder("Cari produk, brand, atau spec…").fill("Telycam");
    // Debounced 300ms (06 §1.3) before the URL/grid update.
    await expect(page).toHaveURL(/[?&]q=Telycam(&|$)/, { timeout: 5000 });
    await expect(page.getByRole("heading", { name: "Telycam Drive 12x — FHD IP PTZ Camera", exact: true })).toBeVisible();
  });
});
