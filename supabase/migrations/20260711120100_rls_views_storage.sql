-- RLS, public views, storage (09-DATA-SCHEMA.md §5, §9).
-- Public reads go ONLY through v_* views (definer rights, bypass base RLS in a
-- controlled way); base tables have RLS enabled with no anon policy.

-- ── RLS helper functions (§3.2) ─────────────────────────────────────────────
create or replace function public.is_active_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admin_users where user_id = auth.uid() and is_active);
$$;

create or replace function public.admin_role() returns admin_role
language sql stable security definer set search_path = public as $$
  select role from admin_users where user_id = auth.uid() and is_active;
$$;

-- ── Public views (§5.2) ─────────────────────────────────────────────────────
create view v_site_settings as
  select email, whatsapp_number, instagram, address, city, business_hours,
         tagline, footer_description, response_claim, claim_verified,
         seo_default_title, seo_default_description, featured_product_id
  from site_settings;

create view v_page_sections as
  select page_key, section_key, content
  from page_sections where is_enabled;

create view v_product_categories as
  select id, name, slug, description, sort_order, updated_at from product_categories;

create view v_article_categories as
  select id, type, name, slug, sort_order from article_categories;

create view v_media as
  select id, kind, storage_path, external_url, alt, caption, source_license,
         width, height, is_placeholder
  from media;

create view v_brands as
  select id, name, slug, website, logo_media_id, is_authorized_dealer from brands;

create view v_products as
  select p.id, p.name, p.slug, p.brand_id, b.name as brand_name, b.slug as brand_slug,
         p.category_id, c.slug as category_slug, p.short_spec, p.description_md,
         p.suitable_for, p.spec_source_url, p.is_featured,
         p.seo_title, p.seo_description, p.created_at, p.updated_at
  from products p
  join brands b on b.id = p.brand_id
  join product_categories c on c.id = p.category_id
  where p.status = 'published';

create view v_product_images as
  select pi.product_id, pi.sort_order, pi.image_annotation,
         m.id as media_id, m.kind, m.storage_path, m.external_url, m.alt, m.is_placeholder
  from product_images pi
  join media m on m.id = pi.media_id
  join products p on p.id = pi.product_id and p.status = 'published';

create view v_product_spec_values as
  select v.product_id, d.key, d.label, d.spec_group, d.data_type, d.unit,
         d.sort_order, d.is_filterable, d.is_comparable, d.better_direction,
         v.value_text, v.value_number, v.value_boolean, v.value_options
  from product_spec_values v
  join spec_definitions d on d.id = v.spec_definition_id and not d.is_archived
  join products p on p.id = v.product_id and p.status = 'published';

create view v_spec_definitions as
  select id, category_id, key, label, spec_group, data_type, unit, enum_options,
         sort_order, is_filterable, is_comparable, better_direction
  from spec_definitions where not is_archived;

create view v_solutions as
  select s.id, s.slug, s.name, s.tier, s.value_prop, s.hero_headline, s.hero_subcopy,
         m.storage_path as hero_image_path, m.external_url as hero_image_url_ext,
         m.alt as hero_image_alt, m.is_placeholder as hero_is_placeholder,
         s.hero_annotations, s.signal_chain,
         s.related_category_slugs, s.tags, s.wa_message,
         s.seo_title, s.seo_description, s.sort_order, s.updated_at
  from solutions s
  left join media m on m.id = s.hero_media_id
  where s.status = 'published';

create view v_solution_sections as
  select ss.solution_id, ss.type, ss.heading, ss.body, ss.items, ss.sort_order
  from solution_sections ss
  join solutions s on s.id = ss.solution_id and s.status = 'published';

create view v_articles as
  select a.id, a.type, a.slug, a.title, a.excerpt, a.is_featured,
         m.storage_path as cover_image_path, m.external_url as cover_image_url_ext,
         m.alt as cover_image_alt, m.caption as cover_caption, m.source_license as cover_credit,
         m.is_placeholder as cover_is_placeholder,
         a.body, a.category_id, ac.name as category_name, ac.slug as category_slug,
         a.level, a.reading_time, a.tags, a.published_at, a.updated_at,
         au.name as author_name, au.role as author_role, au.photo_media_id as author_photo_media_id,
         a.seo_title, a.seo_description
  from articles a
  join authors au on au.id = a.author_id
  left join article_categories ac on ac.id = a.category_id
  left join media m on m.id = a.cover_media_id
  where a.status = 'published';

create view v_projects as
  select p.id, p.slug, p.public_label, p.year, p.location_label,
         p.scope_description, p.scope_chips, p.sort_order,
         m.storage_path as cover_image_path, m.external_url as cover_image_url_ext,
         m.alt as cover_image_alt, m.is_placeholder as cover_is_placeholder
  from projects p
  left join media m on m.id = p.cover_media_id
  where p.status = 'published';

create view v_authors as
  select id, name, role, photo_media_id from authors;

create view v_redirects as
  select source_path, destination_path from redirects;

-- Relation/join views (§5.2 note, "DDL analog"): each joins to published parents.
create view v_product_solutions as
  select ps.product_id, ps.solution_id, ps.sort_order
  from product_solutions ps
  join products p on p.id = ps.product_id and p.status = 'published'
  join solutions s on s.id = ps.solution_id and s.status = 'published';

create view v_product_similar as
  select ps.product_id, ps.similar_product_id, ps.sort_order
  from product_similar ps
  join products p on p.id = ps.product_id and p.status = 'published'
  join products s on s.id = ps.similar_product_id and s.status = 'published';

