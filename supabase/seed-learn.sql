-- Learn with ACTA — additive seed (docs/learn-platform/02-DATA-SEO-AND-CMS.md §10, 04 §17.5).
--
-- Run AFTER 20260722100000_learn_platform.sql and 20260722100100_learn_rls_views.sql.
-- Idempotent and additive: safe to re-run, and it never touches supabase/seed.sql.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- WHAT IS PUBLISHED HERE, AND WHY THE REST IS NOT
-- ─────────────────────────────────────────────────────────────────────────────
-- The published corpus is ACTA's correctness claim, so the publish line is drawn
-- by *what kind of statement* a row makes, not by how finished it looks:
--
--   learn_tools   → PUBLISHED. Formulas, named standards and stated assumptions.
--                   Verifiable engineering artifacts, covered by 203 unit tests in
--                   components/learn/alat/**/calc.test.ts. The calculators already
--                   render from lib/learn/tool-registry.ts without these rows; the
--                   rows are an editorial OVERLAY (intro/SEO/related), not the
--                   source of truth. Nothing breaks if you delete them.
--
--   learn_paths   → DRAFT. A path is an editorial claim about what ACTA teaches
--                   and in what order. It needs a named human owner before it
--                   becomes ACTA's public position.
--
--   articles      → NOT SEEDED AT ALL. Lesson bodies are the technical authority
--                   this whole section is built to demonstrate. Generating them
--                   would manufacture exactly the credibility the platform exists
--                   to earn. The launch backlog is at the bottom of this file as
--                   titles + target keywords, to be written in the CMS by a human.
--
-- Consequence, and it is the designed behaviour: /learn stays `noindex` until 8
-- lessons are published (lib/learn/noindex.ts). The gate lifts by itself.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. learn_tools — PUBLISHED ──────────────────────────────────────────────
-- `component_key` must match lib/learn/tool-registry.ts EXACTLY. An unknown key
-- renders nothing (by design — the registry is a frozen literal, never eval'd).

insert into learn_tools (
  slug, name, component_key, intro_md, method_md, standard_ref,
  assumptions, worked_example_md, sort_order, status, published_at,
  seo_title, seo_description
) values
(
  'ukuran-layar',
  'Kalkulator Ukuran Layar',
  'UkuranLayar',
  E'Menentukan ukuran layar bukan soal selera, dan bukan soal ukuran ruangan. Yang menentukan adalah **jarak penonton terjauh** dan **jenis konten** yang ditampilkan. Kalkulator ini memakai metode DISCAS — metode yang sama yang dipakai konsultan AV untuk menghitung, bukan mengira-ngira.\n\nEmpat sumber halaman pertama Google Indonesia menerbitkan empat rumus jarak pandang yang saling bertentangan, dan tidak satu pun menyebut standarnya. Halaman ini menunjukkan perhitungannya.',
  E'Dua metode, satu geometri.\n\n**ADM — Analytical Decision Making** (CAD, spreadsheet, GIS, gambar teknis, citra medis). Penonton harus bisa membedakan satu piksel:\n\n    IH = FV × V_res / 3438\n    FV = IH × 3438 / V_res\n\n3438 adalah jumlah arcmenit dalam satu radian (60 × 180 / π = 3437,75).\n\n**BDM — Basic Decision Making** (slide, bullet, dashboard — sekitar 80% ruang rapat di Indonesia). Yang menentukan adalah tinggi elemen terkecil sebagai persentase tinggi gambar (%EH):\n\n    FV = 2 × %EH × IH\n    IH = FV / (2 × %EH)\n\nPada %EH = 3 rumus ini menjadi FV = 6 × IH — inilah "aturan 6H" yang sering dikutip tanpa syaratnya.\n\n**Diagonal** D = IH × √(1 + AR²). Untuk 16:9, D = IH × 2,0323.',
  'ANSI/AVIXA V202.01:2016 (DISCAS)',
  array[
    'Penonton terjauh diukur ke MATA, bukan ke dinding belakang.',
    'Ruang tanpa penghalang pandangan: tidak ada kolom, balok rendah, atau kepala baris depan yang menutupi bagian bawah layar.',
    'Ketersediaan ukuran panel di pasar Indonesia adalah penilaian ACTA, bukan bagian dari standar.',
    'Rasio kontras sistem TIDAK dihitung — angka 7:1 / 15:1 / 50:1 yang beredar tidak dapat diverifikasi dan saling bertentangan antar sumber.'
  ],
  E'**Ruang rapat 8 × 6 m, kursi terjauh 7,0 m, konten slide dengan bullet (%EH = 2).**\n\n    IH = FV / (2 × %EH) = 7,0 / (2 × 2) = 1,75 m\n    D  = IH × 2,0323 = 1,75 × 2,0323 = 3,56 m = 140"\n\n140" tidak tersedia sebagai panel komersial. Pilihannya: naik ke LED all-in-one, pakai proyektor, atau majukan baris terakhir. Layar 98" — panel terbesar yang umum — hanya layak sampai sekitar 4,9 m untuk konten yang sama.\n\nInilah alasan banyak ruang rapat di Indonesia terasa "layarnya kurang besar": ukurannya dipilih dari anggaran, bukan dari jarak duduk.',
  0, 'published', now(),
  'Kalkulator Ukuran Layar Ruang Rapat — Metode AVIXA DISCAS',
  'Hitung ukuran layar dari jarak penonton terjauh dengan metode DISCAS. Lengkap dengan rumus, asumsi, dan contoh perhitungan ruang rapat Indonesia.'
),
(
  'rt60-sabine',
  'Kalkulator Waktu Dengung (RT60)',
  'Rt60Sabine',
  E'Kalau ruangan terdengar "bergema" dan peserta rapat sering minta pengulangan, masalahnya hampir selalu bukan speaker — melainkan waktu dengung. Menambah daya audio di ruang yang terlalu dengung justru memperburuk kejelasan.\n\nKalkulator ini menghitung RT60 per pita oktaf, memilih model Sabine atau Eyring secara otomatis, dan mengubah hasilnya menjadi kebutuhan absorpsi dalam m² — angka yang bisa langsung masuk RAB.',
  E'    V = P × L × T                            [m³]\n    A = Σ(Sᵢ × αᵢ) + (N_orang × A_orang)     [m² sabin]\n    ᾱ = A / S_total\n\n**Sabine** (ᾱ ≤ 0,20):\n\n    RT60 = 0,161 × V / A\n\n**Eyring** (ᾱ > 0,20) — ruang yang sudah banyak diberi peredam:\n\n    RT60 = 0,161 × V / ( −S_total × ln(1 − ᾱ) )\n\nHampir semua halaman Indonesia memakai Sabine tanpa syarat. Di ruang yang sudah ditreatment, itu meleset 20–30%. Kalkulator ini menyebutkan model mana yang dipakai dan kenapa.\n\n**Jarak kritis** (batas mikrofon masih menangkap suara langsung):\n\n    R  = S_total × ᾱ / (1 − ᾱ)\n    Dc = 0,141 × √(Q × R)          0,141 = 1/√(16π)',
  'ISO 3382-1:2009 · ISO 3382-2:2008 · IEC 60268-16 (STI)',
  array[
    'Ruang berbentuk kotak tanpa balok, ceruk, atau bukaan besar ke ruang lain.',
    'Medan suara difus — asumsi dasar Sabine. Ruang sangat panjang, sangat rendah, atau sangat menyerap akan menyimpang.',
    'Koefisien α berasal dari nilai publikasi produsen dan literatur, BUKAN pengukuran di lokasi.',
    'Serapan udara hanya diperhitungkan untuk V > 1000 m³ pada 4 kHz.',
    'STI TIDAK dihitung: menurut IEC 60268-16 ia dipengaruhi kebisingan latar, direktivitas loudspeaker, dan pantulan yang tidak terlihat di denah.'
  ],
  E'**Ruang rapat 8 × 6 × 3 m — konstruksi khas Indonesia: lantai keramik, dinding bata plester, plafon gypsum, jendela kaca besar, 8 orang.**\n\n    V = 8 × 6 × 3 = 144 m³\n    A (500 Hz) = (48×0,02) + (84×0,05) + (48×0,10) + (8×0,45) ≈ 14,3 m² sabin\n    ᾱ = 14,3 / 180 = 0,079  →  ᾱ ≤ 0,20, Sabine berlaku\n    RT60 = 0,161 × 144 / 14,3 = 1,62 detik\n\nTarget untuk ruang rapat adalah 0,6 detik. Hasil 1,62 detik berarti suara satu kata masih terdengar ketika kata berikutnya diucapkan — persis keluhan "suaranya menggema, tidak jelas".\n\nUntuk mencapai target dibutuhkan sekitar 42 m² sabin absorpsi tambahan ≈ 38 m² panel akustik 50 mm (NRC 0,85). Itu adalah lingkup pekerjaan, bukan sekadar diagnosis.',
  1, 'published', now(),
  'Kalkulator RT60 — Waktu Dengung & Kejelasan Suara Ruangan',
  'Hitung waktu dengung ruangan per pita oktaf dengan model Sabine/Eyring, plus kebutuhan absorpsi dalam m². Dilengkapi rumus dan asumsinya.'
),
(
  'throw-distance-proyektor',
  'Kalkulator Jarak Proyektor & Kecerahan',
  'ThrowDistanceProyektor',
  E'Jarak lempar (throw distance) itu bagian yang mudah. Yang membuat proyektor gagal di Indonesia hampir selalu **kecerahan**: jendela besar, tirai seadanya, dan cahaya tropis sepanjang tahun.\n\nKalkulator ini menghitung keduanya, dan akan menyarankan LED direct-view kalau kebutuhan lumen sudah tidak masuk akal untuk proyektor — termasuk ketika itu berarti ACTA kehilangan penjualan proyektor.',
  E'    D = TR × W                    jarak lempar\n    W = D / TR\n\n    A_ft² = (W_m × H_m) × 10,7639\n    fL    = (lumen_ANSI ÷ A_ft²) × gain_layar\n    lumen = fL_target × A_ft² ÷ gain\n    cd/m² = fL × 3,426\n\nTidak ada π di rumus fL — kesalahan yang sering muncul di kalkulator lain.\n\nUmur lampu diperhitungkan dengan margin desain ×0,75 (penurunan keluaran 25–50% sepanjang umur pakai).\n\n**Target kecerahan**\n\n    12 fL   ruang gelap terkontrol\n    22 fL   ambient terkontrol      ← minimum untuk Indonesia\n    40 fL+  ambient tinggi           ← rekomendasi ruang berjendela',
  'ANSI/AVIXA V201.01 (kecerahan) · IEC 61947-1 (pengukuran lumen ANSI)',
  array[
    'Offset pemasangan di plafon dan lens shift TIDAK dimodelkan — keduanya spesifik per model proyektor.',
    'Gain layar dianggap merata ke seluruh sudut pandang; layar ber-gain tinggi menyempitkan sudut pandang.',
    'Lumen ANSI dianggap sesuai klaim produsen dan diukur menurut IEC 61947-1.',
    'Kebisingan cahaya sekitar (ambient) diperkirakan dari kategori ruang, bukan diukur dengan lux meter.'
  ],
  E'**Ruang kelas 9 × 7 m, layar lebar 3,0 m (16:10, tinggi 1,875 m), proyektor 4000 lumen, layar gain 1,0, jendela besar tanpa tirai gelap.**\n\n    A_ft² = (3,0 × 1,875) × 10,7639 = 60,5 ft²\n    fL    = (4000 ÷ 60,5) × 1,0 = 66 fL   ← lampu baru\n    Dengan margin umur lampu ×0,75 → 50 fL\n\nDi atas kertas ini lolos. Tetapi pada ruang berjendela tanpa tirai, target realistisnya 40 fL dan cahaya matahari langsung di area layar bisa menghapus kontras berapa pun lumennya. Rumus tidak bisa menggantikan tirai.\n\nKalau kebutuhan melewati 8.000 lumen, proyektor bukan lagi jawaban yang jujur — LED direct-view lebih murah dioperasikan dan tidak punya masalah kontras ambient.',
  2, 'published', now(),
  'Kalkulator Jarak Proyektor & Kecerahan (fL) untuk Ruang Indonesia',
  'Hitung jarak lempar dan kebutuhan lumen proyektor, termasuk margin umur lampu dan target foot-lambert untuk ruangan ber-ambient tinggi.'
)
on conflict do nothing;


-- ── 2. learn_paths — DRAFT ──────────────────────────────────────────────────
-- Hard rule (04 §17.5): a path does not go live below 5 PUBLISHED lessons. Its
-- lessons publish as orphans at flat /learn/{slug}, which costs nothing because
-- the URL space is flat and a lesson never needs a parent to exist.

insert into learn_paths (
  slug, title, eyebrow, promise, intro_md, outcome_bullets, role,
  solution_slug, sort_order, status
) values
(
  'akustik-tata-suara',
  'Akustik & Tata Suara Ruang',
  'JALUR 01',
  'Setelah jalur ini Anda bisa menilai sendiri apakah masalah ruangan Anda ada di akustik atau di perangkat — sebelum membeli apa pun.',
  E'Keluhan yang paling sering kami dengar bukan "speakernya kurang keras". Keluhannya adalah "suaranya ada, tapi tidak jelas". Dua hal itu punya penyebab yang berbeda, dan menambah daya pada masalah yang kedua justru memperburuknya.\n\nJalur ini membahas akustik ruang lebih dulu, baru perangkat. Urutannya sengaja: ruang yang salah tidak bisa diperbaiki dengan sistem audio yang benar.',
  array[
    'Membedakan masalah akustik dari masalah perangkat',
    'Membaca angka RT60 dan tahu target untuk jenis ruang Anda',
    'Memperkirakan kebutuhan absorpsi dalam m² untuk masuk anggaran',
    'Tahu pertanyaan apa yang harus diajukan ke integrator'
  ],
  'teknis-internal',
  null, 0, 'draft'
),
(
  'spesifikasi-pengadaan',
  'Spesifikasi, RKS & Pengadaan AV',
  'JALUR 02',
  'Setelah jalur ini Anda bisa menulis spesifikasi AV yang tidak bisa diakali saat tender, dan tahu klausul mana yang biasanya merusak hasil.',
  E'Sebagian besar kekecewaan pada proyek AV lahir jauh sebelum instalasi — yaitu di dokumen spesifikasi. Klausul "atau setara" yang tidak diberi batas, satuan yang tidak terukur, dan lingkup commissioning yang tidak disebut adalah tiga penyebab paling umum.\n\nJalur ini ditulis untuk tim pengadaan dan konsultan yang harus menuliskan apa yang mereka inginkan dalam bahasa yang mengikat.',
  array[
    'Menulis spesifikasi teknis yang terukur, bukan deskriptif',
    'Memberi batas pada klausul "atau setara"',
    'Memasukkan commissioning dan serah terima ke dalam lingkup',
    'Mengenali tanda penawaran yang akan bermasalah di lapangan'
  ],
  'spesifier-pengadaan',
  null, 1, 'draft'
)
on conflict do nothing;


-- ── 3. Launch lesson backlog — NOT seeded, written by a human in the CMS ────
--
-- Titles and target keywords from 02 §10 / 04 §17.5. Velocity is fixed at
-- 2,5 lessons/month. Rules that apply regardless of who writes them:
--   · Never more than 3 lessons published in one week (batch-dumping is the
--     behavioural signature of scaled content abuse; the penalty is site-wide).
--   · One published page per target_keyword. If a page covers the intent,
--     EXPAND it — expanding beats publishing.
--   · Surface reviewed_at, not published_at.
--
-- GELOMBANG 1 — baji akustik (bulan 1–2), jalur akustik-tata-suara
--   1. Apa Itu RT60 dan Kenapa Ruangan Anda Terdengar Bergema   kw: rt60 adalah
--   2. Waktu Dengung Ideal per Jenis Ruang Menurut ISO 3382-1    kw: waktu dengung ideal ruangan
--   3. Empat Rumus Jarak Pandang yang Beredar di Indonesia —
--      dan Mana yang Benar                                      kw: jarak pandang ideal videotron
--      ★ FLAGSHIP. Mengoreksi empat pesaing halaman-1 dengan menyebut metodenya
--        dan mengutip standar yang tidak satu pun dari mereka sebut. Halaman
--        paling layak di-link yang bisa ACTA produksi.
--   4. Satu Gedung, Tiga Sistem: Beda BGM, Paging, dan Emergency kw: sistem tata suara gedung
--   5. Menghitung Jumlah Ceiling Speaker: Pola Coverage
--      dan Sudut Dispersi                                       kw: cara menghitung jumlah ceiling speaker
--
-- GELOMBANG 2 — specifier (bulan 3–4), jalur spesifikasi-pengadaan
--   6. Menulis RKS Pekerjaan Tata Suara yang Tidak Bisa Diakali kw: rks pekerjaan tata suara
--   7. Klausul "Atau Setara": Kenapa Ini Sering Merusak Hasil   kw: spesifikasi atau setara tender
--   8. Insulasi vs Absorpsi: Dua Masalah, Dua Solusi            kw: insulasi suara vs peredam suara
--   9. Kenapa Peserta Remote Selalu Bilang "Suaranya Putus"     kw: audio video call jelek
--  10. Menentukan Ukuran Layar Ruang Rapat dengan Metode DISCAS kw: ukuran layar ruang rapat
--
-- Pada lesson ke-8 yang terbit, gate noindex di /learn terbuka sendiri.
--
-- CATATAN dari 04 §17.5: jatuhkan `cara-memilih-led-videotron` dari seed lama
-- bila masih ada — is_featured=true dan menargetkan satu klaster query yang
-- setiap analisis sarankan untuk dihindari.
