/**
 * The ACTA glossary — ONE page, one anchor per term (02-DATA-SEO §8.5, decision D8).
 *
 * ## Why this is a TypeScript constant and not a table
 *
 * D8 is binding: `/learn/glosarium` is a single URL with `#anchor` per term, not
 * ~150 per-term URLs. The reasoning is index selection, not page quality —
 * Google evaluates a directory in aggregate, so 130 thin stubs would be paid for
 * out of the 24 excellent lessons the whole strategy is bet on. One dense page
 * keeps 100% of the internal-linking and entity-grounding value and costs one
 * weekend instead of two quarters.
 *
 * A term graduates to its own URL only when Search Console shows that anchor
 * earning impressions — one at a time, on evidence. Until then there is no CMS
 * surface here, because a CMS surface for a file three people edit twice a year
 * is a form nobody maintains.
 *
 * ## The three registers are the product
 *
 * Every entry carries the buyer's word, the integrator's word, and the word that
 * appears in an RKS or tender document. That three-vocabulary gap is the largest
 * terminology problem in the Indonesian AV market — a client says *videotron*, a
 * consultant writes *layar LED*, a datasheet says *LED display*, and the three
 * never meet in one document. Capturing all three in one entry is what makes
 * this page rank on queries no competitor is even spelling the same way, and it
 * is what fills `alternateName` in the `DefinedTermSet` JSON-LD.
 *
 * ## Honesty rules that produced these definitions
 *
 * 1. Definitional first sentence, always — `"X adalah …"`, no throat-clearing
 *    (02-DATA-SEO §8.6 rule 1).
 * 2. Never invent a specification, a price, a standard number or a performance
 *    claim. Where a value is standard-derived, the standard is named. Where the
 *    value could not be verified, the concept is defined qualitatively and the
 *    reader is told to read the datasheet or the project's own RKS.
 * 3. No image-system contrast ratio is quoted anywhere, because ANSI/AVIXA
 *    V201.01 has not been read by anyone on this team and the numbers that
 *    circulate for it contradict each other (04-ROADMAP §17.1, blocking legal
 *    check). The ISCR entry says exactly that instead of guessing.
 *
 * Pure module: no React, no `server-only`, no I/O. Safe to import anywhere.
 */

import type { LearnToolSlug } from "@/lib/learn/cta";

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

/**
 * The three vocabularies one object is described in. Every array is ordered
 * most-common-spelling first, because the first entry is what the entry prints
 * inline and what leads `alternateName`.
 */
export type GlossaryRegister = {
  /** What the client, the end user or the building owner actually says out loud. */
  pembeli: readonly string[];
  /** What an integrator, a system engineer or a datasheet says. */
  integrator: readonly string[];
  /** What appears in an RKS, a BoQ, or a tender document. */
  spesifikasi: readonly string[];
};

export type GlossaryRelated = {
  /**
   * Planned lesson slugs from 04-ROADMAP §17.5. The renderer resolves these
   * against the published lesson slugs and DROPS any that does not exist, so a
   * slug that never ships costs a missing link — never a broken one.
   */
  lessons?: readonly string[];
  tools?: readonly LearnToolSlug[];
  /** Other glossary ids. Rendered as in-page `#anchor` links. */
  terms?: readonly string[];
};

export type GlossaryTerm = {
  /** URL fragment. Frozen once published — an anchor is an address. */
  id: string;
  /** Display headword. */
  term: string;
  register: GlossaryRegister;
  /** 80–150 words. Opens with a definitional sentence. */
  definition: string;
  /** The confusion this term is most often the victim of. */
  confusedWith?: string;
  /** Named standards this definition rests on. Never a number we did not verify. */
  standards?: readonly string[];
  related?: GlossaryRelated;
};

export type GlossaryGroup = {
  /** Uppercase A–Z, or "#" for anything that does not start with a letter. */
  letter: string;
  terms: readonly GlossaryTerm[];
};

/* ------------------------------------------------------------------ *
 * The terms
 * ------------------------------------------------------------------ */

