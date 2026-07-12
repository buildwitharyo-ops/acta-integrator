-- ACTA seed data (09-DATA-SCHEMA.md §11). Applied after schema + rls/views migrations.
-- Assembled from base tables + doc-extracted content (docs 04/05/06/07/11).

-- ═══ 1. Media pool + authors + brands + categories ═══
-- ── Media pool (placeholders — is_placeholder=true, TO-REPLACE before launch) ──
insert into media (kind, external_url, alt, source_license, is_placeholder, width, height) values
 ('external','https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80&auto=format&fit=crop','Ruang meeting modern dengan meja panjang','Unsplash — free license (TO-REPLACE)',true,1600,1067),
 ('external','https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1600&q=80&auto=format&fit=crop','Ruang rapat dengan display besar','Unsplash — free license (TO-REPLACE)',true,1600,1067),
 ('external','https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1600&q=80&auto=format&fit=crop','Interior kantor kolaboratif','Unsplash — free license (TO-REPLACE)',true,1600,1067),
 ('external','https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&q=80&auto=format&fit=crop','Tim berkolaborasi dengan perangkat','Unsplash — free license (TO-REPLACE)',true,1600,1067),
 ('external','https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=1600&q=80&auto=format&fit=crop','Auditorium modern','Unsplash — free license (TO-REPLACE)',true,1600,1067),
 ('external','https://images.unsplash.com/photo-1462899006636-339e08d1844e?w=1600&q=80&auto=format&fit=crop','Interior auditorium berjenjang','Unsplash — free license (TO-REPLACE)',true,1600,1067),
 ('external','https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&q=80&auto=format&fit=crop','Audiens di ruang acara','Unsplash — free license (TO-REPLACE)',true,1600,1067),
 ('external','https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1600&q=80&auto=format&fit=crop','Ruang kerja terang','Unsplash — free license (TO-REPLACE)',true,1600,1067),
 ('external','https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=1600&q=80&auto=format&fit=crop','Diskusi tim di ruang rapat','Unsplash — free license (TO-REPLACE)',true,1600,1067),
 ('external','https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1600&q=80&auto=format&fit=crop','Ruang rapat dengan layar presentasi','Unsplash — free license (TO-REPLACE)',true,1600,1067),
 ('external','https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=1600&q=80&auto=format&fit=crop','Instalasi layar LED besar','Unsplash — free license (TO-REPLACE)',true,1600,1067),
 ('external','https://images.unsplash.com/photo-1560439514-4e9645039924?w=1600&q=80&auto=format&fit=crop','Perangkat teknologi audio visual','Unsplash — free license (TO-REPLACE)',true,1600,1067);

-- ── Authors (§11.2) ─────────────────────────────────────────────────────────
insert into authors (name, role) values ('Aryo','CEO'), ('Kevin','CTO'), ('Owen','COO');

-- ── Brands (§11.4) — all is_authorized_dealer=false ("Technology We Work With") ─
insert into brands (name, slug, website, is_authorized_dealer) values
 ('Absen','absen','https://www.absen.com',false),
 ('BenQ','benq','https://www.benq.com',false),
 ('Samsung','samsung','https://www.samsung.com',false),
 ('QSC','qsc','https://www.qsc.com',false),
 ('Shure','shure','https://www.shure.com',false),
 ('Logitech','logitech','https://www.logitech.com',false),
 ('Crestron','crestron','https://www.crestron.com',false),
 ('BrightSign','brightsign','https://www.brightsign.biz',false);

-- ── Product categories (§11.5) ──────────────────────────────────────────────
insert into product_categories (name, slug, description, sort_order) values
 ('Display','display','Layar profesional, videowall, dan panel interaktif.',0),
 ('Audio','audio','Loudspeaker, mixer, DSP, dan sistem tata suara.',1),
 ('Conferencing & Collaboration','conferencing-collaboration','Kamera, bar konferensi, dan perangkat kolaborasi ruang rapat.',2),
 ('Control System','control-system','Panel kontrol, prosesor, dan otomasi ruangan.',3),
 ('Digital Signage','digital-signage','Media player dan sistem signage untuk konten dinamis.',4),
 ('Infrastructure & Networking','infrastructure-networking','Switch, AV-over-IP, dan perangkat distribusi sinyal.',5);

-- ═══ 2. site_settings + page_sections ═══
-- =====================================================================
-- SEED: site_settings (singleton) + page_sections registry
-- Sources: 04-HOMEPAGE-SPEC.md, 11-CONTENT-IMAGE-GUIDE.md §5, 09-DATA-SCHEMA.md §4.1/§4.2/§11
-- All *_media_id refs intentionally omitted from content — media wired separately in assembly.
-- =====================================================================

-- 1) site_settings (single row; id defaults to 1, not set) -------------
insert into site_settings (
  email, whatsapp_number, instagram, city, business_hours,
  tagline, footer_description, response_claim, claim_verified,
  seo_default_title, seo_default_description
) values (
  'acta.arc@gmail.com',
  '6281563905555',
  '@acta.integrator',
  'Tangerang, Indonesia',
  null,
  'Smarter Systems. Real Impact.',
  'Integrator sistem audio visual komersial untuk ruang rapat, auditorium, hall multifungsi, dan gedung komersial — Jakarta & Tangerang.',
  'Respon < 1 hari kerja · Konsultasi awal gratis',
  false,
  'ACTA — Commercial AV & Multimedia Systems Integrator Indonesia',
  'ACTA merancang, memasang, dan mengintegrasikan sistem audio visual komersial — smart meeting room, auditorium, hall multifungsi, hingga sound system gedung. Konsultasi, desain, instalasi, sampai pelatihan tim Anda.'
)
on conflict (id) do update set
  email                   = excluded.email,
  whatsapp_number         = excluded.whatsapp_number,
  instagram               = excluded.instagram,
  city                    = excluded.city,
  business_hours          = excluded.business_hours,
  tagline                 = excluded.tagline,
  footer_description       = excluded.footer_description,
  response_claim          = excluded.response_claim,
  claim_verified          = excluded.claim_verified,
  seo_default_title       = excluded.seo_default_title,
  seo_default_description = excluded.seo_default_description,
  updated_at              = now();

-- 2) page_sections registry (19 rows) ---------------------------------
insert into page_sections (page_key, section_key, content, is_enabled) values

-- ---- home ----------------------------------------------------------
('home', 'hero', '{
  "eyebrow": "COMMERCIAL AV / MULTIMEDIA SYSTEMS INTEGRATOR — TANGERANG, ID",
  "headline_1": "AV Systems, Engineered.",
  "headline_2": "Not Just Installed.",
  "subheadline": "Dari ruang rapat hingga auditorium — ACTA merancang, memasang, dan mengintegrasikan sistem audio visual komersial yang bekerja sebagai satu kesatuan. Konsultasi, desain, instalasi, sampai pelatihan tim Anda.",
  "cta_primary": {"label": "Konsultasi Gratis", "href": "https://wa.me/6281563905555?text=Halo%20ACTA,%20saya%20ingin%20konsultasi%20kebutuhan%20AV"},
  "cta_secondary": {"label": "Lihat Solutions", "href": "/solutions"},
  "annotations": [{"label": "RT60 0.6s"}, {"label": "SPL 98dB"}, {"label": "4K@60"}]
}'::jsonb, true),

('home', 'trust_strip', '{
  "label": "TECHNOLOGY WE WORK WITH",
  "logos": [
    {"name": "Absen"},
    {"name": "BenQ"},
    {"name": "Samsung"},
    {"name": "QSC"},
    {"name": "Shure"},
    {"name": "Logitech"},
    {"name": "Crestron"},
    {"name": "BrightSign"}
  ]
}'::jsonb, true),

('home', 'solutions', '{
  "headline": "A Solution for Every Space.",
  "subheadline": "Delapan tipe ruang, satu standar perancangan."
}'::jsonb, true),

('home', 'how_we_work', '{
  "headline": "From Consultation to Handover.",
  "steps": [
    {"no": "01", "title": "Consultation & System Design", "description": "Kami mulai dari kebutuhan dan ruang Anda, bukan dari katalog. Analisis fungsi, akustik, dan anggaran menghasilkan desain sistem yang tepat ukuran — tidak kurang, tidak berlebihan."},
    {"no": "02", "title": "Installation & Integration", "description": "Pemasangan rapi dengan standar engineering: audio, visual, dan kontrol bekerja sebagai satu sistem, bukan kumpulan perangkat terpisah."},
    {"no": "03", "title": "Equipment Supply", "description": "Perangkat kelas profesional dari brand yang kami kenal sampai ke level konfigurasi — dipilih sesuai desain sistem, bukan sekadar yang tersedia."},
    {"no": "04", "title": "Training & Maintenance", "description": "Sistem terbaik pun butuh operator yang percaya diri. Kami melatih tim Anda dan mendampingi dengan dukungan teknis jangka panjang."}
  ]
}'::jsonb, true),

('home', 'catalog_teaser', '{
  "headline": "Professional Gear, Curated by Need.",
  "subheadline": "Jelajahi katalog perangkat berdasarkan kategori — dan minta penawaran untuk kebutuhan Anda.",
  "cta": {"label": "Lihat Katalog", "href": "/products"}
}'::jsonb, true),

('home', 'proof', '{
  "eyebrow": "SELECTED WORK",
  "headline": "Installed and Working.",
  "cta": {"label": "Diskusikan project serupa", "href": "https://wa.me/6281563905555?text=Halo%20ACTA,%20saya%20ingin%20mendiskusikan%20project%20serupa"}
}'::jsonb, true),

('home', 'why_acta', '{
  "headline": "A Technology Partner, Not Just an Installer.",
  "intro": "Akar teknis kami di sound engineering dan integrasi sistem — kami paham sistem sampai ke detail sinyal.",
  "points": [
    {"title": "Berangkat dari kebutuhan, bukan katalog.", "description": "Kami analisis ruang, akustik, dan cara tim Anda bekerja — lalu merancang sistem tepat ukuran. Tidak kurang, tidak berlebihan."},
    {"title": "Satu sistem, bukan kumpulan perangkat.", "description": "Audio, visual, dan kontrol dirancang terintegrasi sejak desain — bukan dipaksa bersama di lapangan."},
    {"title": "RAB transparan.", "description": "Desain sistem dan rancangan anggaran yang jelas. Anda tahu persis apa yang dibayar dan kenapa."},
    {"title": "Tidak lepas tangan setelah instalasi.", "description": "Pelatihan operator dan dukungan teknis berkelanjutan — sistem terbaik pun butuh tim yang menguasainya."}
  ],
  "cta": {"label": "Kenali Tim ACTA", "href": "/about"}
}'::jsonb, true),

('home', 'stats', '{
  "stats": []
}'::jsonb, false),

('home', 'final_cta', '{
  "headline": "Have a Project? Let''s Talk.",
  "subheadline": "Konsultasikan kebutuhan sistem AV Anda dengan tim ACTA — gratis, tanpa komitmen.",
  "cta_primary": {"label": "Konsultasi Gratis"},
  "cta_secondary": {"label": "Hubungi Kami", "href": "/contact"}
}'::jsonb, true),

