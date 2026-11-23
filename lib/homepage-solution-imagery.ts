// Recovered, not regenerated: the eight owner-approved concept masters and their
// exact derivatives were introduced in d93d141 on the prior homepage-refresh branch.
// Source hashes, derivative hashes and archive identity live beside the images.
const CONCEPTS: Record<string, { asset: string; originalCmsPath: string; alt: string }> = {
  "smart-meeting-room": {
    asset: "smart-meeting-room",
    originalCmsPath: "uploads/meeting-room-2944ce33.png",
    alt: "AI concept illustration of a meeting room with a conference camera, display, and tabletop control panel",
  },
  "auditorium-performance-hall": {
    asset: "auditorium-performance-hall",
    originalCmsPath: "uploads/auditorium-0d831107.png",
    alt: "AI concept illustration of an auditorium with a projection screen, suspended loudspeakers, and a podium microphone",
  },
  "divisible-room-multipurpose-hall": {
    asset: "divisible-multipurpose-hall",
    originalCmsPath: "uploads/divisible-room-262102ad.png",
    alt: "AI concept illustration of a divisible hall with moving partitions and separate projection screens",
  },
  "pa-commercial-sound-system": {
    asset: "pa-commercial-sound-system",
    originalCmsPath: "uploads/pa-sysem-8d94053c.png",
    alt: "AI concept illustration of a commercial reception area with a paging microphone and ceiling loudspeakers",
  },
  "smart-classroom-training-room": {
    asset: "smart-classroom-training-room",
    originalCmsPath: "uploads/smart-classroom-824af36c.png",
    alt: "AI concept illustration of a classroom with an interactive display, camera, and wall loudspeakers",
  },
  "house-of-worship": {
    asset: "house-of-worship",
    originalCmsPath: "uploads/worship-solution-37011c0e.png",
    alt: "AI concept illustration of a worship space with loudspeakers, a display, and a production camera",
  },
  "broadcast-podcast-studio": {
    asset: "broadcast-podcast-studio",
    originalCmsPath: "uploads/podcast-solutions-59c9f828.png",
    alt: "AI concept illustration of a podcast studio with boom microphones, headphones, a camera, and production lighting",
  },
  "sports-entertainment-venue": {
    asset: "sports-entertainment-venue",
    originalCmsPath: "uploads/sports-arena-6e8fc0f0.png",
    alt: "AI concept illustration of a padel venue with installed loudspeakers and an information display",
  },
};

type SolutionImageSource = {
  slug: string | null;
  hero_image_path: string | null;
  hero_image_url_ext: string | null;
};

/** Override the known previous default, never a later image chosen by a CMS editor. */
export function homepageSolutionConcept(solution: SolutionImageSource) {
  const concept = CONCEPTS[solution.slug ?? ""];
  if (!concept) return undefined;
  if (solution.hero_image_path === concept.originalCmsPath) return concept;
  if (!solution.hero_image_path && !solution.hero_image_url_ext) return concept;
  return undefined;
}

export function homepageConceptImageSrc(asset: string, width: number) {
  const size = width <= 480 ? 480 : width <= 800 ? 800 : width <= 1200 ? 1200 : 1672;
  return `/images/home-solutions/${asset}-${size}.webp`;
}
