import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Haughton Tettey Hitched!",
    short_name: "Hitched!",
    description: "Wedding planning dashboard",
    start_url: "/",
    display: "standalone",
    background_color: "#fcfcfb",
    theme_color: "#fb7185",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