-- ---- about ---------------------------------------------------------
('about', 'story', '{
  "eyebrow": "ABOUT ACTA",
  "headline": "A Technology Partner, Not Just an Installer.",
  "body_md": "ACTA adalah integrator sistem audio visual komersial untuk ruang rapat, auditorium, hall multifungsi, dan gedung komersial di Jakarta & Tangerang. Akar teknis kami di sound engineering dan integrasi sistem — kami merancang, memasang, dan mendukung sistem yang bekerja sebagai satu kesatuan, dari konsultasi hingga serah terima."
}'::jsonb, true),

('about', 'pillars', '{
  "headline": "From Consultation to Handover.",
  "steps": [
    {"no": "01", "title": "Consultation & System Design", "description": "Kami mulai dari kebutuhan dan ruang Anda, bukan dari katalog. Analisis fungsi, akustik, dan anggaran menghasilkan desain sistem yang tepat ukuran — tidak kurang, tidak berlebihan."},
    {"no": "02", "title": "Installation & Integration", "description": "Pemasangan rapi dengan standar engineering: audio, visual, dan kontrol bekerja sebagai satu sistem, bukan kumpulan perangkat terpisah."},
    {"no": "03", "title": "Equipment Supply", "description": "Perangkat kelas profesional dari brand yang kami kenal sampai ke level konfigurasi — dipilih sesuai desain sistem, bukan sekadar yang tersedia."},
    {"no": "04", "title": "Training & Maintenance", "description": "Sistem terbaik pun butuh operator yang percaya diri. Kami melatih tim Anda dan mendampingi dengan dukungan teknis jangka panjang."}
  ]
}'::jsonb, true),

('about', 'team', '{
  "headline": "The ACTA Team",
  "members": [
    {"name": "Aryo", "role": "CEO", "bio": ""},
    {"name": "Kevin", "role": "CTO", "bio": ""},
    {"name": "Owen", "role": "COO", "bio": ""}
  ]
}'::jsonb, true),

('about', 'tech_strip', '{
  "label": "Technology We Work With",
  "logos": [
    {"name": "Absen"},
    {"name": "BenQ"},
    {"name": "Samsung"},
    {"name": "QSC"},
    {"name": "Shure"},
    {"name": "Logitech"},
    {"name": "Crestron"},
    {"name": "BrightSign"}
  ]
}'::jsonb, true),

-- ---- contact -------------------------------------------------------
('contact', 'intro', '{
  "eyebrow": "CONTACT",
  "headline": "Let''s Talk.",
  "subheadline": "Ceritakan kebutuhan sistem AV Anda — tim kami bantu petakan opsi sistem dan anggarannya. Gratis, tanpa komitmen."
}'::jsonb, true),

-- ---- solutions_hub -------------------------------------------------
('solutions_hub', 'intro', '{
  "eyebrow": "SOLUTIONS",
  "headline": "A Solution for Every Space.",
  "subheadline": "Delapan tipe ruang, satu standar perancangan."
}'::jsonb, true),

-- ---- catalog_hub ---------------------------------------------------
('catalog_hub', 'intro', '{
  "eyebrow": "CATALOG — 6 KATEGORI",
  "headline": "Professional Gear, Curated by Need.",
  "subheadline": "Enam kategori perangkat yang kami desain, pasok, dan integrasikan. Minta penawaran sesuai kebutuhan project Anda."
}'::jsonb, true),

-- ---- news_hub ------------------------------------------------------
('news_hub', 'intro', '{
  "eyebrow": "NEWS",
  "headline": "AV Industry News & Trends",
  "subheadline": "Perkembangan teknologi, produk, dan tren audio visual yang relevan untuk pemilik gedung dan fasilitas."
}'::jsonb, true),

-- ---- learn_hub -----------------------------------------------------
('learn_hub', 'intro', '{
  "eyebrow": "LEARN",
  "headline": "Learn with ACTA",
  "subheadline": "Panduan praktis dan edukasi seputar sistem audio visual — dari pemilihan perangkat hingga perancangan ruang."
}'::jsonb, true),

('learn_hub', 'newsletter', '{
  "eyebrow": "SIGNAL — MONTHLY",
  "headline": "AV Insights, Straight to Your Inbox",
  "microcopy": "Kami kirim maksimal 1 email/bulan. Berhenti kapan saja."
}'::jsonb, true)

on conflict (page_key, section_key) do update set
  content    = excluded.content,
  is_enabled = excluded.is_enabled,
  updated_at = now();
-- ═══ 3. article_categories + articles ═══
-- ============================================================
-- Seed: article_categories + articles (News & Learn)
-- Source of truth: docs/07-NEWS-LEARN-SPEC.md (titles/taxonomy),
-- docs/09-DATA-SCHEMA.md 4.13/4.14 (columns). All articles status='draft'.
-- FKs resolved by natural key via subselect; media left NULL (wired at assembly).
-- ============================================================

-- 1) article_categories (news: industry/product-update/event/trend; learn: audio/display/conferencing/acoustics/control)
insert into article_categories (type, name, slug, sort_order) values
  ('news','Industry','industry',1),
  ('news','Product Update','product-update',2),
  ('news','Event','event',3),
  ('news','Trend','trend',4),
  ('learn','Audio','audio',1),
  ('learn','Display','display',2),
  ('learn','Conferencing','conferencing',3),
  ('learn','Acoustics','acoustics',4),
  ('learn','Control','control',5)
on conflict (type, slug) do nothing;

-- 2) articles (>=3 news + >=5 learn), all draft; exactly 1 featured per type
insert into articles
  (type, slug, title, excerpt, body, category_id, level, reading_time, author_id, tags, is_featured, status, published_at, scheduled_at, seo_title, seo_description)