create view v_article_products as
  select ap.article_id, ap.product_id, ap.sort_order
  from article_products ap
  join articles a on a.id = ap.article_id and a.status = 'published'
  join products p on p.id = ap.product_id and p.status = 'published';

create view v_article_solutions as
  select asol.article_id, asol.solution_id
  from article_solutions asol
  join articles a on a.id = asol.article_id and a.status = 'published'
  join solutions s on s.id = asol.solution_id and s.status = 'published';

create view v_article_related as
  select ar.article_id, ar.related_article_id, ar.sort_order
  from article_related ar
  join articles a on a.id = ar.article_id and a.status = 'published'
  join articles r on r.id = ar.related_article_id and r.status = 'published';

create view v_project_products as
  select pp.project_id, pp.product_id
  from project_products pp
  join projects pr on pr.id = pp.project_id and pr.status = 'published'
  join products p on p.id = pp.product_id and p.status = 'published';

create view v_project_solutions as
  select psol.project_id, psol.solution_id
  from project_solutions psol
  join projects pr on pr.id = psol.project_id and pr.status = 'published'
  join solutions s on s.id = psol.solution_id and s.status = 'published';

create view v_project_images as
  select pi.project_id, pi.sort_order,
         m.id as media_id, m.kind, m.storage_path, m.external_url, m.alt, m.is_placeholder
  from project_images pi
  join projects pr on pr.id = pi.project_id and pr.status = 'published'
  join media m on m.id = pi.media_id;

-- ── Enable RLS on every base table (§5.1) ───────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'admin_users','media','brands','product_categories','spec_definitions','solutions',
    'authors','article_categories','products','projects','articles','product_images',
    'product_spec_values','product_solutions','product_similar','solution_sections',
    'article_products','article_solutions','article_related','project_images',
    'project_products','project_solutions','redirects','leads','lead_throttle',
    'newsletter_subscribers','page_sections','site_settings'
  ] loop
    execute format('alter table %I enable row level security;', t);
  end loop;
end $$;

-- ── Admin policies (§5.3) ───────────────────────────────────────────────────
-- Editor+admin read/insert/update.
do $$
declare t text;
begin
  foreach t in array array[
    'products','product_images','product_spec_values','product_solutions','product_similar',
    'solutions','solution_sections','articles','article_products','article_solutions',
    'article_related','projects','project_images','project_products','project_solutions',
    'page_sections','media','authors','redirects'
  ] loop
    execute format('create policy adm_read   on %I for select using (public.is_active_admin());', t);
    execute format('create policy adm_insert on %I for insert with check (public.is_active_admin());', t);
    execute format('create policy adm_update on %I for update using (public.is_active_admin());', t);
  end loop;
end $$;

-- Delete: content tables with status — editor only when draft, admin always.
do $$
declare t text;
begin
  foreach t in array array['products','solutions','articles','projects'] loop
    execute format(
      'create policy adm_delete on %I for delete using (public.is_active_admin() and (public.admin_role() = ''admin'' or status = ''draft''));',
      t);
  end loop;
  foreach t in array array[
    'product_images','product_spec_values','product_solutions','product_similar',
    'solution_sections','article_products','article_solutions','article_related',
    'project_images','project_products','project_solutions','page_sections','media',
    'authors','redirects'
  ] loop
    execute format('create policy adm_delete on %I for delete using (public.is_active_admin());', t);
  end loop;
end $$;

-- Admin-only write (editor reads): categories, spec templates, settings, article categories.
do $$
declare t text;
begin
  foreach t in array array['product_categories','spec_definitions','site_settings','article_categories'] loop
    execute format('create policy adm_read  on %I for select using (public.is_active_admin());', t);
    execute format(
      'create policy adm_write on %I for all using (public.is_active_admin() and public.admin_role() = ''admin'') with check (public.is_active_admin() and public.admin_role() = ''admin'');',
      t);
  end loop;
end $$;

-- brands: editor reads/inserts (but only admin may set the dealer flag); admin updates/deletes.
create policy brands_read   on brands for select using (public.is_active_admin());
create policy brands_insert on brands for insert
  with check (public.is_active_admin() and (not is_authorized_dealer or public.admin_role() = 'admin'));
create policy brands_write  on brands for update
  using (public.is_active_admin() and public.admin_role() = 'admin')
  with check (public.is_active_admin() and public.admin_role() = 'admin');
create policy brands_delete on brands for delete
  using (public.is_active_admin() and public.admin_role() = 'admin');

-- admin_users, leads, lead_throttle, newsletter_subscribers: RLS on, NO policy
-- (service-role only, via server actions).

-- ── Public grants: anon/authenticated may read the curated views only ───────
grant usage on schema public to anon, authenticated;
do $$
declare v text;
begin
  foreach v in array array[
    'v_site_settings','v_page_sections','v_product_categories','v_article_categories',
    'v_media','v_brands','v_products','v_product_images','v_product_spec_values',
    'v_spec_definitions','v_solutions','v_solution_sections','v_articles','v_projects',
    'v_authors','v_redirects','v_product_solutions','v_product_similar','v_article_products',
    'v_article_solutions','v_article_related','v_project_products','v_project_solutions',
    'v_project_images'
  ] loop
    execute format('grant select on %I to anon, authenticated;', v);
  end loop;
end $$;

-- ── Storage (§9) ────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;
