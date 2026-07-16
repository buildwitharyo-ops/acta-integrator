import { test, expect } from "@playwright/test";
import { serviceClient } from "./helpers/supabase";

// 10-TECH §11.4 smoke #3 — Quote/contact form: valid submit shows success + persists a `leads` row
// (09 §4.17); invalid submit (no email/phone) shows the inline zod error.
test.describe("Contact/quote form", () => {
  test("valid submit shows success and persists a leads row", async ({ page }) => {
    const marker = `Playwright E2E ${Date.now()}`;
    await page.goto("/contact");

    await page.getByPlaceholder("Nama Anda").fill(marker);
    await page.getByPlaceholder("nama@perusahaan.com").fill("playwright-e2e@example.test");
    await page.getByPlaceholder("Ceritakan kebutuhan sistem AV Anda.").fill("Test otomatis dari Playwright E2E — abaikan.");
    await page.getByRole("button", { name: "Kirim Permintaan" }).click();

    await expect(page.getByText("TERKIRIM")).toBeVisible();
    await expect(page.getByText("Permintaan Anda sudah kami terima.")).toBeVisible();

    // Assert the row landed in Supabase, then clean it up so the test leaves no trace (09 §4.17 —
    // this is real production data since dev/prod is one project, per project memory).
    const sb = serviceClient();
    const { data: lead } = await sb.from("leads").select("id").eq("name", marker).maybeSingle();
    expect(lead, "expected a leads row to be created for this submit").not.toBeNull();
    if (lead) await sb.from("leads").delete().eq("id", lead.id);
  });

  test("invalid submit (no email or phone) shows the inline zod error", async ({ page }) => {
    await page.goto("/contact");

    await page.getByPlaceholder("Nama Anda").fill("Playwright Invalid Case");
    // Leave email + phone both empty — the schema's refine() requires at least one.
    await page.getByRole("button", { name: "Kirim Permintaan" }).click();

    await expect(page.getByRole("alert").filter({ hasText: "Email atau nomor telepon wajib diisi" })).toBeVisible();
  });
});