values
  ('news','tren-meeting-room-2026','Tren Meeting Room 2026: Dari "Video Call" ke Collaboration Space yang Terukur','Meeting room bergeser dari sekadar video call ke collaboration space yang terukur. Apa yang berubah untuk keputusan ruang rapat Anda di 2026.',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Ruang rapat tidak lagi cukup hanya bisa melakukan video call. Organisasi kini menuntut collaboration space yang terukur, konsisten, dan mudah dipakai siapa saja tanpa bantuan tim IT."}]},{"type":"paragraph","content":[{"type":"text","text":"Pergeseran ini menyentuh tiga hal: kualitas audio yang merata di seluruh meja, kamera yang mengikuti pembicara, dan kontrol yang sederhana. Ketiganya harus dirancang sebagai satu sistem, bukan komponen terpisah."}]},{"type":"paragraph","content":[{"type":"text","text":"Untuk decision maker, pertanyaannya bukan lagi merek mana yang dipakai, melainkan pengalaman apa yang ingin dijamin di setiap ruang. Standar itulah yang menjadi acuan desain di 2026."}]}]}'::jsonb,
   (select id from article_categories where type='news' and slug='trend'), null, 3, (select id from authors where name='Aryo'), ARRAY['smart-meeting-room','conferencing-collaboration','trend']::text[], true, 'draft', null, null,
   'Tren Meeting Room 2026: Dari "Video Call" ke Collaboration Space yang Terukur | ACTA','Meeting room bergeser dari sekadar video call ke collaboration space yang terukur. Apa yang berubah untuk keputusan ruang rapat Anda di 2026.'),
  ('news','standar-baru-microsoft-teams-rooms','Standar Baru Microsoft Teams Rooms: Apa Artinya untuk Ruang Rapat Anda','Microsoft Teams Rooms menetapkan standar sertifikasi baru. Ini implikasinya untuk pilihan perangkat dan desain ruang rapat Anda.',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Microsoft memperbarui persyaratan sertifikasi Teams Rooms secara berkala. Perubahan ini menentukan perangkat mana yang tetap didukung dan fitur apa yang tersedia di ruang rapat Anda."}]},{"type":"paragraph","content":[{"type":"text","text":"Bagi ruang yang sudah terpasang, penting memeriksa apakah perangkat masih masuk daftar sertifikasi terbaru. Bagi ruang baru, pilih perangkat yang jalur dukungannya jelas agar investasi tidak cepat usang."}]},{"type":"paragraph","content":[{"type":"text","text":"Kesimpulannya, standar yang bergerak menuntut perencanaan yang mempertimbangkan siklus dukungan, bukan sekadar spesifikasi saat pembelian."}]}]}'::jsonb,
   (select id from article_categories where type='news' and slug='product-update'), null, 3, (select id from authors where name='Kevin'), ARRAY['conferencing-collaboration','product-update','logitech','smart-meeting-room']::text[], false, 'draft', null, null,
   'Standar Baru Microsoft Teams Rooms: Apa Artinya untuk Ruang Rapat Anda | ACTA','Microsoft Teams Rooms menetapkan standar sertifikasi baru. Ini implikasinya untuk pilihan perangkat dan desain ruang rapat Anda.'),
  ('news','led-all-in-one-vs-projector-ruang-rapat-besar','LED All-in-One Menggeser Projector di Ruang Rapat Besar — Ini Alasannya','LED all-in-one makin menggeser projector di ruang rapat besar. Kami bahas alasan teknis dan operasional di balik pergeseran ini.',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Di ruang rapat besar, layar LED all-in-one semakin sering dipilih menggantikan projector. Alasannya bukan sekadar tren, melainkan soal keterbacaan dan perawatan."}]},{"type":"paragraph","content":[{"type":"text","text":"LED memberi gambar terang tanpa perlu meredupkan ruangan, tidak ada lampu projector yang harus diganti, dan tampilan tetap konsisten dalam pemakaian panjang. Trade-off utamanya ada di biaya awal dan kebutuhan instalasi."}]},{"type":"paragraph","content":[{"type":"text","text":"Keputusan tetap bergantung pada ukuran ruang, tingkat cahaya, dan anggaran. Namun untuk ruang besar yang dipakai intens, LED kini menjadi pilihan yang makin masuk akal."}]}]}'::jsonb,
   (select id from article_categories where type='news' and slug='industry'), null, 4, (select id from authors where name='Owen'), ARRAY['display','absen','industry','auditorium-performance-hall']::text[], false, 'draft', null, null,
   'LED All-in-One Menggeser Projector di Ruang Rapat Besar — Ini Alasannya | ACTA','LED all-in-one makin menggeser projector di ruang rapat besar. Kami bahas alasan teknis dan operasional di balik pergeseran ini.'),
  ('news','rangkuman-infocomm-asia-5-teknologi-av','Rangkuman InfoComm Asia: 5 Teknologi AV yang Layak Diperhatikan Decision Maker','Lima teknologi AV dari InfoComm Asia yang layak diperhatikan decision maker sebelum merencanakan investasi ruang berikutnya.',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"InfoComm Asia menghadirkan banyak teknologi baru, tetapi tidak semuanya relevan bagi pengambil keputusan bisnis. Kami menyaring lima yang paling layak diperhatikan."}]},{"type":"paragraph","content":[{"type":"text","text":"Tema yang menonjol tahun ini berkisar pada distribusi sinyal berbasis jaringan, layar LED yang makin terjangkau, audio yang lebih pintar, kontrol terpusat, dan integrasi platform meeting."}]},{"type":"paragraph","content":[{"type":"text","text":"Alih-alih mengejar setiap fitur baru, fokuskan perhatian pada teknologi yang menyederhanakan operasi dan memperpanjang umur investasi ruang Anda."}]}]}'::jsonb,
   (select id from article_categories where type='news' and slug='event'), null, 4, (select id from authors where name='Owen'), ARRAY['event','trend','display','audio']::text[], false, 'draft', null, null,
   'Rangkuman InfoComm Asia: 5 Teknologi AV yang Layak Diperhatikan Decision Maker | ACTA','Lima teknologi AV dari InfoComm Asia yang layak diperhatikan decision maker sebelum merencanakan investasi ruang berikutnya.'),
  ('news','av-over-ip-default-gedung-komersial','AV-over-IP Semakin Jadi Default di Gedung Komersial Baru','AV-over-IP makin jadi default di gedung komersial baru. Apa artinya distribusi sinyal berbasis jaringan untuk perencanaan Anda.',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"AV-over-IP memindahkan distribusi audio dan video ke jaringan data standar. Pendekatan ini makin menjadi default pada gedung komersial baru."}]},{"type":"paragraph","content":[{"type":"text","text":"Keunggulannya terletak pada skalabilitas: menambah sumber atau layar cukup lewat jaringan, tanpa menarik kabel khusus untuk setiap titik. Konsekuensinya, desain jaringan menjadi bagian inti dari perencanaan AV."}]},{"type":"paragraph","content":[{"type":"text","text":"Bagi pemilik gedung, ini berarti melibatkan tim jaringan sejak awal dan memastikan infrastruktur siap mendukung kebutuhan AV di masa depan."}]}]}'::jsonb,
   (select id from article_categories where type='news' and slug='trend'), null, 3, (select id from authors where name='Kevin'), ARRAY['infrastructure-networking','control-system','trend','crestron']::text[], false, 'draft', null, null,
   'AV-over-IP Semakin Jadi Default di Gedung Komersial Baru | ACTA','AV-over-IP makin jadi default di gedung komersial baru. Apa artinya distribusi sinyal berbasis jaringan untuk perencanaan Anda.'),
  ('learn','cara-memilih-led-videotron','Cara Memilih LED Videotron: Pixel Pitch, Ukuran, Budget','Panduan memilih LED videotron: memahami pixel pitch, ukuran layar, dan budget agar hasil sesuai jarak pandang dan kebutuhan ruang.',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Memilih LED videotron dimulai dari tiga hal mendasar: pixel pitch, ukuran layar, dan budget. Ketiganya saling terkait dan menentukan seberapa tajam gambar terlihat dari jarak pandang penonton."}]},{"type":"paragraph","content":[{"type":"text","text":"Pixel pitch adalah jarak antar titik LED; makin kecil angkanya, makin halus gambar dari dekat, tetapi makin tinggi biayanya. Ukuran layar sebaiknya mengikuti jarak pandang terjauh dan konten yang ditampilkan."}]},{"type":"paragraph","content":[{"type":"text","text":"Sebelum memutuskan, tanyakan kepada integrator soal jarak pandang minimum, kebutuhan kecerahan sesuai lokasi, dan rencana perawatan modul. Jawaban itu lebih penting daripada sekadar mengejar angka pixel pitch terkecil."}]}]}'::jsonb,
   (select id from article_categories where type='learn' and slug='display'), 'dasar', 7, (select id from authors where name='Kevin'), ARRAY['display','absen','digital-signage']::text[], true, 'draft', null, null,
   'Cara Memilih LED Videotron: Pixel Pitch, Ukuran, Budget | ACTA','Panduan memilih LED videotron: memahami pixel pitch, ukuran layar, dan budget agar hasil sesuai jarak pandang dan kebutuhan ruang.'),
  ('learn','sound-system-gedung-komersial-bgm-paging-emergency','Sound System Gedung Komersial: Beda BGM, Paging, dan Emergency','Sound system gedung komersial melayani BGM, paging, dan emergency. Pahami perbedaan fungsinya sebelum menentukan sistem yang tepat.',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Sound system gedung komersial biasanya melayani tiga fungsi berbeda: background music, paging atau pengumuman, dan notifikasi darurat. Ketiganya punya prioritas dan aturan yang tidak sama."}]},{"type":"paragraph","content":[{"type":"text","text":"BGM mengutamakan kenyamanan dan pemerataan suara, paging mengutamakan kejelasan kata, sedangkan emergency mengikuti aturan keselamatan yang ketat dan harus tetap berfungsi saat sistem lain gagal."}]},{"type":"paragraph","content":[{"type":"text","text":"Saat merencanakan, tanyakan bagaimana ketiga fungsi ini diprioritaskan dalam satu sistem. Pemisahan zona dan prioritas sinyal sering kali lebih menentukan daripada sekadar jumlah speaker."}]}]}'::jsonb,
   (select id from article_categories where type='learn' and slug='audio'), 'dasar', 6, (select id from authors where name='Owen'), ARRAY['audio','qsc','pa-commercial-sound-system']::text[], false, 'draft', null, null,
   'Sound System Gedung Komersial: Beda BGM, Paging, dan Emergency | ACTA','Sound system gedung komersial melayani BGM, paging, dan emergency. Pahami perbedaan fungsinya sebelum menentukan sistem yang tepat.'),
  ('learn','panduan-ruang-rapat-hybrid','Panduan Ruang Rapat Hybrid: Kamera, Microphone, dan Satu Tombol untuk Semua','Panduan ruang rapat hybrid: memilih kamera, microphone, dan kontrol satu tombol agar meeting berjalan mulus tanpa drama teknis.',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Ruang rapat hybrid menyatukan peserta di ruangan dan yang bergabung online. Agar setara, tiga elemen harus bekerja sama: kamera, microphone, dan kontrol yang sederhana."}]},{"type":"paragraph","content":[{"type":"text","text":"Kamera perlu menangkap wajah pembicara dengan jelas, microphone harus menjangkau seluruh meja tanpa gema, dan seluruh sistem idealnya bisa dijalankan dengan satu tombol mulai rapat."}]},{"type":"paragraph","content":[{"type":"text","text":"Sebelum membeli, uji skenario nyata: berapa peserta, seberapa besar ruang, dan platform apa yang dipakai. Satu tombol untuk semua hanya berhasil bila perangkat dirancang sebagai satu kesatuan."}]}]}'::jsonb,
   (select id from article_categories where type='learn' and slug='conferencing'), 'dasar', 7, (select id from authors where name='Kevin'), ARRAY['conferencing-collaboration','logitech','smart-meeting-room']::text[], false, 'draft', null, null,
   'Panduan Ruang Rapat Hybrid: Kamera, Microphone, dan Satu Tombol untuk Semua | ACTA','Panduan ruang rapat hybrid: memilih kamera, microphone, dan kontrol satu tombol agar meeting berjalan mulus tanpa drama teknis.'),
  ('learn','rt60-akustik-ruang-bergema','RT60 dan Kenapa Ruangan Anda Terdengar "Bergema": Dasar Akustik Ruang','Apa itu RT60 dan kenapa ruangan terdengar bergema. Dasar akustik ruang yang perlu Anda pahami sebelum menambah panel penyerap.',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"RT60 adalah waktu yang dibutuhkan suara untuk meluruh 60 desibel setelah sumbernya berhenti. Angka ini menjelaskan kenapa sebuah ruangan terdengar bergema atau justru terasa mati."}]},{"type":"paragraph","content":[{"type":"text","text":"RT60 yang terlalu panjang membuat kata demi kata bertumpuk dan sulit dipahami, terutama di ruang dengan banyak permukaan keras seperti kaca dan beton. Menambahkan material penyerap membantu memendekkannya ke rentang yang nyaman."}]},{"type":"paragraph","content":[{"type":"text","text":"Sebelum menambah panel akustik, ukur kondisi ruang dan tentukan target RT60 sesuai fungsinya. Ruang rapat, kelas, dan auditorium punya target yang berbeda."}]}]}'::jsonb,
   (select id from article_categories where type='learn' and slug='acoustics'), 'menengah', 8, (select id from authors where name='Kevin'), ARRAY['acoustics','audio','auditorium-performance-hall']::text[], false, 'draft', null, null,
   'RT60 dan Kenapa Ruangan Anda Terdengar "Bergema": Dasar Akustik Ruang | ACTA','Apa itu RT60 dan kenapa ruangan terdengar bergema. Dasar akustik ruang yang perlu Anda pahami sebelum menambah panel penyerap.'),
  ('learn','room-control-101','Room Control 101: Kenapa Sistem AV Butuh "Otak", Bukan Sekadar Remote','Kenapa sistem AV butuh otak, bukan sekadar remote. Pengantar room control dan peran control system dalam pengalaman ruang.',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Sistem AV yang kompleks butuh otak untuk mengatur semua perangkat, bukan sekadar tumpukan remote. Peran itu dipegang control system yang menyatukan layar, audio, kamera, dan lampu dalam satu alur."}]},{"type":"paragraph","content":[{"type":"text","text":"Dengan control system, satu tombol bisa menyalakan ruangan, memilih sumber, dan mengatur volume sekaligus. Pengguna tidak perlu tahu perangkat apa yang bekerja di belakang layar."}]},{"type":"paragraph","content":[{"type":"text","text":"Room control paling terasa manfaatnya di ruang yang sering dipakai orang berbeda. Investasi pada kontrol yang sederhana sering kali menentukan apakah sistem AV benar-benar dipakai atau justru dihindari."}]}]}'::jsonb,
   (select id from article_categories where type='learn' and slug='control'), 'menengah', 6, (select id from authors where name='Aryo'), ARRAY['control-system','crestron','smart-meeting-room']::text[], false, 'draft', null, null,
   'Room Control 101: Kenapa Sistem AV Butuh "Otak", Bukan Sekadar Remote | ACTA','Kenapa sistem AV butuh otak, bukan sekadar remote. Pengantar room control dan peran control system dalam pengalaman ruang.')
on conflict (type, lower(slug)) do nothing;
-- ═══ 4. solutions + solution_sections ═══
-- ============================================================
-- SEED: solutions (8) + solution_sections (20)
-- Source of truth: 05-SOLUTIONS-SPEC.md (§1, §3, §4, §5) + 03-SITE-ARCHITECTURE.md §2.1
-- DDL: 09-DATA-SCHEMA.md §4.11 / §4.12
-- FK pattern: solution_id resolved by slug subselect. All *_media_id left NULL.
-- tier order: core first (sort_order 0..4), supporting (5..7). status='published' for all.
-- ============================================================

-- ---------- 8 solutions ----------
insert into solutions
  (slug, name, tier, value_prop, hero_headline, hero_subcopy,
   hero_annotations, signal_chain, related_category_slugs, tags,
   wa_message, seo_title, seo_description, sort_order, status)
