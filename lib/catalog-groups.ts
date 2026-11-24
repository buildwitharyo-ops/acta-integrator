type CatalogIdentity = {
  category_slug: string | null;
  product_type_slug: string | null;
};

type Group = {
  slug: string;
  label: string;
  priority: 0 | 1 | 2;
  types: string[];
};

const group = (slug: string, label: string, priority: Group["priority"], types: string): Group => ({
  slug, label, priority, types: types.split(" "),
});

const groupsByCategory: Record<string, Group[]> = {
  audio: [
    group("speakers", "Speaker", 0, "active-loudspeaker active-speaker passive-loudspeaker passive-speaker ceiling-speaker ceiling-subwoofer column-speaker environmental-speaker horn-speaker line-array-speaker pendant-speaker point-source-speaker studio-monitor subwoofer surface-mount-speaker wall-mount-speaker wedge-monitor"),
    group("microphones", "Mikrofon", 0, "conference-microphone digital-paging-microphone dynamic-microphone dynamic-paging-microphone headworn-microphone lavalier-microphone matrix-paging-microphone measurement-microphone vocal-microphone wireless-microphone wireless-microphone-system"),
    group("audio-dsp", "DSP & Pemrosesan", 0, "audio-dsp-matrix audio-matrix-processor digital-loudspeaker-management-system loudspeaker-management-system dsp-processor modular-audio-system"),
    group("mixers", "Mixer Audio", 0, "digital-mixer analog-mixer powered-mixer"),
    group("amplifiers", "Amplifier", 0, "power-amplifier pa-mixer-amplifier"),
    group("stageboxes", "Stagebox & I/O", 1, "dante-stagebox digital-stagebox network-audio-interface"),
    group("audio-monitoring", "Monitoring Audio", 1, "in-ear-monitoring-system iem-receiver iem-transmitter monitoring-headphone"),
    group("audio-accessories", "Aksesori Audio & RF", 2, "antenna-booster antenna-combiner antenna-divider antenna-splitter audio-control-interface audio-expansion-card audio-level-converter audio-module audio-signal-converter audio-wall-panel charging-station di-box digital-wireless-bodypack-transmitter digital-wireless-handheld-transmitter digital-wireless-plug-on-transmitter digital-wireless-receiver-dante external-antenna line-array-fly-frame microphone-capsule microphone-phantom-adapter microphone-splitter rack-mount-kit speaker-wall-bracket wireless-audio-transmitter wireless-bodypack-transmitter wireless-handheld-microphone-transmitter wireless-instrument-system wireless-mic-antenna wireless-mic-battery wireless-mic-battery-charger wireless-mic-receiver"),
    group("audio-cables", "Kabel Audio & RF", 2, "antenna-cable instrument-cable"),
  ],
  "video-processing": [
    group("video-switching", "Switcher & Matriks", 0, "all-in-one-production-switcher hdmi-matrix-switcher hdmi-switcher streaming-video-switcher video-switcher"),
    group("video-presentation", "Switcher Presentasi & BYOM", 0, "byom-switcher presentation-switcher"),
    group("video-distribution", "Distribusi Video & HDBaseT", 1, "hdbaset-extender-kit hdbaset-receiver hdbaset-transmitter hdmi-extender hdmi-splitter"),
    group("video-accessories", "Aksesori Video & USB", 2, "hdmi-adapter hdmi-audio-embedder hdmi-repeater ip-to-usb-converter usb-converter usb-extender"),
    group("video-cables", "Kabel Video & USB", 2, "displayport-cable hdmi-cable usb-cable"),
  ],
  "ptz-camera": [
    group("ptz-cameras", "Kamera PTZ", 0, "ptz-camera"),
    group("camera-controllers", "Kontroler Kamera", 1, "ptz-camera-controller"),
  ],
  display: [
    group("interactive-displays", "Layar Interaktif", 0, "interactive-flat-panel"),
    group("projectors", "Proyektor", 0, "projector"),
    group("commercial-displays", "Layar Komersial & LED", 0, "commercial-display led-display video-wall-display"),
    group("display-presentation", "Presentasi Nirkabel", 1, "wireless-presentation-system"),
    group("display-accessories", "Aksesori Display", 2, "mobile-display-stand monitor-arm monitor-arm-accessory ops-computer"),
  ],
  "conferencing-collaboration": [
    group("video-bars", "Video Bar", 0, "video-bar"),
    group("conference-cameras", "Kamera Konferensi", 0, "conference-camera"),
    group("conference-audio", "Audio Konferensi", 0, "gooseneck-conference-microphone speakerphone"),
    group("room-schedulers", "Reservasi Ruang", 1, "room-scheduler"),
  ],
  "infrastructure-networking": [
    group("network-switches", "Switch Jaringan", 0, "network-switch"),
    group("av-over-ip", "AV over IP", 0, "av-over-ip-controller av-over-ip-decoder av-over-ip-encoder av-over-ip-transceiver"),
    group("routers", "Router", 1, "network-router"),
    group("network-accessories", "Aksesori Jaringan", 2, "network-adapter sfp-module sfp-port-blocker usb-extender"),
  ],
  "control-system": [
    group("system-controllers", "Prosesor & Panel Kontrol", 0, "control-keypad control-processor touch-panel"),
    group("control-accessories", "Aksesori Kontrol", 2, "relay-expansion-module touch-panel-mounting-bracket wallplate-back-box"),
  ],
  "digital-signage": [
    group("signage-players", "Media Player", 0, "media-player"),
  ],
};

