import type { MetadataRoute } from "next";

// Web app manifest (served at /manifest.webmanifest, auto-linked by Next).
// This is what makes HotelConnect installable / add-to-home-screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HotelConnect",
    short_name: "HotelConnect",
    description: "Coordinamento pulizie camere per reception e personale di pulizia.",
    lang: "it",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // Match the app's white header so the standalone status-bar area blends in.
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