values
-- 1. CORE — Smart Meeting Room (full)
('smart-meeting-room', 'Smart Meeting Room', 'core',
 'Ruang rapat hybrid yang siap pakai dalam satu sentuhan — audio, video, dan kontrol terintegrasi penuh.',
 'Rapat dimulai saat orang masuk. Bukan lima belas menit setelahnya.',
 'Kami mengintegrasikan kamera, audio, display, dan kontrol ruangan menjadi satu sistem yang dioperasikan siapa pun — satu sentuhan, semua tersambung.',
 '[{"label":"ONE-TOUCH JOIN"},{"label":"PICKUP 4.5M"},{"label":"CERT: TEAMS/ZOOM/MEET"}]'::jsonb,
 '[{"label":"Video Bar & Camera","sublabel":"AI AUTO-FRAMING"},{"label":"Audio DSP","sublabel":"ECHO CANCEL","annotation":"DANTE/USB"},{"label":"Display 4K","sublabel":"IFP / DUAL SCREEN"},{"label":"Room Control","sublabel":"TOUCH PANEL"},{"label":"Network & Monitoring","sublabel":"MANAGED","annotation":"AV-OVER-IP"}]'::jsonb,
 array['conferencing-collaboration','display','control-system'],
 array['meeting-room','video-conference','hybrid-work'],
 'Halo ACTA, saya ingin konsultasi Smart Meeting Room untuk kantor kami.',
 'Instalasi Smart Meeting Room — Integrasi Audio Video & Kontrol | ACTA',
 'Ruang rapat hybrid yang siap dipakai dalam satu sentuhan. ACTA merancang, memasang, dan merawat sistem meeting room terintegrasi untuk korporat.',
 0, 'published'),

-- 2. CORE — Auditorium & Performance Hall
('auditorium-performance-hall', 'Auditorium & Performance Hall', 'core',
 'Sistem audio visual auditorium yang dirancang dari akustik ruangan, bukan dari daftar perangkat.',
 null, null,
 '[{"label":"RT60 0.9S"},{"label":"SPL 102DB"},{"label":"P3.9 LED"},{"label":"THROW 0.81:1"}]'::jsonb,
 '[]'::jsonb,
 array['audio','display','control-system'],
 array['auditorium','performance-hall','acoustics'],
 'Halo ACTA, saya ingin konsultasi Auditorium & Performance Hall untuk gedung kami.',
 'Sistem Audio Auditorium & Performance Hall — Desain Akustik | ACTA',
 'Sistem audio visual auditorium yang dirancang dari akustik ruangan. ACTA merancang, memasang, dan merawat sistem untuk auditorium dan gedung serbaguna.',
 1, 'published'),

-- 3. CORE — Divisible Room / Multipurpose Hall (full)
('divisible-room-multipurpose-hall', 'Divisible Room / Multipurpose Hall', 'core',
 'Satu ballroom, banyak acara paralel — routing audio per zona yang mengikuti sekat, tanpa teknisi tambahan.',
 'Tiga acara berjalan bersamaan. Tidak ada yang mendengar acara sebelah.',
 'Sistem audio per zona yang memahami konfigurasi sekat ballroom Anda — digabung jadi satu sistem besar, dipisah jadi tiga sistem mandiri, dari panel yang sama.',
 '[{"label":"ZONE A/B/C"},{"label":"DSP MATRIX 16×16"},{"label":"PARTITION-AWARE"}]'::jsonb,
 '[{"label":"Input per Zona","sublabel":"WIRELESS MIC / PLAYBACK"},{"label":"DSP Matrix","sublabel":"PARTITION LOGIC","annotation":"16×16"},{"label":"Amplifier Zona","sublabel":"100V / LOW-Z"},{"label":"Speaker per Zona","sublabel":"CEILING + FOH"},{"label":"Wall Control","sublabel":"PER-ZONA PRESET"}]'::jsonb,
 array['audio','control-system','infrastructure-networking'],
 array['ballroom','hospitality','function-hall'],
 'Halo ACTA, saya ingin konsultasi sistem audio divisible room / ballroom untuk venue kami.',
 'Sistem Audio Ballroom & Divisible Room — Routing per Zona | ACTA',
 'Satu ballroom, banyak acara paralel. Sistem audio zona untuk hotel dan function hall yang mengikuti konfigurasi sekat — tanpa teknisi tambahan.',
 2, 'published'),

-- 4. CORE — PA & Commercial Sound System
('pa-commercial-sound-system', 'PA & Commercial Sound System', 'core',
 'BGM, paging, dan emergency announcement satu backbone untuk seluruh gedung komersial.',
 null, null,
 '[{"label":"100V LINE"},{"label":"ZONA PAGING 12"},{"label":"BGM 24/7"}]'::jsonb,
 '[]'::jsonb,
 array['audio','infrastructure-networking','control-system'],
 array['public-address','paging','commercial-audio'],
 'Halo ACTA, saya ingin konsultasi PA & Commercial Sound System untuk gedung kami.',
 'Instalasi PA & Commercial Sound System — Paging & BGM | ACTA',
 'BGM, paging, dan emergency announcement dalam satu backbone untuk seluruh gedung komersial. Dirancang, dipasang, dan dirawat oleh satu integrator.',
 3, 'published'),

-- 5. CORE — Smart Classroom & Training Room
('smart-classroom-training-room', 'Smart Classroom & Training Room', 'core',
 'Ruang belajar interaktif yang membuat materi sampai ke setiap kursi — onsite maupun remote.',
 null, null,
 '[{"label":"4K TOUCH 65\""},{"label":"4 WRITERS"},{"label":"FULL-ROOM AUDIO"}]'::jsonb,
 '[]'::jsonb,
 array['display','conferencing-collaboration','audio'],
 array['smart-classroom','education','interactive-display'],
 'Halo ACTA, saya ingin konsultasi Smart Classroom & Training Room untuk institusi kami.',
 'Instalasi Smart Classroom & Training Room | ACTA',
 'Ruang belajar interaktif yang membuat materi sampai ke setiap kursi — onsite maupun remote. ACTA merancang, memasang, dan merawat sistem ruang belajar.',
 4, 'published'),

-- 6. SUPPORTING — House of Worship AV
('house-of-worship', 'House of Worship AV', 'supporting',
 'Sistem audio visual yang melayani jemaat — jernih di setiap bangku, sederhana bagi tim pelayanan.',
 null, null,
 '[{"label":"COVERAGE MERATA"},{"label":"48KHZ/24-BIT"},{"label":"LED P3.9"}]'::jsonb,
 '[]'::jsonb,
 array['audio','display','control-system'],
 array['house-of-worship','worship','acoustics'],
 'Halo ACTA, saya ingin konsultasi sistem audio visual untuk rumah ibadah kami.',
 'Sistem Audio Visual Rumah Ibadah — Sound & LED | ACTA',
 'Sistem audio visual yang melayani jemaat — jernih di setiap bangku, sederhana bagi tim pelayanan. Dirancang, dipasang, dan dirawat oleh ACTA.',
 5, 'published'),

-- 7. SUPPORTING — Broadcast & Podcast Studio
('broadcast-podcast-studio', 'Broadcast & Podcast Studio', 'supporting',
 'Studio siap rekam dan siap live — signal chain broadcast-grade dari mic sampai stream.',
 null, null,
 '[{"label":"-60DB NOISE FLOOR"},{"label":"MULTITRACK 48KHZ"},{"label":"LIVE ENCODE"}]'::jsonb,
 '[]'::jsonb,
 array['audio','infrastructure-networking','control-system'],
 array['broadcast','podcast','live-streaming'],
 'Halo ACTA, saya ingin konsultasi Broadcast & Podcast Studio untuk tim kami.',
 'Pembuatan Studio Broadcast & Podcast Profesional | ACTA',
 'Studio siap rekam dan siap live — signal chain broadcast-grade dari mic sampai stream. Dirancang, dipasang, dan dirawat oleh satu integrator.',
 6, 'published'),

-- 8. SUPPORTING — Sports & Entertainment Venue
('sports-entertainment-venue', 'Sports & Entertainment Venue', 'supporting',
 'Audio dan videotron venue yang tetap terdengar dan terbaca saat ribuan orang bersorak.',
 null, null,
 '[{"label":"SPL 105DB @FOH"},{"label":"VIEWING 120°"},{"label":"IP-RATED"}]'::jsonb,
 '[]'::jsonb,
 array['audio','digital-signage','display'],
 array['sports-venue','videotron','stadium'],
 'Halo ACTA, saya ingin konsultasi Sports & Entertainment Venue untuk venue kami.',
 'Videotron & Sound System Sports & Entertainment Venue | ACTA',
 'Audio dan videotron venue yang tetap terdengar dan terbaca saat ribuan orang bersorak. Dirancang, dipasang, dan dirawat oleh ACTA.',
 7, 'published');


-- ---------- solution_sections ----------

-- === Smart Meeting Room (full: pain_points, system_copy, scope_pillar, cta) ===
insert into solution_sections (solution_id, type, heading, body, items, sort_order) values
((select id from solutions where slug='smart-meeting-room'), 'pain_points',
 'Tantangan yang kami selesaikan', null,
 '[{"title":"Waktu rapat habis untuk setup.","body":"Sepuluh menit pertama setiap rapat hilang untuk mencolok kabel, mencari input, dan menelepon tim IT. Dikalikan seluruh ruang rapat dan setahun operasional, ini biaya produktivitas yang nyata."},{"title":"Peserta remote jadi peserta kelas dua.","body":"Suara menggema, wajah tak terlihat, materi tak terbaca — keputusan penting diambil tanpa partisipasi penuh dari yang bergabung jarak jauh."},{"title":"Setiap ruang beda cara pakainya.","body":"Ruang A pakai remote, ruang B pakai laptop khusus, ruang C hanya bisa dioperasikan satu orang GA. Tidak ada standar, tidak ada skala."},{"title":"IT tidak punya visibilitas.","body":"Perangkat AV tersebar tanpa monitoring — masalah baru ketahuan saat rapat direksi sudah dimulai."}]'::jsonb,
 0),
((select id from solutions where slug='smart-meeting-room'), 'system_copy',
 'Sistem yang kami rancang',
 'Kami mulai dari bagaimana tim Anda rapat — jumlah peserta, platform conference, kebiasaan presentasi — lalu merancang sistem di sekitarnya. Kamera dengan auto-framing memastikan semua peserta terlihat; DSP audio menjaga suara tetap natural di dua arah; display dan sumber sinyal dirutekan otomatis; dan satu touch panel menjadi antarmuka tunggal untuk seluruh ruangan. Semua perangkat berdiri di jaringan yang bisa dimonitor tim IT Anda — karena sistem meeting room adalah infrastruktur IT, bukan sekadar elektronik ruangan.',
 '[]'::jsonb,
 1),
((select id from solutions where slug='smart-meeting-room'), 'scope_pillar',
 'Scope of Work', null,
 '[{"title":"Consultation & Design","description":"Audit ruang & jaringan, rekomendasi platform (Teams/Zoom/Meet), system design dan skema kabel per ruang."},{"title":"Installation & Integration","description":"Instalasi rapi (cable management tersembunyi), programming touch panel, integrasi kalender ruang, commissioning dengan skenario rapat nyata."},{"title":"Supply","description":"Pengadaan video bar, IFP/display, DSP, dan control panel sesuai desain — satu vendor, satu tanggung jawab."},{"title":"Training & Maintenance","description":"Pelatihan singkat untuk semua karyawan (bukan hanya IT), dokumentasi as-built, SLA maintenance & remote support."}]'::jsonb,
 2),
