// ACTA retired acoustic services in November 2026. These exact published/seed
// defaults describe that former commercial offer; translate them at the read
// boundary without modifying CMS records or educational acoustics resources.
const RETIRED_COPY = new Map<string, string>([
  [
    "Sistem audio visual auditorium yang dirancang dari akustik ruangan, bukan dari daftar perangkat.",
    "Sistem tata suara, mikrofon dan display untuk auditorium dan pertunjukan.",
  ],
  [
    "Tuned to the room, not to a spec sheet.",
    "Audio, video and control for every event.",
  ],
  [
    "Sistem Audio Auditorium & Performance Hall — Desain Akustik | ACTA",
    "Sistem Audio Visual Auditorium & Performance Hall | ACTA",
  ],
  [
    "Sistem audio visual auditorium yang dirancang dari akustik ruangan. ACTA merancang, memasang, dan merawat sistem untuk auditorium dan gedung serbaguna.",
    "ACTA merancang, memasang, dan merawat sistem tata suara, mikrofon, display dan kontrol untuk auditorium dan gedung serbaguna.",
  ],
  [
    "Site survey, analisis kebutuhan akustik ruang, system design & drawing.",
    "Site survey, analisis kebutuhan audio visual, system design & drawing.",
  ],
  [
    "Tell us about your auditorium — we design from the room's acoustics.",
    "Tell us about your auditorium — we plan its audio, video and control.",
  ],
  [
    "Ceritakan kebutuhan auditorium Anda — kami rancang sistemnya dari akustik ruang.",
    "Ceritakan kebutuhan auditorium Anda — kami rancang sistem audio, visual dan kontrolnya.",
  ],
  [
    "Kami mulai dari kebutuhan dan ruang Anda, bukan dari katalog. Analisis fungsi, akustik, dan anggaran menghasilkan desain sistem yang tepat ukuran — tidak kurang, tidak berlebihan.",
    "Kami mulai dari kebutuhan dan ruang Anda, bukan dari katalog. Analisis fungsi, konektivitas, dan anggaran menjadi dasar desain sistem audio visual.",
  ],
  [
    "Kami analisis ruang, akustik, dan cara tim Anda bekerja — lalu merancang sistem tepat ukuran. Tidak kurang, tidak berlebihan.",
    "Kami analisis ruang, konektivitas, dan cara tim Anda bekerja — lalu merancang sistem audio visual sesuai kebutuhan.",
  ],
  [
    "Auditorium modern dengan sistem audio visual profesional, LED wall, line array speaker, akustik ruangan, dan solusi AV auditorium di Indonesia.",
    "Auditorium dengan LED wall, line array speaker, dan sistem audio visual terintegrasi.",
  ],
  [
    "Studio broadcast dan podcast profesional dengan sistem audio visual, akustik ruangan, kamera, lighting, dan solusi produksi konten di Indonesia",
    "Studio broadcast dan podcast dengan mikrofon, kamera, lighting, dan sistem audio visual untuk produksi konten.",
  ],
]);

/** Exact-source replacement only: unknown author copy and all non-copy values survive. */
export function normalizeCommercialCopy<T>(value: T): T {
  if (typeof value === "string") return (RETIRED_COPY.get(value) ?? value) as T;
  if (Array.isArray(value)) return value.map(normalizeCommercialCopy) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, normalizeCommercialCopy(child)]),
    ) as T;
  }
  return value;
}

/** Applied only to commercial solution records, never Learn records or calculators. */
export function normalizeCommercialSolution<T>(solution: T): T {
  const result = normalizeCommercialCopy(solution);
  if (!result || typeof result !== "object") return result;
  const record = result as Record<string, unknown>;
  if (Array.isArray(record.tags)) {
    record.tags = record.tags.filter((tag) => tag !== "acoustics");
  }
  if (Array.isArray(record.hero_annotations)) {
    record.hero_annotations = record.hero_annotations.filter((annotation) => {
      if (!annotation || typeof annotation !== "object") return true;
      const label = (annotation as { label?: unknown }).label;
      return typeof label !== "string" || !/^RT60\b/i.test(label.trim());
    });
  }
  return result;
}
