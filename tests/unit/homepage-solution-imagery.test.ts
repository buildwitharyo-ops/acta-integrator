import { describe, expect, it } from "vitest";
import { homepageConceptImageSrc, homepageSolutionConcept } from "@/lib/homepage-solution-imagery";

describe("recovered homepage solution illustrations", () => {
  it("maps the divisible-room route to the actual prior asset filename", () => {
    const image = homepageSolutionConcept({
      slug: "divisible-room-multipurpose-hall",
      hero_image_path: "uploads/divisible-room-262102ad.png",
      hero_image_url_ext: null,
    });
    expect(image?.asset).toBe("divisible-multipurpose-hall");
    expect(homepageConceptImageSrc(image!.asset, 1080)).toBe("/images/home-solutions/divisible-multipurpose-hall-1200.webp");
    expect(image?.alt).toContain("AI concept illustration");
  });

  it("preserves a later CMS image and an unknown solution", () => {
    expect(homepageSolutionConcept({ slug: "smart-meeting-room", hero_image_path: "uploads/new-owner-project-photo.webp", hero_image_url_ext: null })).toBeUndefined();
    expect(homepageSolutionConcept({ slug: "smart-meeting-room", hero_image_path: null, hero_image_url_ext: "https://example.com/new-room.webp" })).toBeUndefined();
    expect(homepageSolutionConcept({ slug: "new-application", hero_image_path: null, hero_image_url_ext: null })).toBeUndefined();
  });
});
