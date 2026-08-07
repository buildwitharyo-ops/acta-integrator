/**
 * The three-register synonym bridge (03 §11.5, 02 §8.6).
 *
 * This map is the whole feature. Indonesian commercial AV is named three
 * different ways by three different people, and none of them is wrong:
 *
 *   BUYER      what the person signing the PO calls it   videotron · toa · infocus
 *   INTEGRATOR what the installer calls it               LED display · loudspeaker · proyektor
 *   VENDOR     what the datasheet calls it               LED wall · line array · DLP projector
 *
 * A reader searches in whichever register they own, and no Indonesian competitor
 * bridges them. It is also the half of the problem that CANNOT be solved
 * server-side at any price: a Postgres synonym dictionary lives in
 * `$SHAREDIR/tsearch_data`, which managed Supabase does not expose. Hence
 * client-side search, and hence this file.
 *
 * Applied QUERY-SIDE ONLY — expand the query, never bloat the index. Expanding
 * the index would make every document match every register and destroy ranking;
 * expanding the query costs one Set union per keystroke.
 *
 * Misspellings are deliberate, not sloppiness. `vidiotron`, `spiker` and
 * `in focus` are what people actually type, and ranking competitors target the
 * misspelling on purpose.
 *
 * Editing rules:
 *   • a term belongs to exactly ONE cluster — overlapping clusters make an
 *     expansion transitive and eventually every query matches everything;
 *   • add the truncation people actually type (`pengeras`, not only
 *     `pengeras suara`), because phrase matching is whole-phrase;
 *   • never add a generic head noun on its own (`suara`, `sistem`, `ruang`).
 */

import { normalize, stemVariants } from "@/lib/learn/search/stem";

export type SynonymCluster = {
  /** Stable id. Also the canonical, integrator-register spelling. */
  id: string;
  /** Every spelling that should retrieve the same documents. */
  terms: readonly string[];
};

export const SYNONYM_CLUSTERS: readonly SynonymCluster[] = [
  {
    id: "led-display",
    terms: [
      "led display",
      "layar led",
      "led wall",
      "videowall",
      "video wall",
      "videotron",
      "vidiotron",
      "megatron",
      "display led",
      "panel led",
      "running text",
    ],
  },
  {
    id: "tata-suara",
    terms: [
      "tata suara",
      "sistem tata suara",
      "sound system",
      "sound sistem",
      "sistem audio",
      "audio system",
      "public address",
      "pa system",
      "paging",
    ],
  },
  {
    id: "rt60",
    terms: [
      "rt60",
      "waktu dengung",
      "dengung",
      "bergaung",
      "gaung",
      "gema",
      "menggema",
      "ngiang",
      "reverberation",
      "reverberation time",
      "reverb",
      "waktu pantul",
    ],
  },
  {
    id: "loudspeaker",
    terms: [
      "loudspeaker",
      "speaker",
      "spiker",
      "pengeras suara",
      "pengeras",
      "toa",
      "corong",
      "ceiling speaker",
      "speaker plafon",
      "line array",
      "column speaker",
      "speaker kolom",
    ],
  },
  {
    id: "ruang-rapat",
    terms: [
      "ruang rapat",
      "ruang meeting",
      "meeting room",
      "ruang konferensi",
      "video conference",
      "videoconference",
      "vicon",
      "vidcon",
      "zoom room",
      "teams room",
      "uc room",
      "ruang rapat hybrid",
      "hybrid meeting",
    ],
  },
  {
    id: "layar-sentuh",
    terms: [
      "layar sentuh",
      "interactive flat panel",
      "ifp",
      "papan interaktif",
      "panel interaktif",
      "touchscreen",
      "touch screen",
      "smart board",
      "papan tulis digital",
      "smart tv interaktif",
    ],
  },
  {
    id: "proyektor",
    terms: [
      "proyektor",
      "projector",
      "infocus",
      "in focus",
      "lcd projector",
      "dlp",
      "laser projector",
      "proyektor laser",
      "short throw",
      "ultra short throw",
    ],
  },
  {
    id: "layar-proyeksi",
    terms: [
      "layar proyeksi",
      "projection screen",
      "screen proyektor",
      "layar tarik",
      "motorized screen",
      "layar motorized",
      "tripod screen",
      "layar gulung",
    ],
  },
  {
    id: "rks",
    terms: [
      "rks",
      "spesifikasi teknis",
      "spek teknis",
      "spesifikasi",
      "rab",
      "boq",
      "bill of quantity",
      "dokumen tender",
      "tender",
      "lelang",
      "pengadaan",
      "e katalog",
      "lpse",
      "kak",
      "tor",
    ],
  },
  {
    id: "instalasi",
    terms: [
      "instalasi",
      "pemasangan",
      "pasang",
      "integrasi",
      "install",
      "setting",
      "setup",
      "komisioning",
      "commissioning",
      "serah terima",
    ],
  },
  {
    id: "mikrofon",
    terms: [
      "mikrofon",
      "microphone",
      "mic",
      "mik",
      "mikropon",
      "wireless mic",
      "mic wireless",
      "clip on",
      "clipon",
      "lavalier",
      "headset mic",
      "handheld",
      "mic jepit",
      "mic meja",
      "gooseneck",
    ],
  },
  {
    id: "amplifier",
    terms: [
      "amplifier",
      "power amplifier",
      "penguat",
      "penguat daya",
      "ampli",
      "amply",
      "power amp",
      "class d",
    ],
  },
  {
    id: "mixer",
    terms: [
      "mixer",
      "audio mixer",
      "mixer audio",
      "mixing console",
      "konsol audio",
      "dsp",
      "audio dsp",
      "prosesor audio",
      "digital signal processor",
      "matrix audio",
    ],
  },
  {
    id: "kamera",
    terms: [
      "kamera",
      "camera",
      "ptz",
      "kamera ptz",
      "webcam",
      "kamera konferensi",
      "conference camera",
      "kamera tracking",
      "auto framing",
    ],
  },
  {
    id: "ukuran-layar",
    terms: [
      "ukuran layar",
      "jarak pandang",
      "viewing distance",
      "screen size",
      "diagonal layar",
      "discas",
      "avixa discas",
      "tinggi huruf",
      "farthest viewer",
      "sudut pandang",
    ],
  },
  {
    id: "akustik",
    terms: [
      "akustik",
      "peredam",
      "peredam suara",
      "penyerap suara",
      "panel akustik",
      "acoustic panel",
      "absorpsi",
      "koefisien serap",
      "kedap suara",
      "soundproofing",
      "insulasi suara",
      "difuser",
    ],
  },
  {
    id: "kejelasan-suara",
    terms: [
      "kejelasan suara",
      "sti",
      "stipa",
      "speech intelligibility",
      "intelligibility",
      "alcons",
      "suara tidak jelas",
      "suara bulet",
      "tidak terdengar jelas",
    ],
  },
  {
    id: "aula",
    terms: [
      "aula",
      "auditorium",
      "gedung serbaguna",
      "gsg",
      "ballroom",
      "hall",
      "ruang serbaguna",
      "gor",
      "convention hall",
    ],
  },
  {
    id: "tempat-ibadah",
    terms: [
      "masjid",
      "mushola",
      "musala",
      "musholla",
      "gereja",
      "church",
      "tempat ibadah",
      "rumah ibadah",
      "vihara",
      "pura",
    ],
  },
];

