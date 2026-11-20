// Translate the published defaults by value so future CMS edits still reach the page.
const copy: Record<string, string> = {
  "A Solution for Every Space.": "AV Systems by Space",
  "Delapan tipe ruang, satu standar perancangan.":
    "Select a space to see how its layout and daily use shape the audio, video and control design.",
  "Professional Gear, Curated by Need.": "Equipment Catalog",
  "Jelajahi katalog perangkat berdasarkan kategori — dan minta penawaran untuk kebutuhan Anda.":
    "Browse equipment by function, compare specifications and request a quote for your project.",
  "Ruang rapat hybrid yang siap pakai dalam satu sentuhan — audio, video, dan kontrol terintegrasi penuh.":
    "Start a hybrid meeting from one control panel, with cameras, sound and displays working together.",
  "Sistem audio visual auditorium yang dirancang dari akustik ruangan, bukan dari daftar perangkat.":
    "Sound coverage and display placement designed around the hall.",
  "Satu ballroom, banyak acara paralel — routing audio per zona yang mengikuti sekat, tanpa teknisi tambahan.":
    "Audio zones follow the partitions as rooms divide or combine.",
  "BGM, paging, dan emergency announcement satu backbone untuk seluruh gedung komersial.":
    "Distribute music, paging and announcements throughout a building.",
  "Ruang belajar interaktif yang membuat materi sampai ke setiap kursi — onsite maupun remote.":
    "Bring teaching materials to learners in the room and online.",
  "Room Smart Meeting Room dengan sistem audio visual terintegrasi untuk ruang rapat hybrid, video conference, display interaktif, dan solusi AV kantor di Indonesia.":
    "Meeting room with a conference camera and interactive display",
  "Auditorium modern dengan sistem audio visual profesional, LED wall, line array speaker, akustik ruangan, dan solusi AV auditorium di Indonesia.":
    "Auditorium with a stage display and suspended loudspeakers",
  "Ballroom divisible dengan sistem audio visual terintegrasi, audio zonasi, movable partition, dan solusi AV multipurpose hall untuk hotel dan convention center di Indonesia.":
    "Multipurpose ballroom with partitioned event areas",
  "Sound System Sistem Public Address (PA System) dan Commercial Sound untuk gedung, kantor, mall, hotel, rumah sakit, sekolah, dan fasilitas komersial di Indonesia.":
    "Public address equipment for commercial buildings",
  "Smart Classroom dengan display interaktif, sistem audio visual pembelajaran, hybrid learning, dan solusi ruang training modern di Indonesia.":
    "Training room with an interactive teaching display",
  "Sistem audio visual House of Worship dengan LED display, sound system profesional, live streaming, dan solusi AV rumah ibadah di Indonesia.":
    "Worship space with a sound system and video display",
  "Studio broadcast dan podcast profesional dengan sistem audio visual, akustik ruangan, kamera, lighting, dan solusi produksi konten di Indonesia":
    "Broadcast studio with microphones, cameras and lighting",
  "Entertainment Venue Sports arena dan entertainment venue dengan LED display, sound system stadion, digital signage, dan solusi audio visual venue olahraga di Indonesia.":
    "Sports venue with displays and a stadium sound system",
  "Layar profesional, videowall, dan panel interaktif.":
    "Professional displays, video walls and interactive panels.",
  "Loudspeaker, mixer, DSP, dan sistem tata suara.":
    "Loudspeakers, mixers and digital signal processors for sound reinforcement.",
  "PTZ camera profesional untuk video conference, live streaming, auditorium, ruang rapat, dan sistem produksi dengan kontrol pan, tilt, dan zoom presisi.":
    "Pan, tilt and zoom cameras for conferencing, live streaming and production.",
  "Kamera, bar konferensi, dan perangkat kolaborasi ruang rapat.":
    "Cameras, video bars and collaboration equipment for meeting rooms.",
  "Panel kontrol, prosesor, dan otomasi ruangan.":
    "Control panels, processors and room automation equipment.",
  "Media player dan sistem signage untuk konten dinamis.":
    "Media players and signage systems for managing display content.",
  "Switch, AV-over-IP, dan perangkat distribusi sinyal.":
    "Network switches, AV-over-IP equipment and signal distribution hardware.",
};

export function homepageEquipmentCopy(value: string | null | undefined, fallback = "") {
  const source = value?.trim();
  return source ? copy[source] ?? source : fallback;
}