export const GLOSSARY_TERMS: readonly GlossaryTerm[] = [
  {
    id: "absorpsi",
    term: "Absorpsi Suara",
    register: {
      pembeli: ["peredam suara", "biar tidak bergema", "busa telur"],
      integrator: ["absorpsi", "sound absorption", "penyerapan akustik"],
      spesifikasi: ["material penyerap bunyi", "pekerjaan akustik interior"],
    },
    definition:
      "Absorpsi suara adalah proses berubahnya energi bunyi menjadi panas ketika gelombang menembus material berpori, sehingga energi itu tidak kembali ke ruangan sebagai pantulan. Absorpsi mengubah cara ruangan terdengar dari dalam: waktu dengung turun, ekor suara memendek, dan percakapan jadi lebih mudah ditangkap. Yang tidak dilakukannya adalah menahan suara menembus dinding — itu pekerjaan insulasi, dan keduanya sering tertukar di lapangan. Kemampuan sebuah material menyerap dinyatakan dengan koefisien serap α per pita oktaf, diukur menurut ISO 354. Material tipis efektif di frekuensi tinggi dan hampir tidak berpengaruh di frekuensi rendah, yang menjelaskan kenapa ruangan yang sudah dipasang panel tipis masih terdengar bulky di suara pria dan musik.",
    confusedWith:
      "Insulasi suara. Absorpsi memperbaiki bunyi di dalam ruangan; insulasi menahan bunyi lewat antar-ruangan. Memasang peredam di dinding tidak akan membuat suara rapat berhenti bocor ke koridor.",
    standards: ["ISO 354", "ISO 3382-1"],
    related: {
      lessons: ["insulasi-vs-absorpsi", "rt60-akustik-ruang-bergema"],
      tools: ["rt60-sabine"],
      terms: ["insulasi", "koefisien-serap", "nrc", "rt60"],
    },
  },
  {
    id: "aec",
    term: "AEC (Acoustic Echo Cancellation)",
    register: {
      pembeli: ["suara saya balik", "gaung waktu video call", "lawan bicara dengar suaranya sendiri"],
      integrator: ["AEC", "acoustic echo canceller", "echo cancellation"],
      spesifikasi: ["prosesor audio dengan fungsi acoustic echo cancellation"],
    },
    definition:
      "AEC adalah fungsi pemrosesan sinyal yang membuang suara lawan bicara dari sinyal mikrofon sebelum sinyal itu dikirim balik, sehingga peserta jarak jauh tidak mendengar suaranya sendiri terlambat beberapa ratus milidetik. Prosesnya adalah pemodelan adaptif: prosesor mengetahui apa yang baru saja dikeluarkan loudspeaker, memperkirakan bagaimana ruangan memantulkannya kembali ke mikrofon, lalu mengurangkannya. Karena modelnya mengikuti akustik ruangan, AEC melemah persis ketika ruangannya bergema, ketika volume loudspeaker dinaikkan melewati batas, atau ketika posisi mikrofon dan loudspeaker digeser setelah commissioning. Itu sebabnya keluhan echo pada rapat hybrid lebih sering berupa masalah akustik dan gain daripada kegagalan perangkat.",
    confusedWith:
      "Noise suppression dan noise cancelling headphone. Keduanya membuang bunyi latar; AEC khusus membuang suara sistem sendiri yang kembali lewat udara.",
    related: {
      lessons: ["audio-video-call-putus-putus"],
      terms: ["dsp", "rt60", "jarak-kritis", "room-system"],
    },
  },
  {
    id: "aes67",
    term: "AES67",
    register: {
      pembeli: ["audio lewat kabel LAN", "biar merknya bisa campur"],
      integrator: ["AES67", "audio over IP", "interoperability layer"],
      spesifikasi: ["perangkat audio jaringan mendukung AES67"],
    },
    definition:
      "AES67 adalah standar Audio Engineering Society yang mendefinisikan lapisan interoperabilitas audio-over-IP, supaya perangkat dari ekosistem berbeda dapat bertukar aliran audio pada jaringan yang sama. AES67 menetapkan hal-hal yang harus disepakati bersama — sinkronisasi waktu berbasis PTP (IEEE 1588), pengangkutan lewat RTP, dan format aliran dasar — tanpa menggantikan protokol milik vendor. Praktisnya, AES67 adalah jembatan: perangkat Dante, Ravenna atau Q-SYS bisa saling mengirim audio dalam mode AES67 walaupun fitur khas masing-masing ekosistem, seperti penemuan perangkat otomatis dan routing terpusat, tidak ikut menyeberang. Menulis “mendukung AES67” di RKS memberi jaminan pertukaran aliran, bukan jaminan satu antarmuka manajemen.",
    confusedWith:
      "Dante. Dante adalah ekosistem milik Audinate dengan penemuan perangkat dan routing sendiri; AES67 adalah mode interoperabilitas yang bisa dinyalakan di dalamnya.",
    standards: ["AES67", "IEEE 1588 (PTP)"],
    related: { terms: ["dante", "av-over-ip", "qos"] },
  },
  {
    id: "atau-setara",
    term: "Atau Setara",
    register: {
      pembeli: ["yang penting fungsinya sama", "merk bebas asal mirip"],
      integrator: ["or equal", "klausul kesetaraan"],
      spesifikasi: ["merk X atau setara", "spesifikasi teknis minimum"],
    },
    definition:
      "“Atau setara” adalah klausul dalam dokumen pengadaan yang membolehkan penyedia menawarkan produk selain merk yang disebut, sepanjang memenuhi spesifikasi teknis yang tertulis. Klausul ini ada untuk mencegah spesifikasi mengunci satu merk. Masalahnya muncul ketika spesifikasi di sebelahnya ditulis dari brosur — daftar fitur, bukan daftar kinerja yang bisa diukur. Kesetaraan lalu dinilai dari kemiripan tabel, sehingga barang yang berbeda kelas bisa lolos secara administratif. Klausul ini jadi aman ketika spesifikasi menyebut besaran yang bisa dibuktikan dan cara membuktikannya: nilai terukur menurut standar yang dinamai, dokumen uji yang harus dilampirkan, dan hasil yang harus tercapai saat commissioning.",
    confusedWith:
      "Spesifikasi merk tunggal. Menghapus nama merk tidak dengan sendirinya membuat spesifikasi terbuka; menuliskan besaran terukur yang membuatnya terbuka.",
    related: {
      lessons: ["klausul-atau-setara", "rks-pekerjaan-tata-suara"],
      terms: ["rks", "boq", "commissioning"],
    },
  },
  {
    id: "av-over-ip",
    term: "AV over IP",
    register: {
      pembeli: ["video lewat kabel jaringan", "tidak pakai kabel HDMI panjang"],
      integrator: ["AV over IP", "AVoIP", "IP video distribution"],
      spesifikasi: ["sistem distribusi sinyal audio video berbasis jaringan IP"],
    },
    definition:
      "AV over IP adalah metode mendistribusikan sinyal audio dan video sebagai paket data di jaringan Ethernet, menggantikan matriks switcher berkabel titik-ke-titik. Encoder mengubah sumber jadi aliran jaringan, decoder mengembalikannya di sisi layar, dan routing menjadi urusan konfigurasi jaringan, bukan jumlah port di sebuah kotak. Keuntungannya adalah skala: menambah satu tujuan berarti menambah satu decoder, bukan mengganti matriks. Konsekuensinya adalah bahwa jaringan menjadi bagian dari sistem AV — bandwidth, multicast, IGMP snooping, VLAN dan QoS berpindah dari daftar tugas tim IT ke daftar tugas bersama. Kelas kompresi dan latensinya berbeda jauh antar keluarga produk, jadi keduanya perlu ditulis di spesifikasi, bukan diasumsikan.",
    confusedWith:
      "Streaming ke internet. AV over IP adalah distribusi di dalam gedung dengan kontrol latensi; streaming adalah pengiriman ke publik dengan buffer detik.",
    standards: ["SMPTE ST 2110", "IEEE 802.1Q"],
    related: { terms: ["hdbaset", "qos", "aes67", "dante", "videowall"] },
  },
  {
    id: "beamforming",
    term: "Beamforming Mic Array",
    register: {
      pembeli: ["mik di plafon", "mik yang tidak kelihatan", "tanpa mik meja"],
      integrator: ["beamforming microphone array", "ceiling mic array", "steerable array"],
      spesifikasi: ["mikrofon array langit-langit dengan pembentukan berkas"],
    },
    definition:
      "Beamforming mic array adalah mikrofon yang terdiri dari banyak kapsul dalam satu badan, yang sinyalnya digabungkan dengan beda waktu terkendali sehingga sensitivitasnya mengarah ke zona tertentu dan menurun ke arah lain. Karena arahnya dibentuk secara elektronik, satu unit di plafon bisa mengikuti pembicara tanpa ada yang bergerak. Kelebihannya adalah meja yang bersih dan tidak ada mikrofon yang dipindah-pindah pengguna. Batasnya bersifat fisika: array memperbaiki rasio suara langsung terhadap suara pantul hanya sampai batas tertentu, dan jarak dari mulut ke plafon tetap jauh lebih besar daripada jarak ke mikrofon meja. Di ruangan dengan waktu dengung tinggi, array yang mahal tetap merekam ruangan yang bergema.",
    confusedWith:
      "Mikrofon shotgun. Shotgun mempersempit arah lewat bentuk fisik tabung; array membentuk arah lewat pemrosesan sinyal dan bisa punya beberapa zona sekaligus.",
    related: {
      lessons: ["audio-video-call-putus-putus"],
      tools: ["rt60-sabine"],
      terms: ["aec", "jarak-kritis", "medan-langsung-pantul", "rt60"],
    },
  },
  {
    id: "bgm",
    term: "BGM (Background Music)",
    register: {
      pembeli: ["musik di lobi", "sound system biasa", "musik latar"],
      integrator: ["BGM", "background music system", "distributed audio"],
      spesifikasi: ["sistem tata suara latar", "pekerjaan sound system area publik"],
    },
    definition:
      "BGM adalah sistem tata suara yang bertugas menyebarkan musik atau audio latar secara merata pada tingkat yang tidak mengganggu percakapan. Prioritas rancangannya adalah kerataan cakupan dan kualitas nada pada tingkat rendah, bukan tingkat tekanan suara maksimum. Karena itu BGM biasanya memakai banyak loudspeaker berdaya kecil yang berdekatan pada distribusi tegangan konstan, bukan sedikit loudspeaker besar. BGM adalah salah satu dari tiga sistem yang sering disatukan dalam satu anggaran padahal punya syarat berbeda: BGM mengutamakan kerataan, paging mengutamakan kejelasan bicara, dan tata suara darurat mengutamakan kejelasan pada kondisi terburuk plus pemantauan jalur. Satu rangkaian perangkat bisa melayani ketiganya hanya jika ketiga syarat itu ditulis terpisah sejak awal.",
    confusedWith:
      "Sistem paging. Keduanya sering memakai loudspeaker yang sama, tetapi target kinerjanya berbeda dan hanya salah satunya yang boleh dipakai sebagai dasar perhitungan.",
    related: {
      lessons: ["sistem-tata-suara-gedung-bgm-paging-emergency"],
      terms: ["paging", "tata-suara-darurat", "sistem-100v", "ceiling-speaker"],
    },
  },
  {
    id: "boq",
    term: "BoQ (Bill of Quantity)",
    register: {
      pembeli: ["daftar barang", "rincian penawaran"],
      integrator: ["BoQ", "bill of quantity", "daftar kuantitas"],
      spesifikasi: ["daftar kuantitas dan harga", "rincian volume pekerjaan"],
    },
    definition:
      "BoQ adalah daftar terstruktur berisi setiap item pekerjaan beserta satuan dan volumenya, yang dipakai penawar untuk mengisi harga sehingga penawaran bisa dibandingkan baris per baris. Dalam pekerjaan AV, BoQ yang sehat memisahkan perangkat, material instalasi, jasa pemasangan, konfigurasi dan commissioning, serta pelatihan dan dokumentasi. Yang paling sering hilang adalah baris commissioning dan dokumentasi as-built, karena keduanya tidak terlihat sebagai barang; ketika keduanya tidak ada di BoQ, keduanya juga tidak ada di lapangan. BoQ tidak menggantikan RKS: BoQ menyatakan berapa banyak, RKS menyatakan sebaik apa. Menilai penawaran hanya dari BoQ berarti menilai jumlah kotak, bukan sistem yang jadi.",
    confusedWith:
      "RKS. BoQ adalah kuantitas dan harga; RKS adalah syarat mutu dan cara pembuktiannya.",
    related: {
      lessons: ["rks-pekerjaan-tata-suara"],
      terms: ["rks", "atau-setara", "commissioning"],
    },
  },
  {
    id: "ceiling-speaker",
    term: "Ceiling Speaker",
    register: {
      pembeli: ["speaker plafon", "speaker bulat di atas"],
      integrator: ["ceiling speaker", "in-ceiling loudspeaker"],
      spesifikasi: ["loudspeaker tanam plafon dengan trafo tegangan konstan"],
    },
    definition:
      "Ceiling speaker adalah loudspeaker yang ditanam pada plafon dan memancarkan suara ke bawah dalam pola kerucut, dipakai untuk mendistribusikan audio secara merata di area luas. Jumlah dan jarak antar unit tidak ditentukan selera, melainkan oleh sudut dispersi unit, tinggi plafon di atas telinga pendengar, dan kerataan yang ingin dicapai pada bidang dengar. Semakin tinggi plafon, semakin lebar kerucut yang sampai ke telinga, sehingga jarak antar unit boleh lebih renggang — dan sebaliknya. Kesalahan yang paling mahal adalah menghitung jumlah unit dari luas lantai dibagi angka kebiasaan, lalu menemukan pada saat commissioning bahwa ada titik keras di bawah unit dan titik lemah di antaranya.",
    confusedWith:
      "Ceiling mic array. Bentuknya sama-sama tanam plafon; yang satu mengeluarkan suara, yang satu mengambil suara, dan aturan penempatannya berlawanan.",
    related: {
      lessons: ["menghitung-jumlah-ceiling-speaker"],
      terms: ["bgm", "sistem-100v", "penguat-daya", "db-spl"],
    },
  },
  {
    id: "commissioning",
    term: "Commissioning",
    register: {
      pembeli: ["setting akhir", "tes serah terima", "training pemakaian"],
      integrator: ["commissioning", "system tuning", "verifikasi kinerja"],
      spesifikasi: ["pekerjaan pengujian, penyetelan dan serah terima sistem"],
    },
    definition:
      "Commissioning adalah tahap ketika sistem yang sudah terpasang disetel, diukur, dan dibuktikan memenuhi kriteria yang tertulis di dokumen, lalu hasilnya didokumentasikan. Isinya bukan “menyalakan dan mencoba”: struktur gain ditetapkan, cakupan diperiksa di titik-titik yang disepakati, prosesor dikonfigurasi dan konfigurasinya diarsipkan, dan setiap penyimpangan dicatat beserta tindakannya. Commissioning adalah baris yang paling sering dipotong ketika anggaran ditekan, karena satu-satunya bukti bahwa ia dikerjakan adalah dokumen. Sistem yang tidak di-commissioning tetap menyala; yang hilang adalah kepastian bahwa ia memenuhi apa yang dibeli, dan referensi tertulis untuk memperbaikinya ketika kinerjanya berubah setahun kemudian.",
    confusedWith:
      "Instalasi. Instalasi selesai ketika perangkat terpasang dan menyala; commissioning selesai ketika kinerjanya terukur dan tercatat.",
    related: {
      lessons: ["rks-pekerjaan-tata-suara"],
      terms: ["rks", "boq", "sti-stipa", "kebisingan-latar"],
    },
  },
  {
    id: "control-system",
    term: "Control System",
    register: {
      pembeli: ["panel sentuh", "satu tombol langsung nyala", "remote ruangan"],
      integrator: ["control system", "control processor", "touch panel"],
      spesifikasi: ["sistem kendali terpusat dengan panel sentuh dan prosesor kendali"],
    },
    definition:
      "Control system adalah perangkat pemrogram yang menyatukan kendali seluruh peralatan di sebuah ruangan menjadi satu antarmuka, sehingga pengguna menekan “mulai rapat” alih-alih menyalakan enam perangkat berurutan. Prosesor kendali berbicara ke tiap perangkat lewat jalurnya masing-masing — jaringan, serial, relay, atau infra merah — sementara panel sentuh hanya menampilkan antarmuka. Nilai sebuah control system muncul dari perilakunya di keadaan tidak normal: apa yang terjadi ketika satu perangkat mati, ketika sumber tidak terdeteksi, atau ketika listrik padam di tengah rapat. Karena logikanya adalah program, kode dan dokumentasinya bagian dari yang diserahterimakan; sistem tanpa arsip program hanya bisa diperbaiki oleh yang membuatnya.",
    confusedWith:
      "Panel sentuh. Panel sentuh adalah layarnya; control system adalah prosesor dan programnya. Mengganti panel tidak mengubah logika, dan sebaliknya.",
    related: { terms: ["room-system", "poe", "usb-bridging"] },
  },
  {
    id: "dante",
    term: "Dante",
    register: {
      pembeli: ["audio lewat kabel LAN", "tidak perlu kabel audio banyak"],
      integrator: ["Dante", "Dante Controller", "audio networking"],
      spesifikasi: ["perangkat audio jaringan berbasis Dante dengan redundansi"],
    },
    definition:
      "Dante adalah ekosistem audio-over-IP milik Audinate yang mengangkut kanal audio digital tak terkompresi melalui jaringan Ethernet standar, lengkap dengan penemuan perangkat otomatis dan routing terpusat lewat satu aplikasi. Sinkronisasi antar perangkat dilakukan dengan protokol waktu berbasis IEEE 1588 (PTP), yang menjaga semua konverter berjalan pada jam yang sama sehingga kanal tetap sefase. Yang membuat Dante dominan bukan kualitas audionya, melainkan kemudahan operasional: satu kabel membawa banyak kanal dua arah, dan perubahan routing tidak memerlukan perubahan kabel. Konsekuensinya, kualitas jaringan menjadi bagian dari kualitas audio — switch, konfigurasi QoS, dan kebijakan VLAN harus disepakati bersama tim IT sebelum instalasi, bukan sesudahnya.",
    confusedWith:
      "AES67. Dante bisa berjalan dalam mode AES67 untuk bertukar aliran dengan ekosistem lain, tetapi mode itu tidak membawa serta penemuan perangkat dan routing khas Dante.",
    standards: ["IEEE 1588 (PTP)", "AES67"],
    related: { terms: ["aes67", "av-over-ip", "qos", "dsp"] },
  },
  {
    id: "db-spl",
    term: "dB SPL",
    register: {
      pembeli: ["berapa keras suaranya", "desibel"],
      integrator: ["dB SPL", "sound pressure level", "tingkat tekanan suara"],
      spesifikasi: ["tingkat tekanan suara pada bidang dengar, dinyatakan dalam dB"],
    },
    definition:
      "dB SPL adalah satuan tingkat tekanan suara, yaitu perbandingan logaritmik antara tekanan suara terukur dan tekanan acuan 20 mikropascal. Karena logaritmik, angkanya tidak bisa dijumlahkan seperti bilangan biasa: menggandakan jumlah sumber yang identik menambah 3 dB, bukan menggandakan angkanya. Nilai dB SPL tidak lengkap tanpa tiga keterangan: pembobotan frekuensi yang dipakai (misalnya A atau C), lamanya waktu rata-rata, dan titik pengukurannya. Angka tanpa tiga keterangan itu tidak bisa diverifikasi dan karena itu tidak layak dipakai sebagai kriteria di dokumen kontrak. Alat ukur yang dipakai untuk pembuktian mengacu pada IEC 61672, dan kelas alatnya perlu ikut ditulis bila hasilnya dijadikan dasar penerimaan.",
    confusedWith:
      "Watt. Watt adalah daya listrik yang masuk ke loudspeaker; dB SPL adalah tekanan suara yang keluar. Hubungan keduanya ditentukan sensitivitas loudspeaker dan akustik ruangan.",
    standards: ["IEC 61672"],
    related: { terms: ["kebisingan-latar", "penguat-daya", "medan-langsung-pantul"] },
  },
  {
    id: "digital-signage",
    term: "Digital Signage",
    register: {
      pembeli: ["TV konten", "layar promosi", "papan informasi digital"],
      integrator: ["digital signage", "media player", "CMS signage"],
      spesifikasi: ["sistem papan informasi digital dengan manajemen konten terpusat"],
    },
    definition:
      "Digital signage adalah sistem yang menampilkan konten terjadwal pada satu atau banyak layar, dikendalikan dari satu tempat lewat perangkat lunak manajemen konten. Tiga bagiannya berdiri sendiri dan sering dibeli terpisah: layar dengan kelas pemakaian yang sesuai jam operasi, media player yang memutar konten, dan platform manajemen yang menjadwalkan serta memantau. Bagian yang paling sering diremehkan adalah yang ketiga, karena biayanya berulang sementara dua yang lain sekali beli. Layar konsumen dipasang pada sistem signage biasanya gagal bukan karena gambarnya, melainkan karena siklus pemakaian, orientasi pemasangan, dan kendali jarak jauhnya tidak dirancang untuk menyala belasan jam setiap hari.",
    confusedWith:
      "Videowall. Signage adalah soal konten dan penjadwalan; videowall adalah soal susunan layar. Sebuah videowall bisa menjalankan signage, dan sebaliknya tidak selalu.",
    related: { terms: ["videowall", "led-display", "interactive-flat-panel", "nit"] },
  },
  {
    id: "discas",
    term: "DISCAS",
    register: {
      pembeli: ["ukuran layar yang pas", "biar baris belakang kebaca"],
      integrator: ["DISCAS", "display image size for 2D content", "V202.01"],
      spesifikasi: ["penentuan ukuran citra mengacu ANSI/AVIXA V202.01"],
    },
    definition:
      "DISCAS adalah metode dalam standar ANSI/AVIXA V202.01 untuk menentukan ukuran citra minimum dari jarak penonton terjauh dan jenis konten yang ditampilkan. Metode ini membagi kebutuhan menjadi dua: konten yang cukup dilihat untuk mengambil keputusan dasar diukur dari tinggi elemen terkecil relatif terhadap tinggi gambar, sementara konten yang harus dibaca secara analitis diukur dari resolusi vertikal dan ketajaman mata. Nilai DISCAS bagi pembeli adalah bahwa ukuran layar berhenti menjadi negosiasi anggaran dan menjadi hasil hitungan yang bisa ditunjukkan. Beberapa aturan praktis lain beredar di pasar Indonesia dan memberi jawaban yang saling bertentangan; DISCAS adalah satu-satunya yang menyebutkan asumsinya sendiri.",
    confusedWith:
      "Aturan pembagi jarak yang beredar untuk videotron. Aturan itu menghasilkan angka tanpa menyebut konten dan asumsinya, sehingga dua orang bisa mendapat jawaban berbeda dari ruangan yang sama.",
    standards: ["ANSI/AVIXA V202.01"],
    related: {
      lessons: ["jarak-pandang-ideal-videotron", "ukuran-layar-ruang-rapat-discas"],
      tools: ["ukuran-layar"],
      terms: ["rasio-aspek", "pixel-pitch", "led-display"],
    },
  },
  {
    id: "dsp",
    term: "DSP (Digital Signal Processor)",
    register: {
      pembeli: ["alat setting suara", "prosesor audio"],
      integrator: ["DSP", "audio processor", "matrix processor"],
      spesifikasi: ["prosesor sinyal digital dengan matriks, AEC dan pemroses keluaran"],
    },
    definition:
      "DSP adalah prosesor yang mengerjakan perataan, penundaan, kompresi, pencampuran, penekanan umpan balik dan pembatalan gema pada sinyal audio dalam bentuk digital, sesuai program yang dibuat perancang. Berbeda dari mixer analog, konfigurasinya adalah berkas yang bisa disalin, diarsipkan, dan dipulihkan; itu membuat DSP menjadi tempat tersimpannya sebagian besar nilai rekayasa sebuah sistem tata suara. Konsekuensinya, berkas konfigurasi adalah bagian dari yang harus diserahterimakan. Sistem yang dikonfigurasi dengan baik tetapi berkasnya tidak pernah diserahkan akan menjadi tidak bisa dipelihara begitu orang yang memprogramnya berganti, dan biasanya berakhir dengan seseorang mengembalikan semuanya ke pengaturan pabrik.",
    confusedWith:
      "Mixer. Mixer adalah antarmuka operator untuk mencampur secara langsung; DSP adalah pemroses terprogram yang biasanya berjalan tanpa operator.",
    related: {
      terms: ["mixer", "aec", "feedback", "dante"],
    },
  },
  {
    id: "feedback",
    term: "Feedback (Storing)",
    register: {
      pembeli: ["storing", "ngiiing", "suara melengking"],
      integrator: ["feedback", "acoustic feedback", "howling"],
      spesifikasi: ["sistem dilengkapi pengendali umpan balik akustik"],
    },
    definition:
      "Feedback adalah keadaan ketika suara dari loudspeaker kembali masuk ke mikrofon dengan penguatan yang cukup untuk berputar terus, sehingga sistem berdengung atau melengking pada frekuensi tertentu. Frekuensi yang berbunyi adalah frekuensi dengan penguatan lingkar tertinggi, biasanya ditentukan puncak respons ruangan, arah mikrofon, dan penempatan loudspeaker. Karena akar masalahnya adalah lingkar penguatan, penyelesaiannya bersifat geometri dan struktur gain terlebih dulu: memperpendek jarak mulut ke mikrofon, menjauhkan mikrofon dari sumbu loudspeaker, dan mengurangi jumlah mikrofon aktif. Pengendali umpan balik otomatis menambah ruang aman beberapa desibel, tetapi ia menambal batas fisik, bukan menggeser batasnya.",
    confusedWith:
      "Kualitas mikrofon. Mengganti mikrofon jarang menyelesaikan storing; yang menentukan adalah jarak, arah, dan berapa banyak penguatan yang diminta dari sistem.",
    related: { terms: ["dsp", "medan-langsung-pantul", "jarak-kritis", "rt60"] },
  },
  {
    id: "flutter-echo",
    term: "Flutter Echo",
    register: {
      pembeli: ["suaranya mantul-mantul", "ada gaung cepat kalau tepuk tangan"],
      integrator: ["flutter echo", "slap echo", "pantulan berulang"],
      spesifikasi: ["pengendalian pantulan pada permukaan sejajar"],
    },
    definition:
      "Flutter echo adalah pantulan berulang cepat yang terjadi ketika bunyi terperangkap di antara dua permukaan keras yang sejajar, terdengar sebagai denting atau derik pendek sesudah tepukan tangan. Sifatnya lokal dan berbeda dari waktu dengung: sebuah ruangan bisa punya waktu dengung yang wajar dan tetap punya flutter echo pada satu jalur antar-dinding. Karena penyebabnya adalah geometri, perbaikannya juga geometri — memutus kesejajaran, menambahkan penghambur, atau memberi penyerap pada salah satu dari dua permukaan yang berhadapan; tidak perlu keduanya. Uji lapangan paling murah untuk mendeteksinya adalah bertepuk tangan sekali di beberapa titik dan mendengarkan ekor bunyinya, sebelum alat ukur apa pun dikeluarkan.",
    confusedWith:
      "Waktu dengung. RT60 menggambarkan peluruhan energi seluruh ruangan; flutter echo adalah cacat pada jalur pantul tertentu yang bisa lolos dari angka rata-rata.",
    related: {
      tools: ["rt60-sabine"],
      terms: ["rt60", "absorpsi", "koefisien-serap"],
    },
  },
  {
    id: "foot-lambert",
    term: "Foot-lambert (fL)",
    register: {
      pembeli: ["terangnya cukup tidak", "gambarnya pucat kalau lampu nyala"],
      integrator: ["foot-lambert", "fL", "screen luminance"],
      spesifikasi: ["luminansi layar pada bidang pandang, dinyatakan dalam fL atau cd/m²"],
    },
    definition:
      "Foot-lambert adalah satuan luminansi yang menyatakan seberapa terang permukaan layar terlihat oleh mata, berbeda dari lumen yang menyatakan berapa banyak cahaya yang dipancarkan proyektor. Nilainya bergantung pada tiga hal sekaligus: keluaran proyektor, luas layar, dan gain layar — proyektor yang sama pada layar dua kali lebih lebar menghasilkan luminansi jauh lebih rendah karena luasnya naik kuadratik. Satu foot-lambert setara sekitar 3,426 cd/m², sehingga angka dalam dua satuan itu bisa dipertukarkan. Karena luminansi yang dirasakan juga bergantung pada cahaya sekitar, target fL selalu disebut bersama kondisi ruangannya; menyebut target tanpa menyebut kondisi cahaya membuat angkanya tidak bisa diperiksa.",
    confusedWith:
      "Lumen. Lumen adalah keluaran proyektor menurut datasheet; foot-lambert adalah hasil akhirnya di layar setelah dibagi luas dan dikalikan gain.",
    related: {
      tools: ["throw-distance-proyektor"],
      terms: ["lumen", "nit", "screen-gain", "iscr"],
    },
  },
  {
    id: "ground-loop",
    term: "Ground Loop",
    register: {
      pembeli: ["ada dengung", "suara nging terus walau tidak ada yang bicara"],
      integrator: ["ground loop", "hum", "dengung 50 Hz"],
      spesifikasi: ["pembumian sistem audio video pada satu titik referensi"],
    },
    definition:
      "Ground loop adalah dengung berfrekuensi rendah yang muncul ketika dua perangkat yang terhubung sinyal juga terhubung ke pembumian lewat jalur berbeda, sehingga ada arus kecil mengalir pada pelindung kabel sinyal dan terbaca sebagai audio. Cirinya khas: dengung tetap ada walaupun semua kanal ditutup, dan berubah ketika satu perangkat dicabut dari stopkontak lain. Penyelesaiannya dimulai dari pembumian dan tata letak listrik, bukan dari mengganti kabel — memberi satu titik referensi pembumian untuk seluruh rak, memakai jalur sinyal berimbang, dan bila perlu memutus lintasan pembumian pada sisi sinyal dengan trafo isolasi. Melepas pin pembumian pada kabel listrik menghilangkan dengung dan menciptakan bahaya kejut; itu bukan solusi.",
    confusedWith:
      "Gangguan kabel. Dengung ground loop biasanya bertahan walaupun kabel diganti dan hilang ketika sumber listrik disatukan.",
    related: { terms: ["penguat-daya", "db-spl", "commissioning"] },
  },
  {
    id: "hdbaset",
    term: "HDBaseT",
    register: {
      pembeli: ["HDMI jarak jauh", "kabel LAN untuk video"],
      integrator: ["HDBaseT", "extender", "transmitter receiver"],
      spesifikasi: ["perpanjangan sinyal video melalui kabel twisted pair berbasis HDBaseT"],
    },
    definition:
      "HDBaseT adalah teknologi yang mengangkut video, audio, kendali, dan pada sebagian kelas juga daya, melalui satu kabel twisted pair, untuk memperpanjang jarak yang tidak bisa ditempuh kabel HDMI. Berbeda dari AV over IP, HDBaseT bersifat titik-ke-titik: satu pemancar berpasangan dengan satu penerima dan tidak melewati switch jaringan biasa. Jarak maksimum yang dijamin ditentukan kelas HDBaseT perangkat, resolusi yang dikirim, dan mutu kabel serta terminasinya — angkanya ada di datasheet dan tidak boleh diasumsikan seragam antar produk. Kegagalan paling umum di lapangan bukan pada perangkatnya, melainkan pada kabel yang dipilih atau dipasang menurut kebiasaan jaringan data, bukan menurut syarat pabrikan.",
    confusedWith:
      "Jaringan Ethernet biasa. Kabelnya sama, tetapi sinyalnya bukan paket IP dan tidak boleh dilewatkan switch data.",
    related: { terms: ["av-over-ip", "hdcp", "poe"] },
  },
  {
    id: "hdcp",
    term: "HDCP",
    register: {
      pembeli: ["layarnya hitam padahal kabel sudah colok", "gambar tidak mau keluar"],
      integrator: ["HDCP", "content protection", "handshake"],
      spesifikasi: ["seluruh rantai sinyal mendukung versi HDCP yang sama"],
    },
    definition:
      "HDCP adalah sistem proteksi salinan yang mengharuskan sumber dan tujuan saling mengenali sebelum gambar dilewatkan, dan memblokir keluaran bila salah satu perangkat di rantai tidak memenuhi syarat. Versinya berbeda-beda, dan perangkat versi lama pada satu titik rantai bisa membuat seluruh jalur gagal walaupun semua kabel benar. Gejalanya khas dan menyesatkan: layar hitam atau berkedip tanpa pesan kesalahan, sehingga sering didiagnosis sebagai kabel rusak. Karena syaratnya berlaku untuk seluruh rantai — sumber, switcher, extender, distributor, sampai layar — versi HDCP perlu ditulis sebagai syarat sistem di RKS, bukan diperiksa satu per satu di datasheet setelah barang datang.",
    confusedWith:
      "Masalah kabel. Kabel rusak biasanya memberi gambar berbintik atau putus-putus; kegagalan HDCP memberi layar hitam bersih.",
    related: { terms: ["hdbaset", "av-over-ip", "interactive-flat-panel"] },
  },
  {
    id: "insulasi",
    term: "Insulasi Suara",
    register: {
      pembeli: ["biar tidak bocor ke ruang sebelah", "kedap suara"],
      integrator: ["insulasi", "sound insulation", "isolasi bunyi"],
      spesifikasi: ["persyaratan reduksi bunyi antar-ruang, dinyatakan dengan Rw atau STC"],
    },
    definition:
      "Insulasi suara adalah kemampuan sebuah konstruksi menahan energi bunyi menembus dari satu ruang ke ruang lain, ditentukan oleh massa, kekakuan, kekedapan udara, dan jumlah lapisan yang terpisah secara struktural. Insulasi bekerja pada perpindahan antar-ruang; ia tidak memperbaiki bunyi di dalam ruangan itu sendiri. Musuh terbesarnya adalah kebocoran: celah pintu, sambungan dinding yang tidak tertutup, dan yang paling sering, dinding yang berhenti di plafon gantung dan meneruskan bunyi lewat rongga di atasnya. Karena satu lubang kecil bisa membatalkan seluruh nilai konstruksi, insulasi adalah pekerjaan yang hasilnya ditentukan detail penyelesaian, bukan ketebalan material saja.",
    confusedWith:
      "Absorpsi. Menempel peredam di permukaan dalam ruangan tidak menaikkan insulasi; keduanya masalah berbeda dengan solusi berbeda.",
    standards: ["ISO 717-1", "ASTM E413"],
    related: {
      lessons: ["insulasi-vs-absorpsi"],
      terms: ["absorpsi", "stc-rw", "kebisingan-latar"],
    },
  },
  {
    id: "interactive-flat-panel",
    term: "Interactive Flat Panel (IFP)",
    register: {
      pembeli: ["papan tulis digital", "TV sentuh", "smart board"],
      integrator: ["interactive flat panel", "IFP", "interactive display"],
      spesifikasi: ["panel datar interaktif dengan dukungan sentuh multi-titik"],
    },
    definition:
      "Interactive flat panel adalah layar datar dengan lapisan sentuh terintegrasi dan perangkat lunak papan tulis, dipakai sebagai pengganti proyektor plus papan tulis di ruang kelas dan ruang rapat. Yang menentukan kepuasan pemakaian bukan resolusi, melainkan hal-hal yang jarang masuk perbandingan: jumlah titik sentuh serentak, keterlambatan tinta terhadap gerakan tangan, cara berbagi layar dari perangkat peserta, dan seberapa mudah hasil papan tulis dibawa pulang. Ukuran panel tetap harus diperiksa terhadap jarak baris terjauh dengan metode DISCAS; layar sentuh yang huruf presentasinya tidak terbaca dari belakang adalah papan tulis mahal untuk satu orang yang berdiri di depannya.",
    confusedWith:
      "Layar sentuh biasa. Panel interaktif menyertakan perangkat lunak kolaborasi dan pembagian layar; monitor sentuh hanya menyediakan masukan sentuh.",
    related: {
      tools: ["ukuran-layar"],
      terms: ["discas", "usb-bridging", "digital-signage"],
    },
  },
  {
    id: "iscr",
    term: "Kontras Sistem Citra (ISCR)",
    register: {
      pembeli: ["gambarnya pucat", "tulisannya tipis kalau lampu nyala"],
      integrator: ["image system contrast ratio", "ISCR", "kontras sistem"],
      spesifikasi: ["rasio kontras sistem citra mengacu ANSI/AVIXA V201.01"],
    },
    definition:
      "Kontras sistem citra adalah perbandingan antara terang bagian putih dan terang bagian hitam sebagaimana benar-benar terlihat di layar pada ruangan yang sudah menyala, bukan angka kontras di datasheet yang diukur di ruang gelap. Selisih keduanya besar, karena cahaya sekitar yang jatuh ke permukaan layar menaikkan tingkat hitam dan menggerus kontras lebih cepat daripada menambah lumen bisa memperbaikinya. ANSI/AVIXA V201.01 menetapkan cara mengukurnya dan menetapkan target berbeda menurut jenis konten. ACTA tidak mencantumkan angka target di sini: nilai-nilai yang beredar di internet untuk standar ini saling bertentangan dan belum kami verifikasi terhadap dokumen aslinya, jadi kami menyebut standarnya dan menahan angkanya sampai dokumennya dibaca.",
    confusedWith:
      "Rasio kontras di brosur. Angka brosur diukur pada kondisi ideal tanpa cahaya sekitar dan tidak menggambarkan ruangan mana pun yang sedang dipakai.",
    standards: ["ANSI/AVIXA V201.01"],
    related: {
      tools: ["throw-distance-proyektor", "ukuran-layar"],
      terms: ["foot-lambert", "nit", "screen-gain"],
    },
  },
  {
    id: "jarak-kritis",
    term: "Jarak Kritis (Critical Distance)",
    register: {
      pembeli: ["di depan jelas, di belakang tidak", "makin jauh makin tidak jelas"],
      integrator: ["critical distance", "Dc", "jarak kritis"],
      spesifikasi: ["analisis medan langsung terhadap medan pantul pada bidang dengar"],
    },
    definition:
      "Jarak kritis adalah jarak dari loudspeaker ketika energi suara langsung sama besar dengan energi suara pantul ruangan. Di dalam jarak itu, suara didominasi sinyal langsung dan kejelasan bicara tinggi; di luarnya, suara didominasi pantulan dan menambah volume tidak lagi menambah kejelasan karena keduanya naik bersamaan. Nilainya ditentukan direktivitas loudspeaker dan seberapa banyak serapan yang dimiliki ruangan, sehingga ruangan yang bergema punya jarak kritis pendek. Konsekuensi rancangannya langsung: pada ruangan besar yang keras, jawabannya adalah lebih banyak loudspeaker berdaya kecil yang dekat dengan pendengar, bukan sedikit loudspeaker besar dengan penguat yang lebih kuat.",
    confusedWith:
      "Jangkauan loudspeaker. Loudspeaker masih terdengar jauh melewati jarak kritis; yang hilang bukan kekerasan, melainkan kejelasan.",
    related: {
      tools: ["rt60-sabine"],
      terms: ["medan-langsung-pantul", "rt60", "sti-stipa", "ceiling-speaker"],
    },
  },
  {
    id: "kebisingan-latar",
    term: "Kebisingan Latar (NC / NR)",
    register: {
      pembeli: ["AC-nya berisik", "harus mengeraskan suara biar terdengar"],
      integrator: ["background noise", "NC", "NR", "noise criteria"],
      spesifikasi: ["batas kebisingan latar ruangan pada kondisi sistem tata udara beroperasi"],
    },
    definition:
      "Kebisingan latar adalah tingkat bunyi yang ada di ruangan ketika tidak ada kegiatan — didominasi sistem tata udara, peralatan, dan bunyi dari luar. Ia menentukan berapa keras sistem tata suara harus bekerja, dan karena kejelasan bicara ditentukan selisih antara suara dan derau, ruangan dengan kebisingan latar tinggi menghukum setiap desain audio yang dipasang di dalamnya. Kurva NC dan NR meringkas spektrum kebisingan menjadi satu angka dengan bentuk kurva yang berbeda, sehingga keduanya tidak bisa saling dikonversi begitu saja. Nilai batas untuk sebuah proyek ditetapkan di dokumen proyek itu sendiri; yang penting dicantumkan adalah bahwa pengukurannya dilakukan saat sistem tata udara menyala, karena hasil dengan AC mati tidak menggambarkan apa pun.",
    confusedWith:
      "Waktu dengung. Keduanya memengaruhi kejelasan, tetapi kebisingan latar adalah energi tambahan yang masuk, sedangkan waktu dengung adalah energi sistem sendiri yang tertinggal.",
    related: {
      tools: ["rt60-sabine"],
      terms: ["sti-stipa", "db-spl", "insulasi", "rt60"],
    },
  },
  {
    id: "koefisien-serap",
    term: "Koefisien Serap (α)",
    register: {
      pembeli: ["daya serap bahan", "seberapa empuk peredamnya"],
      integrator: ["koefisien absorpsi", "alpha", "absorption coefficient"],
      spesifikasi: ["koefisien serap per pita oktaf menurut ISO 354"],
    },
    definition:
      "Koefisien serap adalah angka antara 0 dan 1 yang menyatakan bagian energi bunyi yang tidak dipantulkan kembali oleh sebuah permukaan. Nilainya bergantung frekuensi, sehingga satu material selalu punya deret nilai per pita oktaf, bukan satu angka. Perbedaan antar pita inilah yang menjelaskan sebagian besar kekecewaan di lapangan: material tipis bisa menyerap hampir semua energi di 2 kHz dan hampir tidak menyerap apa pun di 125 Hz, sehingga ruangan terdengar lebih tumpul tapi ekor bassnya tetap. Nilai yang layak dipakai adalah nilai terukur menurut ISO 354 dari laboratorium, bukan angka pemasaran; nilai di atas 1 yang kadang muncul adalah artefak metode pengukuran, bukan penyerapan lebih dari sempurna.",
    confusedWith:
      "NRC. NRC adalah satu angka rata-rata dari empat pita tengah; α adalah deret lengkapnya dan hanya deret itu yang bisa dipakai menghitung per pita.",
    standards: ["ISO 354"],
    related: {
      tools: ["rt60-sabine"],
      terms: ["nrc", "absorpsi", "sabine-eyring", "rt60"],
    },
  },
  {
    id: "led-display",
    term: "LED Display (Videotron)",
    register: {
      pembeli: ["videotron", "layar LED besar", "megatron"],
      integrator: ["LED display", "direct view LED", "LED wall"],
      spesifikasi: ["layar LED modular dengan pixel pitch dan kelas lingkungan tertentu"],
    },
    definition:
      "LED display adalah layar yang tersusun dari modul-modul berisi LED sebagai piksel yang memancar sendiri, sehingga ukurannya bisa dibangun sesuai kebutuhan dan tidak dibatasi ukuran panel jadi. Karena tiap piksel memancarkan cahaya, layar ini mempertahankan kontras pada ruangan terang dan menjadi pilihan ketika proyektor sudah kehabisan kecerahan. Yang menentukan hasil bukan “berapa inci” melainkan pixel pitch terhadap jarak pandang terdekat, kelas kecerahan terhadap kondisi cahaya, dan sistem pemasangan terhadap akses perawatan. Tiga kata yang dipakai untuk benda yang sama — videotron di sisi pembeli, LED display di datasheet, layar LED di dokumen tender — adalah sumber kesalahpahaman yang rutin muncul saat penawaran dibandingkan.",
    confusedWith:
      "TV LED. Sebuah televisi LCD berlampu latar LED sering disebut “TV LED”, padahal pikselnya tidak memancar sendiri dan ukurannya terbatas pada panel jadi.",
    related: {
      lessons: ["jarak-pandang-ideal-videotron"],
      tools: ["ukuran-layar"],
      terms: ["pixel-pitch", "discas", "nit", "videowall"],
    },
  },
  {
    id: "line-array",
    term: "Line Array",
    register: {
      pembeli: ["speaker gantung panjang", "speaker konser"],
      integrator: ["line array", "column array", "vertical array"],
      spesifikasi: ["loudspeaker susunan vertikal dengan pengendalian pola vertikal"],
    },
    definition:
      "Line array adalah susunan beberapa loudspeaker sejenis pada satu garis vertikal, yang saling menjumlahkan sehingga pola pancarnya menyempit secara vertikal dan tetap lebar secara horizontal. Manfaatnya adalah kendali: energi bisa diarahkan ke bidang pendengar dan dijauhkan dari plafon dan dinding belakang, yang penting justru di ruangan yang bergema. Efek penyempitan itu bergantung frekuensi dan panjang susunannya, jadi array pendek tidak mengendalikan frekuensi rendah. Dalam bentuk column array kecil, prinsip yang sama dipakai di masjid, gereja dan aula dengan langit-langit tinggi, di mana loudspeaker konvensional akan menyemprot lebih banyak energi ke permukaan pantul daripada ke jamaah.",
    confusedWith:
      "Ukuran dan kekerasan. Line array bukan sekadar loudspeaker besar; nilainya ada pada pengendalian arah, dan array yang salah sudut bisa lebih buruk daripada satu kotak yang diarahkan benar.",
    related: {
      tools: ["rt60-sabine"],
      terms: ["jarak-kritis", "medan-langsung-pantul", "penguat-daya", "sti-stipa"],
    },
  },
  {
    id: "lumen",
    term: "Lumen (ANSI / ISO)",
    register: {
      pembeli: ["watt proyektor", "terangnya berapa"],
      integrator: ["lumen", "ANSI lumens", "light output"],
      spesifikasi: ["keluaran cahaya proyektor sesuai ISO 21118"],
    },
    definition:
      "Lumen adalah satuan fluks cahaya total yang dipancarkan proyektor, diukur menurut prosedur yang dinyatakan produsen pada lembar datanya. ISO 21118 mengatur informasi apa yang harus dicantumkan pada lembar data proyektor, termasuk bagaimana angka keluaran cahaya dinyatakan, sehingga angka dari dua produsen dapat dibandingkan hanya bila keduanya mengacu prosedur yang sama. Lumen bukan ukuran seberapa terang layar terlihat: hasil akhirnya harus dibagi luas layar dan disesuaikan gain layar untuk menjadi luminansi. Selain itu keluaran nyata menurun seiring umur sumber cahaya dan mode hemat daya, sehingga perhitungan yang jujur menyisakan cadangan terhadap angka lembar data, bukan memakainya bulat-bulat.",
    confusedWith:
      "Foot-lambert. Lumen adalah keluaran proyektor; foot-lambert adalah terang yang tersisa di layar setelah dibagi luas dan gain.",
    standards: ["ISO 21118"],
    related: {
      tools: ["throw-distance-proyektor"],
      terms: ["foot-lambert", "nit", "screen-gain", "throw-ratio"],
    },
  },
  {
    id: "medan-langsung-pantul",
    term: "Medan Langsung & Medan Pantul",
    register: {
      pembeli: ["suaranya numpuk", "kata-katanya tidak jelas padahal keras"],
      integrator: ["direct field", "reverberant field", "D/R ratio"],
      spesifikasi: ["rasio energi langsung terhadap energi pantul pada posisi pendengar"],
    },
    definition:
      "Medan langsung adalah energi suara yang sampai ke telinga langsung dari loudspeaker, sedangkan medan pantul adalah energi yang sampai setelah memantul dari permukaan ruangan. Keduanya membawa kata yang sama tetapi tidak pada waktu yang sama, sehingga medan pantul menutupi suku kata berikutnya dan menurunkan kejelasan. Perbandingan keduanya di posisi pendengar, bukan tingkat kekerasan totalnya, yang menentukan apakah bicara terdengar jelas. Ini menjelaskan keluhan paling umum di aula dan masjid: sistem terdengar keras dan tetap tidak jelas. Menambah daya menaikkan kedua medan bersamaan; yang mengubah perbandingannya hanya mendekatkan loudspeaker ke pendengar, mengarahkan pola pancarnya, atau menambah serapan di ruangan.",
    confusedWith:
      "Volume. Volume mengubah kekerasan; perbandingan medan langsung terhadap medan pantul mengubah kejelasan, dan keduanya bisa bergerak berlawanan.",
    related: {
      tools: ["rt60-sabine"],
      terms: ["jarak-kritis", "rt60", "sti-stipa", "line-array"],
    },
  },
  {
    id: "mixer",
    term: "Mixer Audio",
    register: {
      pembeli: ["meja mixer", "alat pengatur suara"],
      integrator: ["mixer", "mixing console", "audio console"],
      spesifikasi: ["konsol pencampur audio dengan jumlah kanal masukan tertentu"],
    },
    definition:
      "Mixer audio adalah perangkat yang menggabungkan beberapa sumber audio menjadi satu atau beberapa keluaran, dengan kendali level, perataan nada, dan pengiriman tambahan untuk setiap kanal. Perbedaan pentingnya dengan DSP bukan pada kemampuan memproses, melainkan pada siapa yang mengoperasikan: mixer dirancang untuk operator yang hadir dan menyesuaikan secara langsung, DSP dirancang berjalan sendiri sesuai program. Ruangan yang tidak punya operator tetap tetapi dipasangi mixer besar hampir selalu berakhir dengan kanal yang tidak pernah disentuh, gain yang digeser sembarangan, dan tidak ada yang bisa mengembalikannya ke kondisi semula karena tidak ada berkas konfigurasi untuk dipulihkan.",
    confusedWith:
      "DSP. Mixer memberi kendali langsung kepada manusia; DSP menyimpan keputusan perancang dalam bentuk program yang bisa dipulihkan.",
    related: { terms: ["dsp", "feedback", "penguat-daya", "db-spl"] },
  },
  {
    id: "nit",
    term: "Nit (cd/m²)",
    register: {
      pembeli: ["terangnya layar", "kalau kena matahari kelihatan tidak"],
      integrator: ["nit", "cd/m²", "luminance"],
      spesifikasi: ["luminansi layar dinyatakan dalam cd/m² pada kondisi operasi"],
    },
    definition:
      "Nit adalah nama umum untuk candela per meter persegi, satuan luminansi yang menyatakan seberapa terang sebuah permukaan memancar ke arah pengamat. Untuk layar yang memancar sendiri seperti panel dan LED display, nit adalah angka yang langsung dibandingkan dengan kondisi cahaya ruangan. Untuk proyektor, luminansi tidak melekat pada perangkat melainkan dihasilkan dari lumen dibagi luas layar dan dikalikan gain, sehingga proyektor tidak punya nilai nit yang berdiri sendiri. Satu foot-lambert setara sekitar 3,426 cd/m². Angka nit pada lembar data biasanya nilai puncak pada sebagian kecil layar; nilai yang relevan untuk pekerjaan tender adalah luminansi pada seluruh bidang saat beroperasi terus-menerus.",
    confusedWith:
      "Lumen. Lumen menyatakan cahaya yang dipancarkan sumber; nit menyatakan terang permukaan yang dilihat mata.",
    related: {
      tools: ["throw-distance-proyektor"],
      terms: ["foot-lambert", "lumen", "led-display", "iscr"],
    },
  },
  {
    id: "nrc",
    term: "NRC",
    register: {
      pembeli: ["angka daya serap", "NRC berapa"],
      integrator: ["NRC", "noise reduction coefficient"],
      spesifikasi: ["material penyerap dengan nilai NRC minimum tertentu"],
    },
    definition:
      "NRC adalah satu angka ringkas yang menyatakan rata-rata koefisien serap sebuah material pada empat pita oktaf tengah — 250, 500, 1000 dan 2000 Hz — dibulatkan ke kelipatan 0,05, mengikuti ASTM C423. Kegunaannya adalah membandingkan material secara cepat. Batasnya besar dan sering diabaikan: karena hanya mencakup pita tengah, NRC sama sekali tidak menyatakan apa pun tentang perilaku material di 125 Hz, padahal pita itulah yang menentukan apakah ruangan masih terdengar bulky sesudah dipasang. Menulis nilai NRC minimum di RKS adalah syarat yang bisa diperiksa, tetapi perhitungan waktu dengung tetap harus memakai deret α per pita, bukan angka tunggal NRC.",
    confusedWith:
      "Koefisien serap α. NRC adalah rata-rata empat pita; α adalah nilai per pita, dan hanya α yang bisa masuk ke rumus.",
    standards: ["ASTM C423"],
    related: {
      tools: ["rt60-sabine"],
      terms: ["koefisien-serap", "absorpsi", "rt60"],
    },
  },
  {
    id: "paging",
    term: "Paging",
    register: {
      pembeli: ["pengumuman", "panggilan lewat speaker"],
      integrator: ["paging", "voice announcement", "page zone"],
      spesifikasi: ["sistem panggilan suara dengan pembagian zona dan prioritas"],
    },
    definition:
      "Paging adalah fungsi menyampaikan pengumuman suara langsung ke area tertentu melalui sistem tata suara, dengan pembagian zona dan aturan prioritas yang menentukan apa yang terjadi ketika dua sumber berbicara bersamaan. Kriteria keberhasilannya berbeda dari musik latar: yang diukur adalah kejelasan kata pada titik terjauh dalam zona, bukan kerataan tingkat suara. Karena itu paging menuntut perhatian pada kebisingan latar area, waktu dengung ruang besar seperti lobi dan koridor, dan kendali pola loudspeaker. Sistem yang dirancang hanya untuk musik latar biasanya lulus uji ketika diuji dengan musik dan gagal ketika diuji dengan kalimat, dan uji terakhir itulah yang menentukan.",
    confusedWith:
      "Tata suara darurat. Paging adalah fungsi operasional harian; tata suara darurat punya syarat keandalan, pemantauan jalur dan sertifikasi tersendiri.",
    related: {
      lessons: ["sistem-tata-suara-gedung-bgm-paging-emergency"],
      terms: ["bgm", "tata-suara-darurat", "sti-stipa", "sistem-100v"],
    },
  },
  {
    id: "penguat-daya",
    term: "Penguat Daya (Power Amplifier)",
    register: {
      pembeli: ["ampli", "power", "penguat"],
      integrator: ["power amplifier", "amplifier", "power amp"],
      spesifikasi: ["penguat daya dengan keluaran tegangan konstan dan pemantauan"],
    },
    definition:
      "Penguat daya adalah perangkat yang menaikkan sinyal audio bertingkat rendah menjadi daya listrik yang cukup untuk menggerakkan loudspeaker. Ukuran yang tepat ditentukan dari arah sebaliknya: berapa tingkat tekanan suara yang dibutuhkan di posisi pendengar, berapa sensitivitas loudspeaker, berapa jauh jaraknya, dan berapa cadangan puncak yang harus disisakan agar sinyal tidak terpotong. Membeli penguat yang lebih besar dari kebutuhan tidak membuat sistem lebih jelas, dan membeli yang terlalu kecil menghasilkan pemotongan sinyal yang merusak tweeter lebih sering daripada daya berlebih. Pada distribusi tegangan konstan, yang dijumlahkan adalah daya tap tiap loudspeaker, dengan cadangan terhadap kapasitas penguat.",
    confusedWith:
      "Kekerasan suara. Daya penguat menentukan batas atas, bukan kejelasan; ruangan dan penempatan loudspeaker yang menentukan apakah suara terdengar jelas.",
    related: { terms: ["sistem-100v", "ceiling-speaker", "db-spl", "mixer"] },
  },
  {
    id: "pixel-pitch",
    term: "Pixel Pitch",
    register: {
      pembeli: ["P3, P2.5", "kerapatan titiknya"],
      integrator: ["pixel pitch", "dot pitch"],
      spesifikasi: ["jarak antar pusat piksel LED dinyatakan dalam milimeter"],
    },
    definition:
      "Pixel pitch adalah jarak antar pusat dua piksel bersebelahan pada layar LED, dinyatakan dalam milimeter, dan biasanya ditulis sebagai P diikuti angkanya. Angka yang lebih kecil berarti piksel lebih rapat, sehingga gambar tetap menyatu pada jarak lebih dekat, dan sekaligus berarti lebih banyak LED per meter persegi. Pixel pitch menentukan jarak pandang terdekat yang nyaman, bukan ukuran layar dan bukan ketajaman pada jarak jauh. Beberapa aturan praktis beredar untuk mengubah pitch menjadi jarak pandang minimum, dan hasilnya berbeda-beda; ACTA menentukan ukuran citra dari jarak penonton terjauh dengan metode DISCAS, lalu memakai pitch untuk memeriksa apakah baris terdepan masih melihat gambar yang menyatu.",
    confusedWith:
      "Resolusi. Resolusi adalah jumlah piksel seluruh layar; pixel pitch adalah kerapatannya. Dua layar dengan pitch sama bisa punya resolusi sangat berbeda.",
    related: {
      lessons: ["jarak-pandang-ideal-videotron"],
      tools: ["ukuran-layar"],
      terms: ["led-display", "discas", "videowall"],
    },
  },
  {
    id: "poe",
    term: "PoE (Power over Ethernet)",
    register: {
      pembeli: ["tidak perlu colokan listrik", "listrik lewat kabel LAN"],
      integrator: ["PoE", "PoE+", "PoE++"],
      spesifikasi: ["catu daya melalui kabel jaringan sesuai IEEE 802.3af/at/bt"],
    },
    definition:
      "PoE adalah metode menyalurkan daya listrik bersama data melalui kabel jaringan yang sama, sehingga perangkat seperti kamera, panel sentuh dan titik akses tidak memerlukan stopkontak di tempatnya dipasang. Standarnya berjenjang — IEEE 802.3af, 802.3at, dan 802.3bt — dengan kemampuan daya yang naik pada tiap tingkat; angka daya untuk tiap kelas ada di standar dan di lembar data perangkat, dan keduanya harus dibaca berpasangan karena daya yang tersedia di ujung kabel lebih kecil daripada daya yang dikirim switch. Kegagalan lapangan yang paling umum bukan perangkatnya, melainkan anggaran daya switch yang habis ketika semua port terisi bersamaan.",
    confusedWith:
      "Adaptor pasif “PoE injector” murah. Perangkat pasif tidak melakukan negosiasi kelas dan bisa mengirim tegangan ke perangkat yang tidak mengharapkannya.",
    standards: ["IEEE 802.3af", "IEEE 802.3at", "IEEE 802.3bt"],
    related: { terms: ["hdbaset", "av-over-ip", "control-system", "qos"] },
  },
  {
    id: "qos",
    term: "QoS (Quality of Service)",
    register: {
      pembeli: ["suaranya putus-putus di jaringan", "jaringannya penuh"],
      integrator: ["QoS", "DiffServ", "prioritas trafik"],
      spesifikasi: ["konfigurasi prioritas trafik audio video pada perangkat jaringan"],
    },
    definition:
      "QoS adalah sekumpulan mekanisme pada perangkat jaringan yang menentukan paket mana yang dilayani lebih dulu ketika jalur sedang penuh. Untuk AV over IP dan audio jaringan, dua jenis trafik harus diprioritaskan di atas data biasa: paket sinkronisasi waktu dan paket media, dengan sinkronisasi waktu berada di prioritas tertinggi karena kehilangan jam merusak seluruh aliran sekaligus. QoS tidak menambah kapasitas; ia hanya memutuskan siapa yang mengalah. Karena itu QoS bukan pengganti perencanaan bandwidth dan bukan pengganti pemisahan VLAN. Yang membuatnya gagal di lapangan hampir selalu sama: konfigurasi diterapkan pada sebagian switch saja, sehingga prioritas hilang di satu titik dan seluruh rantai ikut hilang.",
    confusedWith:
      "Bandwidth. Menambah bandwidth mengurangi kemungkinan antrean; QoS mengatur perilaku ketika antrean tetap terjadi.",
    standards: ["IEEE 802.1Q"],
    related: { terms: ["av-over-ip", "dante", "aes67", "poe"] },
  },
  {
    id: "rasio-aspek",
    term: "Rasio Aspek",
    register: {
      pembeli: ["gambarnya ada garis hitam", "layarnya tidak penuh"],
      integrator: ["aspect ratio", "16:9", "16:10"],
      spesifikasi: ["rasio aspek citra dan rasio aspek permukaan tampil"],
    },
    definition:
      "Rasio aspek adalah perbandingan lebar terhadap tinggi sebuah citra atau permukaan tampil. Masalah muncul ketika rasio konten berbeda dari rasio layar: konten yang lebih jangkung dari layar akan menyisakan pita hitam di kiri-kanan, sementara konten yang lebih lebar menyisakan pita di atas-bawah. Konsekuensi teknisnya bukan estetika melainkan ukuran — tinggi citra yang benar-benar terpakai menjadi lebih kecil daripada tinggi panel, sehingga layar yang tampak cukup besar bisa gagal memenuhi syarat keterbacaan untuk baris terjauh. Karena itu perhitungan ukuran layar harus dilakukan pada citra yang aktif, bukan pada diagonal panel yang tertulis di penawaran.",
    confusedWith:
      "Resolusi. Dua layar dengan resolusi berbeda dapat punya rasio aspek sama, dan sebaliknya.",
    related: {
      tools: ["ukuran-layar"],
      terms: ["discas", "pixel-pitch", "videowall"],
    },
  },
  {
    id: "rks",
    term: "RKS",
    register: {
      pembeli: ["dokumen syarat teknis", "spek dari konsultan"],
      integrator: ["RKS", "spesifikasi teknis", "technical specification"],
      spesifikasi: ["Rencana Kerja dan Syarat-syarat", "pekerjaan sistem tata suara"],
    },
    definition:
      "RKS adalah dokumen Rencana Kerja dan Syarat-syarat yang menetapkan mutu, metode kerja, dan syarat penerimaan sebuah pekerjaan, dan menjadi rujukan ketika terjadi perselisihan tentang apa yang seharusnya diserahkan. Untuk pekerjaan AV, RKS yang kuat menyatakan tiga hal yang bisa diperiksa: besaran kinerja yang harus dicapai, standar yang menjadi acuan pengukurannya, dan bukti yang harus diserahkan sebagai syarat pembayaran. RKS yang lemah menyalin daftar fitur dari brosur, sehingga penilaian jatuh pada kemiripan tabel dan penawar yang paling murah menang dengan barang berbeda kelas. Menulis satu baris kriteria terukur beserta cara membuktikannya lebih menentukan hasil daripada sepuluh baris daftar fitur.",
    confusedWith:
      "BoQ. RKS menyatakan sebaik apa; BoQ menyatakan berapa banyak. Keduanya diperlukan, dan hanya RKS yang bisa menolak barang yang tidak memenuhi mutu.",
    related: {
      lessons: ["rks-pekerjaan-tata-suara", "klausul-atau-setara"],
      terms: ["boq", "atau-setara", "commissioning", "sti-stipa"],
    },
  },
  {
    id: "room-system",
    term: "Room System (MTR / Zoom Rooms)",
    register: {
      pembeli: ["ruang rapat Teams", "ruang Zoom", "video conference ruangan"],
      integrator: ["room system", "Microsoft Teams Rooms", "Zoom Rooms"],
      spesifikasi: ["perangkat ruang rapat tersertifikasi untuk platform konferensi tertentu"],
    },
    definition:
      "Room system adalah perangkat konferensi yang terpasang tetap di ruangan dan menjalankan aplikasi rapat secara mandiri, sehingga rapat dimulai dari panel di ruangan itu tanpa perlu laptop siapa pun. Sertifikasi platform berarti kombinasi perangkat itu telah diuji oleh pemilik platform dan mendapat dukungan resmi; ini penting untuk pemeliharaan, karena masalah kompatibilitas jadi punya pemilik yang jelas. Yang berada di luar jangkauan sertifikasi adalah akustik ruangan, penempatan mikrofon dan loudspeaker, dan pencahayaan wajah — tiga hal yang paling menentukan bagaimana peserta jarak jauh menilai kualitas rapat, dan tiga hal yang tidak diperbaiki dengan mengganti merk perangkat.",
    confusedWith:
      "USB bridging. Room system menjalankan rapat sendiri; mode USB menjadikan perangkat ruangan sebagai kamera dan mikrofon untuk laptop tamu.",
    related: { terms: ["usb-bridging", "aec", "beamforming", "control-system"] },
  },
  {
    id: "rt60",
    term: "RT60 (Waktu Dengung)",
    register: {
      pembeli: ["ruangannya bergema", "suaranya mantul", "seperti di dalam gua"],
      integrator: ["reverberation time", "RT60", "T30"],
      spesifikasi: ["waktu dengung ruangan", "akustik ruang menurut ISO 3382-1"],
    },
    definition:
      "RT60 adalah waktu yang dibutuhkan tingkat tekanan suara di sebuah ruangan untuk turun 60 desibel setelah sumber suaranya dihentikan. Nilainya bergantung frekuensi, jadi RT60 yang jujur selalu berupa deret per pita oktaf; satu angka biasanya berarti rata-rata pita 500 Hz dan 1 kHz. RT60 ditentukan volume ruangan dibagi total serapan yang dimilikinya, sehingga ruangan besar berpermukaan keras selalu bergema tanpa memandang perangkat audio yang dipasang. Pengukurannya mengikuti ISO 3382-1. Pentingnya bagi pemilik gedung bersifat langsung: waktu dengung yang terlalu panjang menurunkan kejelasan bicara, dan tidak ada penguat, mikrofon, atau prosesor yang bisa menggantikan perbaikan akustik ruangan.",
    confusedWith:
      "Gema (echo). Gema adalah pantulan tunggal yang terdengar terpisah; dengung adalah peluruhan energi yang menyatu dan tidak bisa dipisahkan telinga.",
    standards: ["ISO 3382-1"],
    related: {
      lessons: ["rt60-akustik-ruang-bergema", "waktu-dengung-ideal-iso-3382"],
      tools: ["rt60-sabine"],
      terms: ["sabine-eyring", "koefisien-serap", "jarak-kritis", "sti-stipa"],
    },
  },
  {
    id: "sabine-eyring",
    term: "Rumus Sabine & Eyring",
    register: {
      pembeli: ["hitungan gema", "rumus akustik"],
      integrator: ["Sabine", "Eyring", "Norris-Eyring"],
      spesifikasi: ["perhitungan waktu dengung dengan metode yang dinyatakan"],
    },
    definition:
      "Rumus Sabine dan rumus Eyring adalah dua cara menghitung waktu dengung dari volume ruangan dan total serapannya. Sabine adalah bentuk yang lebih tua dan lebih sederhana, akurat selama ruangan relatif memantul dan serapannya tersebar merata. Eyring adalah koreksi yang menjadi penting ketika koefisien serap rata-rata ruangan sudah tinggi, karena Sabine mulai memberi nilai yang terlalu panjang di wilayah itu. Batas praktis yang dipakai kalkulator ACTA adalah koefisien serap rata-rata 0,2 — di bawahnya Sabine, di atasnya Eyring — dan model yang dipakai selalu dicetak bersama hasilnya. Keduanya sama-sama mengasumsikan medan suara terdifusi merata, asumsi yang melemah pada ruangan sangat memanjang atau berlangit-langit sangat tinggi.",
    confusedWith:
      "Hasil pengukuran. Rumus memberi perkiraan rancangan; nilai yang mengikat di dokumen kontrak adalah hasil pengukuran menurut ISO 3382-1 di ruangan yang sudah jadi.",
    standards: ["ISO 3382-1"],
    related: {
      tools: ["rt60-sabine"],
      terms: ["rt60", "koefisien-serap", "absorpsi"],
    },
  },
  {
    id: "screen-gain",
    term: "Screen Gain",
    register: {
      pembeli: ["layar yang lebih terang", "layar anti cahaya"],
      integrator: ["screen gain", "ALR screen", "layar bergain"],
      spesifikasi: ["layar proyeksi dengan nilai gain dan sudut pandang efektif"],
    },
    definition:
      "Screen gain adalah perbandingan cahaya yang dipantulkan sebuah layar ke arah pengamat terhadap cahaya yang dipantulkan permukaan putih baur sempurna, sehingga layar dengan gain 1,0 memantulkan merata ke segala arah. Gain di atas satu tidak menambah cahaya; ia memusatkan cahaya yang ada ke sudut yang lebih sempit, sehingga penonton di tengah melihat gambar lebih terang dan penonton di sisi melihat lebih redup. Karena itu gain tinggi adalah pertukaran, bukan peningkatan, dan hanya masuk akal bila susunan tempat duduk memang sempit. Layar penolak cahaya sekitar bekerja dengan prinsip berbeda — mengarahkan penolakan pada cahaya yang datang dari arah tertentu — dan efektivitasnya bergantung dari mana cahaya ruangan datang.",
    confusedWith:
      "Kualitas layar. Gain tinggi bukan penanda mutu; layar gain 1,0 yang rata sering merupakan pilihan yang benar untuk ruangan dengan tempat duduk melebar.",
    related: {
      tools: ["throw-distance-proyektor"],
      terms: ["foot-lambert", "lumen", "iscr", "nit"],
    },
  },
  {
    id: "sistem-100v",
    term: "Sistem 70V / 100V",
    register: {
      pembeli: ["speaker jalur panjang", "speaker gedung"],
      integrator: ["constant voltage", "70V line", "100V line"],
      spesifikasi: ["distribusi tegangan konstan dengan trafo tap pada tiap loudspeaker"],
    },
    definition:
      "Sistem 70V dan 100V adalah metode distribusi audio tegangan konstan, di mana penguat mengeluarkan tegangan tinggi dan tiap loudspeaker memiliki trafo yang menurunkannya sesuai daya yang dipilih lewat tap. Karena tegangan lebih tinggi, arus pada kabel lebih kecil, sehingga rugi pada jalur panjang berkurang dan banyak loudspeaker bisa diparalel pada satu jalur tanpa perhitungan impedansi yang rumit. Pemilihan tap adalah keputusan rancangan, bukan pengaturan volume: total daya seluruh tap dalam satu jalur harus lebih kecil dari kapasitas penguat, dengan cadangan. Kelemahannya adalah trafo membatasi respons frekuensi rendah, yang menjadikannya tepat untuk suara dan musik latar, dan kurang tepat untuk penguatan musik utama.",
    confusedWith:
      "Sistem impedansi rendah. Sistem 8 ohm menghubungkan loudspeaker langsung ke penguat dan cocok untuk jarak pendek dengan jumlah unit sedikit.",
    related: { terms: ["ceiling-speaker", "penguat-daya", "bgm", "paging"] },
  },
  {
    id: "stc-rw",
    term: "STC / Rw",
    register: {
      pembeli: ["angka kedap suara dindingnya", "bocor tidak ke sebelah"],
      integrator: ["STC", "Rw", "sound transmission class"],
      spesifikasi: ["nilai reduksi bunyi partisi dinyatakan dengan Rw atau STC"],
    },
    definition:
      "STC dan Rw adalah dua angka tunggal yang meringkas kemampuan sebuah konstruksi menahan bunyi menembusnya, dihitung dengan mencocokkan kurva reduksi terukur terhadap kurva acuan. STC mengikuti ASTM E413 dan Rw mengikuti ISO 717-1; keduanya memakai kurva acuan yang berbeda sehingga nilainya mirip tetapi tidak identik dan tidak boleh dipertukarkan begitu saja dalam dokumen. Yang lebih penting daripada angkanya adalah bahwa nilai itu berlaku untuk konstruksi laboratorium yang utuh. Di lapangan, hasil sebenarnya ditentukan jalur bunyi yang mengelilingi partisi — celah pintu, rongga di atas plafon, saluran udara — sehingga dinding bernilai tinggi yang berhenti di plafon gantung sering berkinerja seperti dinding bernilai jauh lebih rendah.",
    confusedWith:
      "NRC. NRC menyatakan penyerapan di dalam ruangan; STC dan Rw menyatakan penahanan bunyi antar-ruang.",
    standards: ["ASTM E413", "ISO 717-1"],
    related: { terms: ["insulasi", "absorpsi", "kebisingan-latar"] },
  },
  {
    id: "sti-stipa",
    term: "STI / STIPA",
    register: {
      pembeli: ["suaranya tidak jelas", "pengumumannya tidak kedengaran katanya"],
      integrator: ["STI", "STIPA", "speech transmission index"],
      spesifikasi: ["indeks kejelasan bicara diukur menurut IEC 60268-16"],
    },
    definition:
      "STI adalah indeks kejelasan bicara berskala 0 sampai 1 yang menyatakan seberapa utuh informasi suara bertahan dari sumber sampai telinga pendengar, dan STIPA adalah metode pengukuran cepatnya di lapangan menurut IEC 60268-16. Nilai STI dipengaruhi kebisingan latar, waktu dengung, direktivitas loudspeaker dan pantulan yang tidak terlihat di denah, sehingga ia tidak bisa dihitung dari dimensi ruangan saja. Skala IEC membagi hasilnya menjadi lima tingkat, dan sistem tata suara darurat memiliki syarat nilai minimum yang ditetapkan standar terkait dan dokumen proyeknya. Karena STI adalah satu-satunya kriteria audio yang bisa diverifikasi ulang oleh pihak ketiga, ia adalah kriteria terkuat yang bisa ditulis di RKS.",
    confusedWith:
      "Perkiraan dari perhitungan waktu dengung. Perhitungan RT60 hanya menunjukkan kecenderungan; nilai STI yang mengikat harus diukur di ruangan yang sudah jadi.",
    standards: ["IEC 60268-16"],
    related: {
      tools: ["rt60-sabine"],
      terms: ["rt60", "kebisingan-latar", "tata-suara-darurat", "rks"],
    },
  },
  {
    id: "tata-suara-darurat",
    term: "Tata Suara Darurat (EN 54)",
    register: {
      pembeli: ["speaker kebakaran", "pengumuman evakuasi"],
      integrator: ["voice alarm", "VA system", "EN 54"],
      spesifikasi: ["sistem tata suara darurat dengan pemantauan jalur dan catu daya cadangan"],
    },
    definition:
      "Tata suara darurat adalah sistem yang menyampaikan instruksi evakuasi dan karena itu tunduk pada syarat keandalan yang tidak berlaku bagi sistem tata suara biasa: pemantauan jalur kabel agar putusnya kabel terdeteksi, catu daya cadangan, prioritas mutlak di atas sumber lain, dan komponen yang tersertifikasi untuk fungsi tersebut. Rangkaian standar EN 54 mengatur bagian-bagian sistem alarm kebakaran, termasuk perangkat kendali suara dan loudspeaker. Kejelasan bicara pada kondisi darurat adalah syarat kinerjanya, diukur dengan metode STI menurut IEC 60268-16, dengan nilai minimum yang ditetapkan standar terkait dan dokumen proyek. Sistem BGM yang “bisa juga dipakai untuk pengumuman darurat” tanpa syarat-syarat ini bukan sistem tata suara darurat.",
    confusedWith:
      "Paging. Paging adalah fungsi pengumuman harian; tata suara darurat adalah sistem keselamatan dengan sertifikasi dan pemantauan tersendiri.",
    standards: ["EN 54", "IEC 60268-16"],
    related: {
      lessons: ["sistem-tata-suara-gedung-bgm-paging-emergency"],
      terms: ["paging", "bgm", "sti-stipa", "sistem-100v"],
    },
  },
  {
    id: "throw-ratio",
    term: "Throw Ratio",
    register: {
      pembeli: ["proyektornya taruh di mana", "jaraknya berapa biar pas"],
      integrator: ["throw ratio", "TR", "rasio lempar"],
      spesifikasi: ["rasio jarak lempar terhadap lebar citra sesuai lensa yang dipilih"],
    },
    definition:
      "Throw ratio adalah perbandingan antara jarak lensa ke layar dan lebar citra yang dihasilkan, sehingga jarak pemasangan dapat dihitung langsung dari lebar layar yang diinginkan. Nilai ini melekat pada lensa, bukan pada proyektor, dan proyektor berlensa dapat diganti memiliki rentang bukan satu angka. Perhitungan throw ratio menentukan posisi gantungan, tetapi tidak menentukan tinggi pemasangan: pergeseran lensa dan offset vertikal adalah besaran terpisah yang harus dibaca dari lembar data, dan kalkulator ACTA menyatakan secara eksplisit bahwa keduanya tidak dimodelkan. Rasio di bawah batas tertentu digolongkan ultra short throw, dengan konsekuensi kepekaan terhadap kerataan permukaan layar yang meningkat tajam.",
    confusedWith:
      "Zoom digital. Zoom optik lensa mengubah throw ratio; pembesaran digital hanya memotong piksel dan menurunkan ketajaman.",
    related: {
      tools: ["throw-distance-proyektor"],
      terms: ["ust", "lumen", "foot-lambert", "screen-gain"],
    },
  },
  {
    id: "usb-bridging",
    term: "USB Bridging (BYOD)",
    register: {
      pembeli: ["colok laptop langsung bisa", "bawa laptop sendiri"],
      integrator: ["USB bridging", "BYOD", "USB pass-through"],
      spesifikasi: ["antarmuka USB yang menyajikan kamera dan audio ruangan ke perangkat tamu"],
    },
    definition:
      "USB bridging adalah mode kerja yang menyajikan kamera, mikrofon dan loudspeaker ruangan kepada laptop tamu sebagai perangkat USB biasa, sehingga rapat dapat berjalan dari aplikasi apa pun yang ada di laptop itu. Nilainya adalah kebebasan platform: tamu dari organisasi lain tidak perlu punya akun yang sama. Yang perlu diperiksa adalah rantai fisiknya — panjang kabel USB, kualitas pengulang aktif bila diperlukan, dan apakah satu kabel yang sama juga membawa daya dan tampilan. Ruang rapat yang paling banyak dikeluhkan biasanya bukan yang perangkatnya kurang, melainkan yang punya dua mode kerja berbeda tanpa penanda jelas mana yang sedang aktif.",
    confusedWith:
      "Room system. Room system menjalankan aplikasi rapat sendiri; USB bridging menyerahkan rapat kepada laptop tamu.",
    related: { terms: ["room-system", "aec", "control-system", "interactive-flat-panel"] },
  },
  {
    id: "ust",
    term: "Ultra Short Throw (UST)",
    register: {
      pembeli: ["proyektor nempel dinding", "biar tidak silau kena mata"],
      integrator: ["ultra short throw", "UST", "proyektor jarak sangat dekat"],
      spesifikasi: ["proyektor jarak lempar sangat pendek dengan dudukan dinding"],
    },
    definition:
      "Ultra short throw adalah kelas proyektor dengan throw ratio sangat kecil, yang menghasilkan citra lebar dari jarak beberapa puluh sentimeter di depan layar. Keuntungannya nyata di ruang kelas dan ruang rapat kecil: penyaji tidak menghalangi berkas cahaya dan tidak silau, dan tidak ada gantungan di tengah ruangan. Konsekuensinya adalah sudut datang cahaya yang sangat miring, sehingga kerataan permukaan layar menjadi kritis — gelombang kecil pada layar tarik atau dinding yang tidak rata akan terlihat sebagai bayangan yang tidak muncul pada proyektor biasa. Kalkulator ACTA menggolongkan throw ratio di bawah 0,4 sebagai UST dan menandai kepekaan geometri ini sebagai temuan tersendiri.",
    confusedWith:
      "Short throw. Short throw masih dipasang beberapa meter dari layar; UST dipasang menempel dan menuntut permukaan yang jauh lebih rata.",
    related: {
      tools: ["throw-distance-proyektor"],
      terms: ["throw-ratio", "screen-gain", "interactive-flat-panel"],
    },
  },
  {
    id: "videowall",
    term: "Videowall",
    register: {
      pembeli: ["TV disusun", "layar besar dari beberapa layar"],
      integrator: ["videowall", "video wall controller", "narrow bezel"],
      spesifikasi: ["dinding tampilan tersusun dengan pengendali dan dudukan servis"],
    },
    definition:
      "Videowall adalah susunan beberapa layar yang dikendalikan sebagai satu bidang tampilan, dipakai ketika ukuran yang dibutuhkan melampaui panel tunggal atau ketika beberapa sumber harus tampil bersamaan. Yang menentukan hasil bukan jumlah layar, melainkan tiga hal: lebar bingkai antar-panel yang memotong gambar, pengendali yang memetakan sumber ke susunan, dan dudukan yang memungkinkan satu panel ditarik keluar untuk diservis tanpa membongkar tetangganya. Ketika bingkai antar-panel menjadi masalah bagi konten yang menyatu, alternatifnya adalah LED display yang tidak memiliki bingkai sama sekali. Panel videowall juga berbeda dari televisi dalam siklus pemakaian dan kalibrasi warna antar-unit.",
    confusedWith:
      "LED display. Videowall tersusun dari panel berbingkai; LED display tersusun dari modul tanpa bingkai dan menjadi pilihan ketika garis pemisah tidak dapat diterima.",
    related: {
      tools: ["ukuran-layar"],
      terms: ["led-display", "pixel-pitch", "digital-signage", "av-over-ip"],
    },
  },
];

