// Generates the PWA / app icons from an inline SVG using sharp.
// Re-run with `node scripts/gen-icons.mjs` if the design changes.
//
// Design: an "HC" monogram in white on an emerald gradient.
//
// Outputs (cover iOS, Android/Chrome, and desktop):
//   public/icon-192.png            — manifest icon (purpose "any")
//   public/icon-512.png            — manifest icon (purpose "any")
//   public/icon-maskable-512.png   — manifest icon (purpose "maskable"; Android
//                                     adaptive icons — glyph kept in safe zone)
//   src/app/icon.png               — browser tab / favicon (Next file convention)
//   src/app/apple-icon.png         — iOS home-screen icon (opaque square)

import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SIZE = 512;

// `rounded` adds a squircle radius (nice when the icon is shown as-is).
// `fontSize` controls the monogram size — smaller for the maskable safe zone.
function monogram({ rounded = true, fontSize = 240 } = {}) {
  const radius = rounded ? Math.round(SIZE * 0.22) : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#10b981"/>
      <stop offset="1" stop-color="#047857"/>
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" rx="${radius}" ry="${radius}" fill="url(#bg)"/>
  <text x="${SIZE / 2}" y="${SIZE / 2 + 8}" font-family="Helvetica,Arial,sans-serif"
        font-size="${fontSize}" font-weight="700" fill="#ffffff"
        text-anchor="middle" dominant-baseline="central">HC</text>
</svg>`;
}

async function png(svgString, size, outPath, { flatten = false } = {}) {
  let pipe = sharp(Buffer.from(svgString)).resize(size, size);
  if (flatten) pipe = pipe.flatten({ background: "#047857" });
  await pipe.png().toFile(outPath);
  console.log("wrote", outPath);
}

await mkdir(join(root, "public"), { recursive: true });

const anyIcon = monogram({ rounded: true, fontSize: 240 });

// Manifest icons (purpose "any") — rounded.
await png(anyIcon, 512, join(root, "public/icon-512.png"));
await png(anyIcon, 192, join(root, "public/icon-192.png"));

// Maskable — full-bleed square bg, smaller glyph inside the center safe zone.
await png(monogram({ rounded: false, fontSize: 180 }), 512, join(root, "public/icon-maskable-512.png"));

// Next file-convention icons.
await png(anyIcon, 512, join(root, "src/app/icon.png"));
// Apple touch icon must be an opaque square (iOS applies its own rounding).
await png(monogram({ rounded: false, fontSize: 240 }), 180, join(root, "src/app/apple-icon.png"), { flatten: true });

console.log("done");
