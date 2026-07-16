import { test, expect } from "@playwright/test";
import { serviceClient } from "./helpers/supabase";

// 10-TECH §11.4 smoke #4 — Admin login → publish roundtrip: proves revalidateTag actually fires on
// publish (the public page reflects a brand-new title immediately, no redeploy needed).
//
// Uses a dedicated throwaway Learn article (created directly via service-role, satisfying the
// publish guardrail's cover+alt/category/author requirements up front) rather than touching one of
// the real seed articles — fully torn down in afterAll regardless of pass/fail.

const TEST_ADMIN_EMAIL = process.env.PLAYWRIGHT_TEST_ADMIN_EMAIL;
const TEST_ADMIN_PASSWORD = process.env.PLAYWRIGHT_TEST_ADMIN_PASSWORD;

test.describe("Admin login → publish roundtrip", () => {
  test.skip(!TEST_ADMIN_EMAIL || !TEST_ADMIN_PASSWORD, "PLAYWRIGHT_TEST_ADMIN_EMAIL/PASSWORD not set");

  let articleId: string;
  let slug: string;
  const originalTitle = `E2E Draft ${Date.now()}`;
  const publishedTitle = `E2E Published ${Date.now()}`;

  test.beforeAll(async () => {
    const sb = serviceClient();
    slug = `e2e-test-${Date.now()}`;
    const { data: cover } = await sb.from("media").select("id").not("alt", "is", null).neq("alt", "").limit(1).single();
    const { data: category } = await sb.from("article_categories").select("id").eq("type", "learn").limit(1).single();
    const { data: author } = await sb.from("authors").select("id").limit(1).single();

    const { data, error } = await sb
      .from("articles")
      .insert({
        type: "learn",
        slug,
        title: originalTitle,
        excerpt: "Artikel sementara untuk Playwright E2E — aman dihapus otomatis setelah test.",
        cover_media_id: cover!.id,
        body: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "E2E test content." }] }] },
        category_id: category!.id,
        author_id: author!.id,
        status: "draft",
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(`Failed to create throwaway test article: ${error?.message}`);
    articleId = data.id;
  });

  test.afterAll(async () => {
    if (articleId) await serviceClient().from("articles").delete().eq("id", articleId);
  });

  test("editing the title and publishing reflects immediately on the public page", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(TEST_ADMIN_EMAIL!);
    await page.getByLabel("Password").fill(TEST_ADMIN_PASSWORD!);
    await page.getByRole("button", { name: "Masuk" }).click();
    // A plain /\/admin(\/|$)/ regex also matches "/admin/login" itself (substring match), so it would
    // pass even if sign-in silently failed and the page never left the login screen — assert via a
    // pathname predicate instead so a real auth failure actually fails this test.
    await page.waitForURL((url) => url.pathname.startsWith("/admin") && !url.pathname.startsWith("/admin/login"), {
      timeout: 10000,
    });

    await page.goto(`/admin/articles/${articleId}`);
    // The admin Field component doesn't associate <label> with its input (missing htmlFor/id — a
    // real a11y gap flagged separately in the Fase 13 launch audit), so getByLabel won't resolve
    // here; scope structurally via the "Konten" section instead.
    const kontenSection = page.locator("section").filter({ has: page.getByRole("heading", { name: "Konten", exact: true }) });
    const titleInput = kontenSection.locator("input").first();
    await expect(titleInput).toHaveValue(originalTitle);
    await titleInput.fill(publishedTitle);
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByText("Artikel dipublish.")).toBeVisible();

    await page.goto(`/learn/${slug}`);
    await expect(page.getByRole("heading", { name: publishedTitle, exact: true })).toBeVisible();
  });
});