/* ------------------------------------------------------------------ *
 * Derived views
 * ------------------------------------------------------------------ */

export const GLOSSARY_TERM_COUNT = GLOSSARY_TERMS.length;

export const GLOSSARY_PATH = "/learn/glosarium";

/**
 * Bumped BY HAND on a substantive edit — a new term, a corrected definition, a
 * changed standard reference. Never on a typo fix and never automatically:
 * 02-DATA-SEO §9.5 makes the review date a freshness signal, and an
 * auto-incremented freshness signal is a lie told at scale.
 */
export const GLOSSARY_PUBLISHED_AT = "2026-08-07";
export const GLOSSARY_REVIEWED_AT = "2026-08-07";

/** Section label for each register row. The third register is the specifier
 *  vocabulary — the highest-value cluster in 02-DATA-SEO, and the one that only
 *  exists in Indonesian. */
export const REGISTER_LABEL: Record<keyof GlossaryRegister, string> = {
  pembeli: "Pembeli",
  integrator: "Integrator",
  spesifikasi: "RKS / Tender",
};

export const REGISTER_ORDER: readonly (keyof GlossaryRegister)[] = [
  "pembeli",
  "integrator",
  "spesifikasi",
];

const collator = new Intl.Collator("id", { sensitivity: "base", numeric: true });

