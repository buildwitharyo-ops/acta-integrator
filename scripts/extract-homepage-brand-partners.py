#!/usr/bin/env python3
"""Extract genuine logo images and their transparency directly from the supplied profile.
Requires the existing PyMuPDF tooling. Does not render or redraw the marks.
Usage: python3 scripts/extract-homepage-brand-partners.py /path/to/profile.pdf
Then: node scripts/prepare-homepage-brand-masks.mjs
"""
import hashlib
import json
from pathlib import Path
import sys

import fitz

root = Path(__file__).resolve().parent.parent
source = Path(sys.argv[1]).resolve()
spec = json.loads((root / "lib/homepage-brand-partners.json").read_text())
out = root / "public/brands/homepage-profile"
out.mkdir(parents=True, exist_ok=True)
document = fitz.open(source)
page = document[spec["sourcePage"] - 1]
page_images = {entry["xref"] for entry in page.get_image_info(xrefs=True)}
assets = []
for brand in spec["brands"]:
    xref = brand["xref"]
    assert xref in page_images, f'{brand["name"]}: image is not present on the source page'
    image = document.extract_image(xref)
    pixmap = fitz.Pixmap(document, xref)
    if image.get("smask"):
        pixmap = fitz.Pixmap(pixmap, fitz.Pixmap(document, image["smask"]))
    output = out / f'{brand["slug"]}.png'
    pixmap.save(output)
    assets.append({**brand, "width": pixmap.width, "height": pixmap.height,
                   "sourceUrl": f'/brands/homepage-profile/{brand["slug"]}.png',
                   "sha256": hashlib.sha256(output.read_bytes()).hexdigest()})
provenance = {
    "sourceFile": source.name,
    "sourcePdfSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
    "sourceDocumentTitle": document.metadata.get("title"),
    "sourcePage": spec["sourcePage"],
    "sourceHeading": "OUR BRAND PARTNERS / Technology we work with",
    "groupingNote": "Functional groups, not dealership or certification tiers. AUDAC occurs in two groups.",
    "extraction": "Embedded PDF images with original soft masks; no redrawing or invented marks.",
    "assets": assets,
}
(out / "provenance.json").write_text(json.dumps(provenance, indent=2) + "\n")
print(json.dumps({"page": spec["sourcePage"], "uniqueBrands": len(assets),
                  "groupPlacements": sum(len(group["slugs"]) for group in spec["groups"])}))