((select id from solutions where slug='smart-meeting-room'), 'cta',
 'Standarkan seluruh ruang rapat Anda — mulai dari satu ruang percontohan.', null,
 '[{"label":"Konsultasi via WhatsApp"},{"label":"Kirim Kebutuhan via Form","href":"/contact?solution=smart-meeting-room"}]'::jsonb,
 3);

-- === Divisible Room / Multipurpose Hall (full) ===
insert into solution_sections (solution_id, type, heading, body, items, sort_order) values
((select id from solutions where slug='divisible-room-multipurpose-hall'), 'pain_points',
 'Tantangan yang kami selesaikan', null,
 '[{"title":"Audio bocor antar zona.","body":"Wedding di Zona A terdengar sampai seminar di Zona B — dua klien komplain di hari yang sama, dan yang dipertaruhkan adalah reputasi venue."},{"title":"Re-konfigurasi bergantung satu orang teknisi.","body":"Setiap kali sekat dipindah, routing audio harus di-patch ulang manual. Kalau teknisinya tidak masuk, acara tertunda."},{"title":"Investasi perangkat berlipat.","body":"Tanpa sistem zona terpusat, setiap konfigurasi ruang menuntut set perangkat sendiri-sendiri — mixer portabel di sana-sini, kabel melintang di jalur tamu."},{"title":"Tim banquet bukan tim engineering.","body":"Sistem yang hanya bisa dioperasikan orang teknis akan selalu jadi bottleneck operasional venue."}]'::jsonb,
 0),
((select id from solutions where slug='divisible-room-multipurpose-hall'), 'system_copy',
 'Sistem yang kami rancang',
 'Inti sistemnya adalah DSP matrix dengan logika partisi: saat sekat ditutup, Zona A, B, dan C menjadi tiga sistem audio independen — mic, playback, dan volume masing-masing. Saat sekat dibuka, satu preset menggabungkan semuanya menjadi satu ruang besar dengan coverage merata. Tim banquet cukup memilih konfigurasi di wall panel; routing, delay, dan level diatur otomatis di belakang layar. Tidak ada patch manual, tidak ada mixer darurat di pojok ruangan.',
 '[]'::jsonb,
 1),
((select id from solutions where slug='divisible-room-multipurpose-hall'), 'scope_pillar',
 'Scope of Work', null,
 '[{"title":"Consultation & Design","description":"Pemetaan konfigurasi sekat & skenario acara, kalkulasi coverage speaker per zona, desain preset (gabung/pisah) bersama tim banquet."},{"title":"Installation & Integration","description":"Instalasi speaker & kabel tersembunyi di atas plafon (koordinasi dengan interior/ME), programming DSP & wall panel, commissioning per skenario sekat."},{"title":"Supply","description":"Pengadaan DSP, amplifier, speaker, dan wireless system dalam satu paket terintegrasi."},{"title":"Training & Maintenance","description":"Pelatihan tim banquet & FO (operasional harian tanpa teknisi), SOP per konfigurasi, jadwal maintenance berkala pra-peak-season."}]'::jsonb,
 2),
((select id from solutions where slug='divisible-room-multipurpose-hall'), 'cta',
 'Ceritakan konfigurasi ballroom Anda — kami rancang sistem zonanya.', null,
 '[{"label":"Konsultasi via WhatsApp"},{"label":"Kirim Kebutuhan via Form","href":"/contact?solution=divisible-room-multipurpose-hall"}]'::jsonb,
 3);

-- === Auditorium & Performance Hall (scope_pillar + cta) ===
insert into solution_sections (solution_id, type, heading, body, items, sort_order) values
((select id from solutions where slug='auditorium-performance-hall'), 'scope_pillar',
 'Scope of Work', null,
 '[{"title":"Consultation & Design","description":"Site survey, analisis kebutuhan akustik ruang, system design & drawing."},{"title":"Installation & Integration","description":"Instalasi, programming, commissioning, dan testing sesuai desain sistem."},{"title":"Supply","description":"Pengadaan perangkat sesuai spesifikasi desain."},{"title":"Training & Maintenance","description":"Pelatihan operator, dokumentasi as-built, aftersales & maintenance."}]'::jsonb,
 0),
((select id from solutions where slug='auditorium-performance-hall'), 'cta',
 'Ceritakan kebutuhan auditorium Anda — kami rancang sistemnya dari akustik ruang.', null,
 '[{"label":"Konsultasi via WhatsApp"},{"label":"Kirim Kebutuhan via Form","href":"/contact?solution=auditorium-performance-hall"}]'::jsonb,
 1);

-- === PA & Commercial Sound System (scope_pillar + cta) ===
insert into solution_sections (solution_id, type, heading, body, items, sort_order) values
((select id from solutions where slug='pa-commercial-sound-system'), 'scope_pillar',
 'Scope of Work', null,
 '[{"title":"Consultation & Design","description":"Site survey, analisis kebutuhan zona paging & BGM, system design & drawing."},{"title":"Installation & Integration","description":"Instalasi, programming, commissioning, dan testing sesuai desain sistem."},{"title":"Supply","description":"Pengadaan perangkat sesuai spesifikasi desain."},{"title":"Training & Maintenance","description":"Pelatihan operator, dokumentasi as-built, aftersales & maintenance."}]'::jsonb,
 0),
((select id from solutions where slug='pa-commercial-sound-system'), 'cta',
 'Ceritakan gedung Anda — kami rancang satu backbone untuk BGM, paging, dan emergency.', null,
 '[{"label":"Konsultasi via WhatsApp"},{"label":"Kirim Kebutuhan via Form","href":"/contact?solution=pa-commercial-sound-system"}]'::jsonb,
 1);

-- === Smart Classroom & Training Room (scope_pillar + cta) ===
insert into solution_sections (solution_id, type, heading, body, items, sort_order) values
((select id from solutions where slug='smart-classroom-training-room'), 'scope_pillar',
 'Scope of Work', null,
 '[{"title":"Consultation & Design","description":"Site survey, analisis kebutuhan ruang belajar, system design & drawing."},{"title":"Installation & Integration","description":"Instalasi, programming, commissioning, dan testing sesuai desain sistem."},{"title":"Supply","description":"Pengadaan perangkat sesuai spesifikasi desain."},{"title":"Training & Maintenance","description":"Pelatihan operator, dokumentasi as-built, aftersales & maintenance."}]'::jsonb,
 0),
((select id from solutions where slug='smart-classroom-training-room'), 'cta',
 'Ceritakan kebutuhan ruang belajar Anda — kami rancang sistemnya.', null,
 '[{"label":"Konsultasi via WhatsApp"},{"label":"Kirim Kebutuhan via Form","href":"/contact?solution=smart-classroom-training-room"}]'::jsonb,
 1);

-- === House of Worship AV (scope_pillar + cta; tone: service-oriented) ===
insert into solution_sections (solution_id, type, heading, body, items, sort_order) values
((select id from solutions where slug='house-of-worship'), 'scope_pillar',
 'Scope of Work', null,
 '[{"title":"Consultation & Design","description":"Site survey, analisis kebutuhan tim pelayanan, system design & drawing."},{"title":"Installation & Integration","description":"Instalasi, programming, commissioning, dan testing sesuai desain sistem."},{"title":"Supply","description":"Pengadaan perangkat sesuai spesifikasi desain."},{"title":"Training & Maintenance","description":"Pelatihan tim pelayanan, dokumentasi as-built, aftersales & maintenance."}]'::jsonb,
 0),
((select id from solutions where slug='house-of-worship'), 'cta',
 'Ceritakan kebutuhan pelayanan Anda — kami bantu rancang sistem yang melayani jemaat.', null,
 '[{"label":"Konsultasi via WhatsApp"},{"label":"Kirim Kebutuhan via Form","href":"/contact?solution=house-of-worship"}]'::jsonb,
 1);

-- === Broadcast & Podcast Studio (scope_pillar + cta) ===
insert into solution_sections (solution_id, type, heading, body, items, sort_order) values
((select id from solutions where slug='broadcast-podcast-studio'), 'scope_pillar',
 'Scope of Work', null,
 '[{"title":"Consultation & Design","description":"Site survey, analisis kebutuhan studio, system design & drawing."},{"title":"Installation & Integration","description":"Instalasi, programming, commissioning, dan testing sesuai desain sistem."},{"title":"Supply","description":"Pengadaan perangkat sesuai spesifikasi desain."},{"title":"Training & Maintenance","description":"Pelatihan operator, dokumentasi as-built, aftersales & maintenance."}]'::jsonb,
 0),
((select id from solutions where slug='broadcast-podcast-studio'), 'cta',
 'Ceritakan kebutuhan studio Anda — kami rancang signal chain-nya dari mic sampai stream.', null,
 '[{"label":"Konsultasi via WhatsApp"},{"label":"Kirim Kebutuhan via Form","href":"/contact?solution=broadcast-podcast-studio"}]'::jsonb,
 1);

-- === Sports & Entertainment Venue (scope_pillar + cta) ===
insert into solution_sections (solution_id, type, heading, body, items, sort_order) values
((select id from solutions where slug='sports-entertainment-venue'), 'scope_pillar',
 'Scope of Work', null,
 '[{"title":"Consultation & Design","description":"Site survey, analisis kebutuhan venue, system design & drawing."},{"title":"Installation & Integration","description":"Instalasi, programming, commissioning, dan testing sesuai desain sistem."},{"title":"Supply","description":"Pengadaan perangkat sesuai spesifikasi desain."},{"title":"Training & Maintenance","description":"Pelatihan operator, dokumentasi as-built, aftersales & maintenance."}]'::jsonb,
 0),
((select id from solutions where slug='sports-entertainment-venue'), 'cta',
 'Ceritakan venue Anda — kami rancang audio dan videotron-nya.', null,
 '[{"label":"Konsultasi via WhatsApp"},{"label":"Kirim Kebutuhan via Form","href":"/contact?solution=sports-entertainment-venue"}]'::jsonb,
 1);
-- ═══ 5. spec_definitions + products + spec values + relations ═══
-- ============================================================================
-- SEED: Catalog domain (06-CATALOG-SPEC.md §5) — spec_definitions, products,
--       product_spec_values, product_solutions
-- FK resolution: natural-key subselects (no hardcoded UUIDs).
-- All *_media_id / images wired separately in assembly.
-- ============================================================================
begin;

-- ----------------------------------------------------------------------------
-- 1) spec_definitions (per category). is_filterable=true covers every 06 §1.2
--    filter key. better_direction only on data_type='number'. enum_options
--    REQUIRED on data_type='enum'.
-- ----------------------------------------------------------------------------