/** Uppercase A–Z letter a headword files under. Anything else lands in "#". */
export function glossaryLetter(term: GlossaryTerm): string {
  const first = term.term.replace(/^[^\p{L}\p{N}]+/u, "").charAt(0).toUpperCase();
  return /^[A-Z]$/.test(first) ? first : "#";
}

/** Every term, sorted the way the page prints them. */
export function sortedGlossaryTerms(): readonly GlossaryTerm[] {
  return [...GLOSSARY_TERMS].sort((a, b) => collator.compare(a.term, b.term));
}

/** Terms grouped under their letter, in print order. Letters with no term are
 *  absent — the jump-nav renders those as inert text, never as a dead link. */
export function glossaryGroups(): readonly GlossaryGroup[] {
  const buckets = new Map<string, GlossaryTerm[]>();
  for (const term of sortedGlossaryTerms()) {
    const letter = glossaryLetter(term);
    const bucket = buckets.get(letter);
    if (bucket) bucket.push(term);
    else buckets.set(letter, [term]);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => collator.compare(a, b))
    .map(([letter, terms]) => ({ letter, terms }));
}

/** The full A–Z rail, each letter carrying whether it has any term behind it. */
export function glossaryAlphabet(): readonly { letter: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const group of glossaryGroups()) counts.set(group.letter, group.terms.length);
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => ({
    letter,
    count: counts.get(letter) ?? 0,
  }));
  const other = counts.get("#");
  return other ? [...letters, { letter: "#", count: other }] : letters;
}

