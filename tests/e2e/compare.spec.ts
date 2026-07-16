import { test, expect } from "@playwright/test";

// 10-TECH §11.4 smoke #2 — Compare: 2 same-category products can be compared; a different-category
// product's checkbox is disabled (cannot be added) while a comparison is active.
//
// ProductCard's outer wrapper has no test id, but the inner <Link aria-label={product.name}> does —
// anchor on that (a real accessible name, not a fragile class selector) and walk up to the card via
// the parent axis to reach the sibling compare-checkbox footer.
function cardFor(page: import("@playwright/test").Page, name: string) {
  return page.getByRole("link", { name, exact: true }).locator("xpath=..");
}

test.describe("Compare", () => {
  test("adds 2 same-category products and opens the compare table; blocks a cross-category pick", async ({ page }) => {
    // The catalog has 50+ products and CatalogBrowser only renders the first BATCH (24) of the
    // default/unfiltered listing (client-side "Muat lebih banyak" paging) — neither target product
    // is guaranteed to be in that first page. Search narrows to just the products under test instead.
    // Compare selection persists across these full navigations via sessionStorage (CompareProvider).
    await page.goto("/products?q=Shure");
    await cardFor(page, "Shure SM58").getByLabel("Bandingkan").check();
    await cardFor(page, "Shure SM57").getByLabel("Bandingkan").check();

    // Cross-category: a Display product's checkbox must be disabled while an Audio comparison is active.
    await page.goto("/products?q=AVION");
    await expect(cardFor(page, "AVION AX Series").getByLabel("Bandingkan")).toBeDisabled();

    // Open the tray and go to compare.
    await page.getByRole("button", { name: /Bandingkan \(2\)/ }).click();
    await expect(page).toHaveURL(/\/products\/compare\?items=/);

    // Both products' spec columns should render on the compare table (CompareTable renders each
    // product as a <table> columnheader containing a plain <p> name, not a heading element).
    await expect(page.getByRole("columnheader", { name: "Shure SM58" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Shure SM57" })).toBeVisible();
  });
});
