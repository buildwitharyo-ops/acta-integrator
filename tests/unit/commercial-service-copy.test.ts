import { describe, expect, it } from "vitest";
import { normalizeCommercialCopy, normalizeCommercialSolution } from "@/lib/commercial-service-copy";

describe("retired acoustic service copy", () => {
  it("keeps the commercial card, metadata, service description and scope consistent", () => {
    const input = {
      value_prop: "Sistem audio visual auditorium yang dirancang dari akustik ruangan, bukan dari daftar perangkat.",
      seo_title: "Sistem Audio Auditorium & Performance Hall — Desain Akustik | ACTA",
      seo_description: "Sistem audio visual auditorium yang dirancang dari akustik ruangan. ACTA merancang, memasang, dan merawat sistem untuk auditorium dan gedung serbaguna.",
      hero_annotations: [{ label: "RT60 0.9S" }, { label: "SPL 102DB" }],
      tags: ["auditorium", "acoustics"],
      sections: [{ items: [{ description: "Site survey, analisis kebutuhan akustik ruang, system design & drawing." }] }],
    };
    const output = normalizeCommercialSolution(input);
    expect(JSON.stringify(output)).not.toMatch(/akust|acoust|rt60/i);
    expect(output.hero_annotations).toEqual([{ label: "SPL 102DB" }]);
    expect(output.tags).toEqual(["auditorium"]);
    expect(output.value_prop).toContain("mikrofon dan display");
    expect(input.hero_annotations).toHaveLength(2);
    expect(input.tags).toContain("acoustics");
  });

  it("preserves unrelated custom author copy and technical references", () => {
    const input = {
      title: "A custom auditorium project",
      signal_chain: [{ label: "DSP", sublabel: "Audio processing" }],
      educationalNote: "RT60 measures reverberation decay; see the acoustics calculator.",
      metadata: null,
      enabled: true,
    };
    expect(normalizeCommercialCopy(input)).toEqual(input);
  });

  it("normalizes an exact old About scope independently of its order", () => {
    const steps = [
      { title: "Supply", description: "Custom procurement scope." },
      { title: "Consultation", description: "Kami mulai dari kebutuhan dan ruang Anda, bukan dari katalog. Analisis fungsi, akustik, dan anggaran menghasilkan desain sistem yang tepat ukuran — tidak kurang, tidak berlebihan." },
    ];
    const output = normalizeCommercialCopy(steps);
    expect(output[0]).toEqual(steps[0]);
    expect(output[1]?.description).toContain("konektivitas");
    expect(output[1]?.title).toBe("Consultation");
  });
});