/** DOM id of a letter heading. */
export function glossaryLetterAnchor(letter: string): string {
  return letter === "#" ? "huruf-lainnya" : `huruf-${letter.toLowerCase()}`;
}

export function getGlossaryTerm(id: string): GlossaryTerm | undefined {
  return GLOSSARY_TERMS.find((term) => term.id === id);
}

/**
 * Every spelling of a term except its own headword, deduped, order preserved.
 *
 * This is the `alternateName` array in the `DefinedTerm` JSON-LD, and it is the
 * mechanism by which English-register queries ("reverberation time") and
 * buyer-register queries ("ruangan bergema") both land on an Indonesian page —
 * without shipping an English twin site (02-DATA-SEO §8.5, bilingual decision).
 */
export function alternateNames(term: GlossaryTerm): string[] {
  const seen = new Set([term.term.toLowerCase()]);
  const out: string[] = [];
  for (const key of REGISTER_ORDER) {
    for (const name of term.register[key]) {
      const normalised = name.toLowerCase();
      if (seen.has(normalised)) continue;
      seen.add(normalised);
      out.push(name);
    }
  }
  return out;
}

/** First sentence of the definition — the `description` in JSON-LD and the
 *  liftable passage for AI retrieval (02-DATA-SEO §8.6 rule 1). */
export function glossarySummary(term: GlossaryTerm): string {
  const match = term.definition.match(/^[^.]+\./);
  return (match?.[0] ?? term.definition).trim();
}

/**
 * §8.4 caps the inline `hasDefinedTerm` list at 40 refs. Above that the payload
 * stops being a summary of the page and starts being a second copy of it, and
 * Google truncates long inline lists anyway. The cap is applied here rather than
 * at the call site so it cannot be forgotten when the term list grows.
 */
export const DEFINED_TERM_INLINE_CAP = 40;

/** The terms that go into `hasDefinedTerm`, capped. Print order, so the cap
 *  falls at a predictable place instead of an arbitrary one. */
export function inlineDefinedTerms(
  cap: number = DEFINED_TERM_INLINE_CAP,
): readonly GlossaryTerm[] {
  return sortedGlossaryTerms().slice(0, Math.max(0, cap));
}