-- 1a) AUDIO -------------------------------------------------------------------
insert into spec_definitions
  (category_id, key, label, spec_group, data_type, unit, enum_options, sort_order, is_filterable, is_comparable, better_direction, is_archived)
values
  ((select id from product_categories where slug='audio'), 'power_w',      'Power (Class-D)',   'Audio', 'number',  'W',    null,                                          1, true,  true,  'higher', false),
  ((select id from product_categories where slug='audio'), 'max_spl',      'Max SPL',           'Audio', 'number',  'dB',   null,                                          2, true,  true,  'higher', false),
  ((select id from product_categories where slug='audio'), 'driver_size',  'Ukuran Driver Utama','Audio','number',  'inch', null,                                          3, true,  true,  null,     false),
  ((select id from product_categories where slug='audio'), 'wireless',     'Wireless System',   'Fitur', 'boolean', null,   null,                                          4, true,  true,  null,     false),
  ((select id from product_categories where slug='audio'), 'freq_response','Frequency Response','Audio', 'text',    null,   null,                                          5, false, true,  null,     false),
  ((select id from product_categories where slug='audio'), 'driver_lf',    'LF Driver',         'Audio', 'text',    null,   null,                                          6, false, true,  null,     false),
  ((select id from product_categories where slug='audio'), 'driver_hf',    'HF Driver',         'Audio', 'text',    null,   null,                                          7, false, true,  null,     false),
  ((select id from product_categories where slug='audio'), 'dsp_onboard',  'Onboard DSP',       'Fitur', 'boolean', null,   null,                                          8, false, true,  null,     false),
  ((select id from product_categories where slug='audio'), 'dsp_presets',  'Preset EQ',         'Fitur', 'text',    null,   null,                                          9, false, false, null,     false),
  ((select id from product_categories where slug='audio'), 'encryption',   'Enkripsi Audio',    'Fitur', 'enum',    null,   ARRAY['None','AES-128','AES-256'],            10, false, true,  null,     false),
  ((select id from product_categories where slug='audio'), 'audio_format', 'Format Audio Digital','Audio','text',   null,   null,                                         11, false, true,  null,     false);

-- 1b) DISPLAY -----------------------------------------------------------------
insert into spec_definitions
  (category_id, key, label, spec_group, data_type, unit, enum_options, sort_order, is_filterable, is_comparable, better_direction, is_archived)
values
  ((select id from product_categories where slug='display'), 'pixel_pitch',         'Pixel Pitch',      'Optik', 'number',  'mm',     null,                                                         1, true,  true,  'lower',  false),
  ((select id from product_categories where slug='display'), 'brightness',          'Brightness',       'Optik', 'number',  'nit',    null,                                                         2, true,  true,  'higher', false),
  ((select id from product_categories where slug='display'), 'resolution_class',    'Kelas Resolusi',   'Optik', 'enum',    null,     ARRAY['HD','FHD','WUXGA','4K UHD','8K'],                       3, true,  true,  null,     false),
  ((select id from product_categories where slug='display'), 'screen_size',         'Ukuran Layar',     'Fisik', 'number',  'inch',   null,                                                         4, true,  true,  null,     false),
  ((select id from product_categories where slug='display'), 'refresh_rate',        'Refresh Rate',     'Optik', 'number',  'Hz',     null,                                                         5, false, true,  'higher', false),
  ((select id from product_categories where slug='display'), 'viewing_angle',       'Viewing Angle',    'Optik', 'text',    null,     null,                                                         6, false, true,  null,     false),
  ((select id from product_categories where slug='display'), 'panel_size',          'Ukuran Panel',     'Fisik', 'text',    'mm',     null,                                                         7, false, true,  null,     false),
  ((select id from product_categories where slug='display'), 'panel_weight',        'Berat per Panel',  'Fisik', 'number',  'kg',     null,                                                         8, false, true,  'lower',  false),
  ((select id from product_categories where slug='display'), 'display_tech',        'Teknologi',        'Optik', 'text',    null,     null,                                                         9, false, false, null,     false),
  ((select id from product_categories where slug='display'), 'luminance_ansi',      'Kecerahan (ANSI)', 'Optik', 'number',  'lumens', null,                                                        10, false, true,  'higher', false),
  ((select id from product_categories where slug='display'), 'throw_type',          'Tipe Throw',       'Optik', 'enum',    null,     ARRAY['Standard','Short Throw','Ultra Short Throw','Long Throw'],11, false, true, null,     false),
  ((select id from product_categories where slug='display'), 'light_source',        'Sumber Cahaya',    'Optik', 'enum',    null,     ARRAY['Lamp','Laser','LED'],                                 12, false, true,  null,     false),
  ((select id from product_categories where slug='display'), 'touch_support',       'Dukungan Sentuh',  'Fitur', 'boolean', null,     null,                                                        13, false, true,  null,     false),
  ((select id from product_categories where slug='display'), 'simultaneous_writers','Penulis Simultan', 'Fitur', 'number',  'orang',  null,                                                        14, false, true,  'higher', false);

-- 1c) CONFERENCING & COLLABORATION -------------------------------------------
insert into spec_definitions
  (category_id, key, label, spec_group, data_type, unit, enum_options, sort_order, is_filterable, is_comparable, better_direction, is_archived)
values
  ((select id from product_categories where slug='conferencing-collaboration'), 'certified_platforms','Platform Tersertifikasi','Fitur','enum',   null, ARRAY['Teams','Zoom','Meet'], 1, true,  true, null,     false),
  ((select id from product_categories where slug='conferencing-collaboration'), 'camera_resolution',  'Resolusi Kamera',        'Optik','enum',   null, ARRAY['1080p','4K'],          2, true,  true, null,     false),
  ((select id from product_categories where slug='conferencing-collaboration'), 'mic_pickup_range',   'Jangkauan Mikrofon',     'Audio','number', 'm',  null,                         3, true,  true, 'higher', false),
  ((select id from product_categories where slug='conferencing-collaboration'), 'camera_ptz',         'Kamera PTZ',             'Optik','boolean',null, null,                         4, false, true, null,     false),
  ((select id from product_categories where slug='conferencing-collaboration'), 'ai_framing',         'AI Auto-Framing',        'Fitur','boolean',null, null,                         5, false, true, null,     false);

-- 1d) CONTROL SYSTEM ----------------------------------------------------------
insert into spec_definitions
  (category_id, key, label, spec_group, data_type, unit, enum_options, sort_order, is_filterable, is_comparable, better_direction, is_archived)
values
  ((select id from product_categories where slug='control-system'), 'interface_type','Tipe Interface',         'Fitur',       'enum',    null,   ARRAY['Touch Panel','Keypad','Button Panel'], 1, true,  true, null, false),
  ((select id from product_categories where slug='control-system'), 'poe',           'Power over Ethernet (PoE)','Konektivitas','boolean', null,   null,                                         2, true,  true, null, false),
  ((select id from product_categories where slug='control-system'), 'screen_size',   'Ukuran Layar',           'Fisik',       'number',  'inch', null,                                         3, false, true, null, false),
  ((select id from product_categories where slug='control-system'), 'voip',          'VoIP / SIP',             'Fitur',       'boolean', null,   null,                                         4, false, true, null, false),
  ((select id from product_categories where slug='control-system'), 'wifi',          'Wi-Fi',                  'Konektivitas','boolean', null,   null,                                         5, false, true, null, false);

-- 1e) DIGITAL SIGNAGE ---------------------------------------------------------
insert into spec_definitions
  (category_id, key, label, spec_group, data_type, unit, enum_options, sort_order, is_filterable, is_comparable, better_direction, is_archived)
values
  ((select id from product_categories where slug='digital-signage'), 'max_resolution','Resolusi Maksimum','Optik',       'enum',    null, ARRAY['1080p','4K','8K'],                            1, true,  true, null, false),
  ((select id from product_categories where slug='digital-signage'), 'os',            'Sistem Operasi',   'Fitur',       'enum',    null, ARRAY['BrightSign OS','Android','Tizen','webOS','Linux'],2, true, true, null, false),
  ((select id from product_categories where slug='digital-signage'), 'hdr',           'HDR Support',      'Optik',       'boolean', null, null,                                                3, false, true, null, false),
  ((select id from product_categories where slug='digital-signage'), 'dual_video',    'Dual Video Decode','Fitur',       'boolean', null, null,                                                4, false, true, null, false),
  ((select id from product_categories where slug='digital-signage'), 'storage_type',  'Media Penyimpanan','Konektivitas','enum',    null, ARRAY['microSD','SSD','eMMC'],                       5, false, true, null, false);

-- 1f) INFRASTRUCTURE & NETWORKING --------------------------------------------
insert into spec_definitions
  (category_id, key, label, spec_group, data_type, unit, enum_options, sort_order, is_filterable, is_comparable, better_direction, is_archived)
values
  ((select id from product_categories where slug='infrastructure-networking'), 'video_transport',  'Transport Video','Konektivitas','enum', null, ARRAY['AV-over-IP','HDBaseT','SDI','HDMI'],   1, true,  true, null, false),
  ((select id from product_categories where slug='infrastructure-networking'), 'network_speed',    'Kecepatan Jaringan','Konektivitas','enum',null,ARRAY['1GbE','10GbE'],                       2, true,  true, null, false),
  ((select id from product_categories where slug='infrastructure-networking'), 'security_features','Fitur Keamanan', 'Fitur',       'enum', null, ARRAY['AES-128','AES-256','802.1X','TLS','PKI'],3, true,  true, null, false),
  ((select id from product_categories where slug='infrastructure-networking'), 'video_resolution', 'Resolusi Video', 'Optik',       'text', null, null,                                        4, false, true, null, false),
  ((select id from product_categories where slug='infrastructure-networking'), 'latency',          'Latency',        'Fitur',       'text', null, null,                                        5, false, true, null, false);

-- ----------------------------------------------------------------------------
-- 2) products (9). short_spec <=80 chars. is_featured=true only for the 4
--    canonical. internal_price left NULL. status='published'.
-- ----------------------------------------------------------------------------
insert into products
  (name, slug, brand_id, category_id, short_spec, description_md, suitable_for, spec_source_url, is_featured, status, seo_title, seo_description)
