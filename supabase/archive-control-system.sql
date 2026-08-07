-- Withdraw the Control System category and its products from the public catalog.
-- Requested 2026-08-07. REVERSIBLE BY DESIGN — see the rollback block at the bottom.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- WHY UNPUBLISH AND NOT DELETE
-- ─────────────────────────────────────────────────────────────────────────────
-- Unpublishing removes a product from every public surface — v_products filters on
-- status='published', so the hub, the category page, generateStaticParams, the
-- sitemap and search all stop seeing it — while keeping the row, its 3 image rows
-- and its 31 hand-entered `product_spec_values`. A hard delete would cascade all of
-- that away permanently for a decision that may well be revisited; the spec values
-- in particular represent real data-entry effort that cannot be recovered from the
-- vendor page automatically.
--
-- WHY `draft` AND NOT `archived`, even though the enum has `archived`:
-- `products.status` carries `check (status in ('draft','published'))`
-- (20260711120000_schema.sql:148) — `archived` is a legal `pub_status` value but is
-- rejected for products specifically. That restriction is mirrored all the way up
-- the stack: the Zod schema (lib/actions/admin/products.ts:40), setProductStatus's
-- signature, and ProductForm's props all type status as `"draft" | "published"`.
-- Widening the constraint alone would create rows the admin UI cannot represent or
-- re-save. Proper archive support for products is a small feature — constraint +
-- Zod + action + form + list filter — and deliberately out of scope here.
--
-- The practical outcome is identical: invisible publicly, fully reversible. The one
-- cost is semantic — in the admin these read as "unfinished" rather than
-- "withdrawn". This file and lib/gone.ts are the record that they were withdrawn.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- WHY THE CATEGORY ROW IS NOT TOUCHED
-- ─────────────────────────────────────────────────────────────────────────────
-- `products.category_id` is `on delete restrict` (20260711120000_schema.sql:141),
-- so the category row cannot be deleted while archived products still point at it,
-- and `product_categories` has no status column to flip.
--
-- Rather than bend the schema, the category disappears the moment it has no
-- published products: `getProductCategories()` now filters on published count
-- (lib/queries/products.ts). That is data-driven and self-maintaining — it also
-- fixes the latent bug where ANY empty category rendered a thin, indexable,
-- product-less page.
--
-- The four public URLs return **410 Gone** via `lib/gone.ts` + middleware.ts —
-- the honest answer for permanently withdrawn stock, and Google drops a 410 from
-- the index faster than a 404. If these products ever come back, remove their
-- paths from GONE_PATHS in the same change that un-archives them.

begin;

-- The three products, named explicitly rather than selected by category, so this
-- script does exactly what it says even if the category gains rows later.
update products
   set status = 'draft'
 where slug in (
   'cue-controlcue-three',   -- CUE controlCue - Three
   'audac-rivea-amk10-b',    -- AUDAC RIVEA-AMK10/B (bracket for the RIVEA-L control panel)
   'cue-relaycue-8'          -- CUE relayCUE-8 (CS0335-2)
 );

-- Guard: refuse to commit if the category still exposes anything publicly.
do $$
declare remaining int;
begin
  select count(*) into remaining
    from products p
    join product_categories c on c.id = p.category_id
   where c.slug = 'control-system' and p.status = 'published';
  if remaining > 0 then
    raise exception 'control-system still has % published product(s) — aborting', remaining;
  end if;
end $$;

commit;


-- ─────────────────────────────────────────────────────────────────────────────
-- ROLLBACK — restores the catalog exactly as it was
-- ─────────────────────────────────────────────────────────────────────────────
-- update products
--    set status = 'published'
--  where slug in ('cue-controlcue-three','audac-rivea-amk10-b','cue-relaycue-8');
--
-- Then delete the four paths from GONE_PATHS in lib/gone.ts, or the pages will
-- keep returning 410 while the rows are live again.


-- ─────────────────────────────────────────────────────────────────────────────
-- HARD DELETE — only if the decision is final. NOT reversible.
-- ─────────────────────────────────────────────────────────────────────────────
-- Cascades away 3 product_images and 31 product_spec_values. Run the product
-- delete FIRST: the category FK is `on delete restrict`.
--
-- delete from products where slug in ('cue-controlcue-three','audac-rivea-amk10-b','cue-relaycue-8');
-- delete from product_categories where slug = 'control-system';