const allGroups = Object.values(groupsByCategory).flat();
const globalGroups = [
  { slug: "audio-accessories", label: "Aksesori Audio", groups: ["audio-accessories"] },
  { slug: "video-accessories", label: "Aksesori Video", groups: ["video-accessories", "display-accessories"] },
  { slug: "cabling", label: "Kabel", groups: ["audio-cables", "video-cables"] },
];
const fallback = { slug: "other", label: "Lainnya", priority: 1, types: [] } satisfies Group;
const groupLabels = new Map([...allGroups, fallback, ...globalGroups].map(({ slug, label }) => [slug, label]));

function productGroup(product: CatalogIdentity): Group {
  return groupsByCategory[product.category_slug ?? ""]?.find(
    ({ types }) => product.product_type_slug && types.includes(product.product_type_slug),
  ) ?? fallback;
}

export function catalogGroupLabel(slug: string) {
  return groupLabels.get(slug);
}

export function matchesCatalogGroup(product: CatalogIdentity, slug: string | null, category?: string | null) {
  if (!slug) return true;
  const actual = productGroup(product).slug;
  if (category) return actual === slug;
  const aggregate = globalGroups.find((g) => g.slug === slug);
  return aggregate ? aggregate.groups.includes(actual) : actual === slug;
}

export function catalogGroupChoices(products: CatalogIdentity[], category: string | null) {
  if (!category) {
    return globalGroups.filter((g) => products.some((p) => matchesCatalogGroup(p, g.slug)));
  }
  const available = new Set(products.filter((p) => p.category_slug === category).map((p) => productGroup(p).slug));
  return [...(groupsByCategory[category] ?? []), fallback].filter((g) => available.has(g.slug));
}

export function catalogProductPriority(product: CatalogIdentity) {
  return productGroup(product).priority;
}

type RankedProduct = CatalogIdentity & {
  is_featured: boolean | null;
  created_at: string | null;
  slug?: string | null;
};

export function compareCatalogPriority(a: RankedProduct, b: RankedProduct) {
  return catalogProductPriority(a) - catalogProductPriority(b)
    || Number(!!b.is_featured) - Number(!!a.is_featured)
    || (b.created_at ?? "").localeCompare(a.created_at ?? "")
    || (a.slug ?? "").localeCompare(b.slug ?? "");
}