values
  ('Absen A2 Series Indoor LED', 'absen-a2',
   (select id from brands where slug='absen'), (select id from product_categories where slug='display'),
   'Pixel pitch 3.9mm · 1.200 nit',
   'Panel LED indoor seri A2 dari Absen untuk aplikasi videotron fixed-install. Pixel pitch 3.9mm dengan brightness 1.200 nit; cocok untuk ruang rapat besar, lobi, hingga panggung ibadah.',
   'Videotron indoor untuk auditorium, house of worship, dan lobi korporat.',
   'https://www.absen.com/', false, 'published',
   'Absen A2 Series Indoor LED — Absen | Katalog ACTA',
   'Panel LED indoor Absen A2 (pixel pitch 3.9mm, 1.200 nit) untuk videotron fixed-install. Konsultasikan konfigurasi dengan tim engineering ACTA.'),

  ('BenQ LU935ST Laser Projector', 'benq-lu935st',
   (select id from brands where slug='benq'), (select id from product_categories where slug='display'),
   '5.500 ANSI lumens · WUXGA · short throw',
   'Projector laser instalasi BenQ LU935ST dengan 5.500 ANSI lumens, resolusi WUXGA, dan lensa short throw untuk ruang dengan jarak proyeksi terbatas.',
   'Ruang kelas, ruang training, dan meeting room dengan jarak proyeksi pendek.',
   'https://www.benq.com/', false, 'published',
   'BenQ LU935ST Laser Projector — BenQ | Katalog ACTA',
   'Projector laser BenQ LU935ST 5.500 ANSI lumens WUXGA short throw untuk ruang kelas dan meeting room. Minta penawaran ke tim ACTA.'),

  ('Samsung Flip 2 65" IFP', 'samsung-flip-2-65',
   (select id from brands where slug='samsung'), (select id from product_categories where slug='display'),
   '4K UHD · 4 penulis simultan',
   'Interactive flat panel Samsung Flip 2 65 inci beresolusi 4K UHD, mendukung hingga 4 penulis simultan untuk kolaborasi papan tulis digital.',
   'Smart meeting room dan ruang kolaborasi yang butuh papan tulis digital interaktif.',
   'https://www.samsung.com/', true, 'published',
   'Samsung Flip 2 65" IFP — Samsung | Katalog ACTA',
   'Interactive flat panel Samsung Flip 2 65" 4K UHD dengan 4 penulis simultan untuk smart meeting room. Konsultasikan dengan ACTA.'),

  ('QSC K12.2 Powered Loudspeaker', 'qsc-k12-2',
   (select id from brands where slug='qsc'), (select id from product_categories where slug='audio'),
   '2000W · Max SPL 132dB',
   'Powered loudspeaker QSC K12.2 dengan power Class-D 2000W dan Max SPL 132dB, dilengkapi DSP onboard serta preset EQ untuk beragam aplikasi live.',
   'PA portabel dan sistem suara auditorium, house of worship, serta event.',
   'https://www.qsc.com/', true, 'published',
   'QSC K12.2 Powered Loudspeaker — QSC | Katalog ACTA',
   'Powered loudspeaker QSC K12.2 (2000W, Max SPL 132dB) dengan DSP onboard untuk auditorium dan PA. Minta penawaran ke tim ACTA.'),

  ('Shure ULX-D Digital Wireless', 'shure-ulx-d',
   (select id from brands where slug='shure'), (select id from product_categories where slug='audio'),
   '24-bit/48kHz · AES-256',
   'Sistem mikrofon wireless digital Shure ULX-D dengan audio 24-bit/48kHz dan enkripsi AES-256 untuk keandalan sinyal dan keamanan audio.',
   'Auditorium, house of worship, dan panggung yang butuh mikrofon wireless andal.',
   'https://www.shure.com/', false, 'published',
   'Shure ULX-D Digital Wireless — Shure | Katalog ACTA',
   'Sistem wireless digital Shure ULX-D 24-bit/48kHz dengan enkripsi AES-256 untuk auditorium dan house of worship. Konsultasikan dengan ACTA.'),

  ('Logitech Rally Bar', 'logitech-rally-bar',
   (select id from brands where slug='logitech'), (select id from product_categories where slug='conferencing-collaboration'),
   'PTZ 4K · Teams/Zoom/Meet certified',
   'Video bar all-in-one Logitech Rally Bar dengan kamera PTZ 4K, tersertifikasi Microsoft Teams, Zoom, dan Google Meet untuk ruang rapat menengah.',
   'Smart meeting room ukuran kecil hingga menengah.',
   'https://www.logitech.com/', true, 'published',
   'Logitech Rally Bar — Logitech | Katalog ACTA',
   'Video bar Logitech Rally Bar kamera PTZ 4K tersertifikasi Teams, Zoom, dan Meet untuk smart meeting room. Minta penawaran ke ACTA.'),

  ('Crestron TSW-770 Touch Panel', 'crestron-tsw-770',
   (select id from brands where slug='crestron'), (select id from product_categories where slug='control-system'),
   '7" HTML5 · Rava SIP · Wi-Fi',
   'Touch panel Crestron TSW-770 layar 7 inci dengan antarmuka HTML5, intercom Rava SIP, serta konektivitas Wi-Fi maupun Ethernet (PoE).',
   'Kontrol ruangan untuk meeting room, auditorium, dan smart building.',
   'https://www.crestron.com/', true, 'published',
   'Crestron TSW-770 Touch Panel — Crestron | Katalog ACTA',
   'Touch panel Crestron TSW-770 7" HTML5 dengan Rava SIP dan Wi-Fi untuk kontrol ruangan. Konsultasikan integrasi dengan tim ACTA.'),

  ('BrightSign XT5 Media Player', 'brightsign-xt5',
   (select id from brands where slug='brightsign'), (select id from product_categories where slug='digital-signage'),
   '4K engine · 24/7 self-healing',
   'Media player digital signage BrightSign XT5 dengan engine 4K, dirancang untuk operasi 24/7 yang andal dan self-healing.',
   'Digital signage retail, lobi korporat, dan menu board 24/7.',
   'https://www.brightsign.biz/', false, 'published',
   'BrightSign XT5 Media Player — BrightSign | Katalog ACTA',
   'Media player digital signage BrightSign XT5 engine 4K untuk operasi 24/7. Minta penawaran ke tim engineering ACTA.'),

  ('Crestron DM-NVX-360 AV-over-IP', 'crestron-dm-nvx-360',
   (select id from brands where slug='crestron'), (select id from product_categories where slug='infrastructure-networking'),
   '4K60 4:4:4 · latency <1 frame',
   'Encoder/decoder AV-over-IP Crestron DM-NVX-360 untuk distribusi video 4K60 4:4:4 melalui jaringan standar dengan latency di bawah 1 frame.',
   'Distribusi AV over IP untuk divisible room, command center, dan kampus.',
   'https://www.crestron.com/', false, 'published',
   'Crestron DM-NVX-360 AV-over-IP — Crestron | Katalog ACTA',
   'Encoder/decoder AV-over-IP Crestron DM-NVX-360 4K60 4:4:4 dengan latency <1 frame untuk divisible room. Konsultasikan dengan ACTA.');

-- ----------------------------------------------------------------------------
-- 3) product_spec_values. value_text ALWAYS set. Typed column per data_type:
--    number->value_number, boolean->value_boolean, enum->value_options.
--    Full sets for qsc-k12-2 (§5.1) and absen-a2 (§5.2); >=3 for the rest.
-- ----------------------------------------------------------------------------

-- 3a) QSC K12.2 (full 8, §5.1) ------------------------------------------------
insert into product_spec_values (product_id, spec_definition_id, value_text, value_number, value_boolean, value_options) values
  ((select id from products where slug='qsc-k12-2'), (select id from spec_definitions where category_id=(select id from product_categories where slug='audio') and key='power_w'),       '2000', 2000, null, null),
  ((select id from products where slug='qsc-k12-2'), (select id from spec_definitions where category_id=(select id from product_categories where slug='audio') and key='max_spl'),       '132',  132,  null, null),
  ((select id from products where slug='qsc-k12-2'), (select id from spec_definitions where category_id=(select id from product_categories where slug='audio') and key='freq_response'), '50Hz–20kHz', null, null, null),
  ((select id from products where slug='qsc-k12-2'), (select id from spec_definitions where category_id=(select id from product_categories where slug='audio') and key='driver_lf'),     '12" woofer', null, null, null),
  ((select id from products where slug='qsc-k12-2'), (select id from spec_definitions where category_id=(select id from product_categories where slug='audio') and key='driver_hf'),     '1.4" titanium compression', null, null, null),
  ((select id from products where slug='qsc-k12-2'), (select id from spec_definitions where category_id=(select id from product_categories where slug='audio') and key='dsp_onboard'),   'Ya',   null, true,  null),
  ((select id from products where slug='qsc-k12-2'), (select id from spec_definitions where category_id=(select id from product_categories where slug='audio') and key='dsp_presets'),   'Live, Dance, Monitor, dst + scene recall', null, null, null),
  ((select id from products where slug='qsc-k12-2'), (select id from spec_definitions where category_id=(select id from product_categories where slug='audio') and key='wireless'),      'Tidak',null, false, null);

-- 3b) Absen A2 (full 7, §5.2) -------------------------------------------------
insert into product_spec_values (product_id, spec_definition_id, value_text, value_number, value_boolean, value_options) values
  ((select id from products where slug='absen-a2'), (select id from spec_definitions where category_id=(select id from product_categories where slug='display') and key='pixel_pitch'),  '3.9',  3.9,  null, null),
  ((select id from products where slug='absen-a2'), (select id from spec_definitions where category_id=(select id from product_categories where slug='display') and key='brightness'),   '1200', 1200, null, null),
  ((select id from products where slug='absen-a2'), (select id from spec_definitions where category_id=(select id from product_categories where slug='display') and key='refresh_rate'), '2000', 2000, null, null),
  ((select id from products where slug='absen-a2'), (select id from spec_definitions where category_id=(select id from product_categories where slug='display') and key='viewing_angle'),'120°/120°', null, null, null),
  ((select id from products where slug='absen-a2'), (select id from spec_definitions where category_id=(select id from product_categories where slug='display') and key='panel_size'),   '500×500', null, null, null),
  ((select id from products where slug='absen-a2'), (select id from spec_definitions where category_id=(select id from product_categories where slug='display') and key='panel_weight'), '10',   10,   null, null),
  ((select id from products where slug='absen-a2'), (select id from spec_definitions where category_id=(select id from product_categories where slug='display') and key='display_tech'), 'Indoor LED (videotron)', null, null, null);

-- 3c) BenQ LU935ST (4) --------------------------------------------------------
insert into product_spec_values (product_id, spec_definition_id, value_text, value_number, value_boolean, value_options) values
  ((select id from products where slug='benq-lu935st'), (select id from spec_definitions where category_id=(select id from product_categories where slug='display') and key='luminance_ansi'),  '5500', 5500, null, null),
  ((select id from products where slug='benq-lu935st'), (select id from spec_definitions where category_id=(select id from product_categories where slug='display') and key='resolution_class'),'WUXGA', null, null, ARRAY['WUXGA']),
  ((select id from products where slug='benq-lu935st'), (select id from spec_definitions where category_id=(select id from product_categories where slug='display') and key='throw_type'),      'Short Throw', null, null, ARRAY['Short Throw']),
  ((select id from products where slug='benq-lu935st'), (select id from spec_definitions where category_id=(select id from product_categories where slug='display') and key='light_source'),    'Laser', null, null, ARRAY['Laser']);

-- 3d) Samsung Flip 2 65" (4) --------------------------------------------------
insert into product_spec_values (product_id, spec_definition_id, value_text, value_number, value_boolean, value_options) values
  ((select id from products where slug='samsung-flip-2-65'), (select id from spec_definitions where category_id=(select id from product_categories where slug='display') and key='resolution_class'),    '4K UHD', null, null, ARRAY['4K UHD']),
  ((select id from products where slug='samsung-flip-2-65'), (select id from spec_definitions where category_id=(select id from product_categories where slug='display') and key='screen_size'),         '65', 65, null, null),
  ((select id from products where slug='samsung-flip-2-65'), (select id from spec_definitions where category_id=(select id from product_categories where slug='display') and key='simultaneous_writers'),'4',  4,  null, null),
  ((select id from products where slug='samsung-flip-2-65'), (select id from spec_definitions where category_id=(select id from product_categories where slug='display') and key='touch_support'),       'Ya', null, true, null);

