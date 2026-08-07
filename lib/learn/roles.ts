// The role axis (02-DATA-SEO-AND-CMS.md §6.3) — three values, frozen.
//
// Stored as reserved values in the existing, GIN-indexed `articles.tags[]`
// (index `articles_tags_gin`), NOT as a Postgres enum: enum values cannot be
// dropped, and five panels proposed five incompatible enums. A fourth role
// costs one string; a rename costs one UPDATE.
//
// The persona axis and the search-vocabulary axis are deliberately the same
// axis — `it-fasilitas` merges into `teknis-internal` because in ~90% of
// Indonesian commercial buildings that is one person.
//
// Role is a CLIENT-SIDE FILTER CHIP on /learn, never a route: /learn/peran/* is
// in RESERVED_LEARN_SLUGS precisely so it can never become one. It earns no
// search traffic, and faceted role URLs would be thin duplicates of the hub.
//
// Two spellings exist and both are load-bearing:
//   • `articles.tags[]`   stores the PREFIXED tag  — "role:teknis-internal"
//   • `learn_paths.role`  stores the BARE id       — "teknis-internal"
// The prefix is what keeps the role axis separable from topic/brand/vocabulary
// tags that already share that column (`['display','absen','digital-signage']`).

export const LEARN_ROLE_TAG_PREFIX = "role:";

export const LEARN_ROLE_IDS = [
  "pengambil-keputusan",
  "teknis-internal",
  "spesifier-pengadaan",
] as const;

export type LearnRoleId = (typeof LEARN_ROLE_IDS)[number];

export const LEARN_ROLE_TAGS = [
  "role:pengambil-keputusan",
  "role:teknis-internal",
  "role:spesifier-pengadaan",
] as const;

export type LearnRoleTag = (typeof LEARN_ROLE_TAGS)[number];

export type LearnRole = {
  /** Bare id — the value stored in `learn_paths.role`. */
  id: LearnRoleId;
  /** Prefixed tag — the value stored in `articles.tags[]`. */
  tag: LearnRoleTag;
  /** Chip label. Title case, Bahasa Indonesia. */
  label: string;
  /** One line, Bahasa Indonesia: who this reader actually is. */
  description: string;
};

export const LEARN_ROLES: readonly LearnRole[] = [
  {
    id: "pengambil-keputusan",
    tag: "role:pengambil-keputusan",
    label: "Pengambil Keputusan",
    description:
      "Pemilik, principal, tim pengadaan, kepala sekolah atau yayasan, dan takmir masjid — yang menandatangani anggaran.",
  },
  {
    id: "teknis-internal",
    tag: "role:teknis-internal",
    label: "Teknis Internal",
    description:
      "IT manager, facility manager, teknisi AV in-house, dan tim multimedia gereja — yang mengoperasikan sistemnya setiap hari.",
  },
  {
    id: "spesifier-pengadaan",
    tag: "role:spesifier-pengadaan",
    label: "Spesifier & Pengadaan",
    description:
      "Arsitek, konsultan MEP, spesifier, dan panitia tender — yang menuliskan RKS dan menilai penawaran.",
  },
];

const BY_ID = new Map<string, LearnRole>(LEARN_ROLES.map((r) => [r.id, r]));
const BY_TAG = new Map<string, LearnRole>(LEARN_ROLES.map((r) => [r.tag, r]));

export function isLearnRoleId(value: string): value is LearnRoleId {
  return BY_ID.has(value);
}

export function isLearnRoleTag(value: string): value is LearnRoleTag {
  return BY_TAG.has(value);
}

/** "teknis-internal" → "role:teknis-internal". */
export function roleTagFor(id: LearnRoleId): LearnRoleTag {
  return `${LEARN_ROLE_TAG_PREFIX}${id}` as LearnRoleTag;
}

/** "role:teknis-internal" → "teknis-internal"; null for anything else. */
export function roleIdFromTag(tag: string): LearnRoleId | null {
  return BY_TAG.get(tag)?.id ?? null;
}

/** Accepts either spelling — a bare id or a prefixed tag. */
export function getLearnRole(idOrTag: string): LearnRole | null {
  return BY_TAG.get(idOrTag) ?? BY_ID.get(idOrTag) ?? null;
}

/**
 * Every role carried by a tags[] array, in the canonical LEARN_ROLES order so
 * two lessons never render their chips in a different sequence.
 * Publish validation (§9.3 rule 10) requires exactly one, but nothing in the
 * database enforces that — read defensively.
 */
export function rolesFromTags(tags: readonly string[] | null | undefined): LearnRole[] {
  if (!tags || tags.length === 0) return [];
  const present = new Set(tags);
  return LEARN_ROLES.filter((r) => present.has(r.tag));
}

/** The single role a lesson is written for, or null if the tag is missing. */
export function primaryRoleFromTags(tags: readonly string[] | null | undefined): LearnRole | null {
  return rolesFromTags(tags)[0] ?? null;
}

export function hasLearnRole(
  tags: readonly string[] | null | undefined,
  role: LearnRoleId | LearnRoleTag,
): boolean {
  const resolved = getLearnRole(role);
  if (!resolved || !tags) return false;
  return tags.includes(resolved.tag);
}

/**
 * The non-role remainder of tags[] — topic, brand and vocabulary values. Use
 * this anywhere raw tags are rendered, so the machine-readable role axis never
 * leaks into a reader-facing chip row as "role:teknis-internal".
 */
export function tagsWithoutRoles(tags: readonly string[] | null | undefined): string[] {
  if (!tags) return [];
  return tags.filter((t) => !isLearnRoleTag(t));
}

/**
 * Filter any tagged row by role. Client-side only — this is the /learn hub chip,
 * and it must never gate, reorder or hide indexable text (§6.5 constraint 3):
 * Googlebot always sees the unfiltered list.
 */
export function filterByLearnRole<T extends { tags: readonly string[] | null }>(
  rows: readonly T[],
  role: LearnRoleId | LearnRoleTag | null,
): T[] {
  if (!role) return [...rows];
  const resolved = getLearnRole(role);
  if (!resolved) return [...rows];
  return rows.filter((row) => Boolean(row.tags?.includes(resolved.tag)));
}