/** Multi-word terms, matched as whole phrases inside the normalized query. */
const PHRASE_TO_CLUSTER = new Map<string, string>();
/** Single-word terms, indexed under every stem variant so `pengeras` finds them. */
const TOKEN_TO_CLUSTER = new Map<string, string>();

for (const cluster of SYNONYM_CLUSTERS) {
  for (const raw of cluster.terms) {
    const term = normalize(raw);
    if (!term) continue;
    if (term.includes(" ")) {
      if (!PHRASE_TO_CLUSTER.has(term)) PHRASE_TO_CLUSTER.set(term, cluster.id);
      continue;
    }
    for (const variant of stemVariants(term)) {
      if (!TOKEN_TO_CLUSTER.has(variant)) TOKEN_TO_CLUSTER.set(variant, cluster.id);
    }
  }
}

const BY_ID = new Map<string, SynonymCluster>(SYNONYM_CLUSTERS.map((c) => [c.id, c]));

/** Hard ceiling on how many extra phrases one query may pull in. */
const MAX_EXPANSION = 48;

/**
 * Cluster ids a query touches. A phrase match is checked on whole-token
 * boundaries (` led display ` inside ` layar led display besar `), so `pa`
 * cannot fire on `pada` and `mic` cannot fire on `micro`.
 */
export function clusterIdsFor(query: string): string[] {
  const normalized = normalize(query);
  if (!normalized) return [];
  const padded = ` ${normalized} `;
  const ids = new Set<string>();

  for (const [phrase, id] of PHRASE_TO_CLUSTER) {
    if (padded.includes(` ${phrase} `)) ids.add(id);
  }
  for (const token of normalized.split(" ")) {
    for (const variant of stemVariants(token)) {
      const id = TOKEN_TO_CLUSTER.get(variant);
      if (id) {
        ids.add(id);
        break;
      }
    }
  }
  return Array.from(ids);
}

/** Every spelling in a cluster, normalized. Empty for an unknown id. */
export function clusterTerms(id: string): readonly string[] {
  const cluster = BY_ID.get(id);
  if (!cluster) return [];
  return cluster.terms.map((t) => normalize(t)).filter(Boolean);
}

export type QueryExpansion = {
  /** Normalized query, exactly as the matcher will use it. */
  query: string;
  /** Cluster ids the query touched. */
  clusters: string[];
  /**
   * Normalized alternative spellings to try IN ADDITION to the query itself.
   * Never contains a term already present in the query, so a synonym hit is
   * always a genuinely different register and can be scored lower on purpose.
   */
  terms: string[];
};

/**
 * Expand a raw query into the other two registers.
 *
 * `expandQuery("videotron")` → `led display`, `layar led`, `led wall`, …
 * `expandQuery("gema")`      → `rt60`, `waktu dengung`, `reverberation`, …
 */
export function expandQuery(query: string): QueryExpansion {
  const normalized = normalize(query);
  const clusters = clusterIdsFor(normalized);
  if (clusters.length === 0) return { query: normalized, clusters, terms: [] };

  const padded = ` ${normalized} `;
  const terms: string[] = [];
  const seen = new Set<string>();
  for (const id of clusters) {
    for (const term of clusterTerms(id)) {
      if (seen.has(term)) continue;
      seen.add(term);
      if (padded.includes(` ${term} `)) continue;
      terms.push(term);
      if (terms.length >= MAX_EXPANSION) return { query: normalized, clusters, terms };
    }
  }
  return { query: normalized, clusters, terms };
}