-- 3e) Shure ULX-D (3) ---------------------------------------------------------
insert into product_spec_values (product_id, spec_definition_id, value_text, value_number, value_boolean, value_options) values
  ((select id from products where slug='shure-ulx-d'), (select id from spec_definitions where category_id=(select id from product_categories where slug='audio') and key='wireless'),     'Ya', null, true, null),
  ((select id from products where slug='shure-ulx-d'), (select id from spec_definitions where category_id=(select id from product_categories where slug='audio') and key='encryption'),   'AES-256', null, null, ARRAY['AES-256']),
  ((select id from products where slug='shure-ulx-d'), (select id from spec_definitions where category_id=(select id from product_categories where slug='audio') and key='audio_format'), '24-bit/48kHz', null, null, null);

-- 3f) Logitech Rally Bar (4) --------------------------------------------------
insert into product_spec_values (product_id, spec_definition_id, value_text, value_number, value_boolean, value_options) values
  ((select id from products where slug='logitech-rally-bar'), (select id from spec_definitions where category_id=(select id from product_categories where slug='conferencing-collaboration') and key='certified_platforms'),'Teams · Zoom · Meet', null, null, ARRAY['Teams','Zoom','Meet']),
  ((select id from products where slug='logitech-rally-bar'), (select id from spec_definitions where category_id=(select id from product_categories where slug='conferencing-collaboration') and key='camera_resolution'),  '4K', null, null, ARRAY['4K']),
  ((select id from products where slug='logitech-rally-bar'), (select id from spec_definitions where category_id=(select id from product_categories where slug='conferencing-collaboration') and key='camera_ptz'),         'Ya', null, true, null),
  ((select id from products where slug='logitech-rally-bar'), (select id from spec_definitions where category_id=(select id from product_categories where slug='conferencing-collaboration') and key='ai_framing'),         'Ya', null, true, null);

-- 3g) Crestron TSW-770 (5) ----------------------------------------------------
insert into product_spec_values (product_id, spec_definition_id, value_text, value_number, value_boolean, value_options) values
  ((select id from products where slug='crestron-tsw-770'), (select id from spec_definitions where category_id=(select id from product_categories where slug='control-system') and key='interface_type'),'Touch Panel', null, null, ARRAY['Touch Panel']),
  ((select id from products where slug='crestron-tsw-770'), (select id from spec_definitions where category_id=(select id from product_categories where slug='control-system') and key='poe'),           'Ya', null, true, null),
  ((select id from products where slug='crestron-tsw-770'), (select id from spec_definitions where category_id=(select id from product_categories where slug='control-system') and key='screen_size'),   '7', 7, null, null),
  ((select id from products where slug='crestron-tsw-770'), (select id from spec_definitions where category_id=(select id from product_categories where slug='control-system') and key='voip'),          'Ya', null, true, null),
  ((select id from products where slug='crestron-tsw-770'), (select id from spec_definitions where category_id=(select id from product_categories where slug='control-system') and key='wifi'),          'Ya', null, true, null);

-- 3h) BrightSign XT5 (4) ------------------------------------------------------
insert into product_spec_values (product_id, spec_definition_id, value_text, value_number, value_boolean, value_options) values
  ((select id from products where slug='brightsign-xt5'), (select id from spec_definitions where category_id=(select id from product_categories where slug='digital-signage') and key='max_resolution'),'4K', null, null, ARRAY['4K']),
  ((select id from products where slug='brightsign-xt5'), (select id from spec_definitions where category_id=(select id from product_categories where slug='digital-signage') and key='os'),            'BrightSign OS', null, null, ARRAY['BrightSign OS']),
  ((select id from products where slug='brightsign-xt5'), (select id from spec_definitions where category_id=(select id from product_categories where slug='digital-signage') and key='dual_video'),    'Ya', null, true, null),
  ((select id from products where slug='brightsign-xt5'), (select id from spec_definitions where category_id=(select id from product_categories where slug='digital-signage') and key='storage_type'),  'microSD', null, null, ARRAY['microSD']);

-- 3i) Crestron DM-NVX-360 (5) -------------------------------------------------
insert into product_spec_values (product_id, spec_definition_id, value_text, value_number, value_boolean, value_options) values
  ((select id from products where slug='crestron-dm-nvx-360'), (select id from spec_definitions where category_id=(select id from product_categories where slug='infrastructure-networking') and key='video_transport'),  'AV-over-IP', null, null, ARRAY['AV-over-IP']),
  ((select id from products where slug='crestron-dm-nvx-360'), (select id from spec_definitions where category_id=(select id from product_categories where slug='infrastructure-networking') and key='network_speed'),    '1GbE', null, null, ARRAY['1GbE']),
  ((select id from products where slug='crestron-dm-nvx-360'), (select id from spec_definitions where category_id=(select id from product_categories where slug='infrastructure-networking') and key='security_features'), 'AES-128 · 802.1X', null, null, ARRAY['AES-128','802.1X']),
  ((select id from products where slug='crestron-dm-nvx-360'), (select id from spec_definitions where category_id=(select id from product_categories where slug='infrastructure-networking') and key='video_resolution'),  '4K60 4:4:4', null, null, null),
  ((select id from products where slug='crestron-dm-nvx-360'), (select id from spec_definitions where category_id=(select id from product_categories where slug='infrastructure-networking') and key='latency'),           '<1 frame', null, null, null);

-- ----------------------------------------------------------------------------
-- 4) product_solutions (06 §5 relations). sort_order = display order.
-- ----------------------------------------------------------------------------
insert into product_solutions (product_id, solution_id, sort_order) values
  ((select id from products where slug='qsc-k12-2'),          (select id from solutions where slug='auditorium-performance-hall'), 0),
  ((select id from products where slug='qsc-k12-2'),          (select id from solutions where slug='pa-commercial-sound-system'),  1),
  ((select id from products where slug='shure-ulx-d'),        (select id from solutions where slug='auditorium-performance-hall'), 0),
  ((select id from products where slug='shure-ulx-d'),        (select id from solutions where slug='pa-commercial-sound-system'),  1),
  ((select id from products where slug='logitech-rally-bar'), (select id from solutions where slug='smart-meeting-room'),          0),
  ((select id from products where slug='samsung-flip-2-65'),  (select id from solutions where slug='smart-meeting-room'),          0),
  ((select id from products where slug='crestron-tsw-770'),   (select id from solutions where slug='smart-meeting-room'),          0),
  ((select id from products where slug='absen-a2'),           (select id from solutions where slug='house-of-worship'),            0);

-- Populate the two 'seed-minimum' filterable numeric specs so their catalog filters have buckets.
insert into product_spec_values (product_id, spec_definition_id, value_text, value_number) values
  ((select id from products where slug='qsc-k12-2'),
   (select id from spec_definitions where category_id=(select id from product_categories where slug='audio') and key='driver_size'),
   '12', 12),
  ((select id from products where slug='logitech-rally-bar'),
   (select id from spec_definitions where category_id=(select id from product_categories where slug='conferencing-collaboration') and key='mic_pickup_range'),
   '4.5', 4.5);

commit;
-- ═══ 6. projects + media wiring ═══
-- ── Projects (§11.9) — client_name_internal & value_idr are INTERNAL ─────────
insert into projects (slug, public_label, client_name_internal, value_idr, year, location_label, scope_description, scope_chips, status, sort_order) values
 ('perusahaan-agribisnis-jakarta','Perusahaan Agribisnis, Jakarta','PT Triputra Agro Persada',609900000,2026,'Jakarta',
   'Integrasi ruang rapat pintar dengan konferensi video dan kontrol ruangan terpusat.',
   array['Smart Meeting Room','Video Conferencing','Control System'],'published',0),
 ('gereja-di-karawaci','Gereja di Karawaci',null,null,null,'Karawaci',
   'Sistem tampilan LED untuk area ibadah dengan konten dinamis.',
   array['Worship LED','Digital Signage'],'published',1);

insert into project_solutions (project_id, solution_id)
 select (select id from projects where slug='perusahaan-agribisnis-jakarta'), (select id from solutions where slug='smart-meeting-room')
 union all
 select (select id from projects where slug='gereja-di-karawaci'), (select id from solutions where slug='house-of-worship');

insert into project_products (project_id, product_id)
 select (select id from projects where slug='gereja-di-karawaci'), id from products where slug='absen-a2';

-- ── Media wiring: solution heroes ───────────────────────────────────────────
update solutions s set hero_media_id = m.id
from media m
where m.external_url = (case s.slug
  when 'smart-meeting-room'               then 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80&auto=format&fit=crop'
  when 'auditorium-performance-hall'      then 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=1600&q=80&auto=format&fit=crop'
  when 'divisible-room-multipurpose-hall' then 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1600&q=80&auto=format&fit=crop'
  when 'pa-commercial-sound-system'       then 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&q=80&auto=format&fit=crop'
  when 'smart-classroom-training-room'    then 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1600&q=80&auto=format&fit=crop'
  when 'house-of-worship'                 then 'https://images.unsplash.com/photo-1462899006636-339e08d1844e?w=1600&q=80&auto=format&fit=crop'
  when 'broadcast-podcast-studio'         then 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&q=80&auto=format&fit=crop'
  when 'sports-entertainment-venue'       then 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=1600&q=80&auto=format&fit=crop'
end);

-- ── Media wiring: one placeholder gallery image per product (by category) ────
insert into product_images (product_id, media_id, sort_order)
 select p.id,
   (select id from media where external_url = (case c.slug
      when 'display'                     then 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=1600&q=80&auto=format&fit=crop'
      when 'digital-signage'             then 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=1600&q=80&auto=format&fit=crop'
      when 'audio'                       then 'https://images.unsplash.com/photo-1560439514-4e9645039924?w=1600&q=80&auto=format&fit=crop'
      when 'conferencing-collaboration'  then 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80&auto=format&fit=crop'
      when 'control-system'              then 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&q=80&auto=format&fit=crop'
      else                                    'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1600&q=80&auto=format&fit=crop'
    end)),
   0
 from products p join product_categories c on c.id = p.category_id;

-- ── Media wiring: project covers ────────────────────────────────────────────
update projects p set cover_media_id = m.id
from media m
where m.external_url = (case p.slug
  when 'perusahaan-agribisnis-jakarta' then 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80&auto=format&fit=crop'
  when 'gereja-di-karawaci'            then 'https://images.unsplash.com/photo-1462899006636-339e08d1844e?w=1600&q=80&auto=format&fit=crop'
end);

-- ── Featured product for the mega-menu (§4.1) ───────────────────────────────
update site_settings set featured_product_id = (select id from products where slug='qsc-k12-2') where id = 1;
