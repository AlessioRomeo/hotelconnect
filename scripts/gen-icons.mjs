// Generates the PWA / app icons from an inline SVG using sharp.
// Re-run with `node scripts/gen-icons.mjs` if the design changes.
//
// Outputs:
//   public/icon-192.png            — manifest icon (purpose "any")
//   public/icon-512.png            — manifest icon (purpose "any")
//   public/icon-maskable-512.png   — manifest icon (purpose "maskable", safe-zone padded)
//   src/app/icon.png               — browser tab / favicon (Next file convention)
//   src/app/apple-icon.png         — iOS home-screen icon (Next file convention, opaque square)

import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// A simple, recognizable "bed" glyph (Lucide-style) centered on an emerald
// background. `scale` controls glyph size: smaller for the maskable safe zone.
function svg({ size = 512, rounded = true, scale = 14 } = {}) {
  const radius = rounded ? Math.round(size * 0.22) : 0;
  // Center the 24×24 glyph box on the canvas.
  const box = 24 * scale;
  const offset = (size - box) / 2;
  const stroke = 1.6; // in 24-unit space; visually stroke*scale px
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#10b981"/>
      <stop offset="1" stop-color="#047857"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="url(#bg)"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})"
     fill="none" stroke="#ffffff" stroke-width="${stroke}"
     stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 4v16"/>
    <path d="M2 8h18a2 2 0 0 1 2 2v10"/>
    <path d="M2 17h20"/>
    <path d="M6 8v9"/>
  </g>
</svg>`;
}

async function png(svgString, size, outPath, { flatten = false } = {}) {
  let pipe = sharp(Buffer.from(svgString)).resize(size, size);
  if (flatten) pipe = pipe.flatten({ background: "#047857" });
  await pipe.png().toFile(outPath);
  console.log("wrote", outPath);
}

await mkdir(join(root, "public"), { recursive: true });

// Manifest icons (purpose "any") — rounded.
await png(svg({ size: 512, rounded: true, scale: 14 }), 512, join(root, "public/icon-512.png"));
await png(svg({ size: 192, rounded: true, scale: 14 }), 192, join(root, "public/icon-192.png"));

// Maskable icon — full-bleed square bg, glyph kept inside the center safe zone.
await png(svg({ size: 512, rounded: false, scale: 10 }), 512, join(root, "public/icon-maskable-512.png"));

// Next file-convention icons.
await png(svg({ size: 512, rounded: true, scale: 14 }), 512, join(root, "src/app/icon.png"));
// Apple touch icon must be an opaque square (iOS applies its own rounding).
await png(svg({ size: 180, rounded: false, scale: 14 }), 180, join(root, "src/app/apple-icon.png"), { flatten: true });

console.log("done");
