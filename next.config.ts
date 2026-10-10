import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Photos in public/couple/ get swapped from time to time; a short cache means a
  // replaced photo shows up within a minute instead of hours.
  images: { minimumCacheTTL: 60 },
  // The invitation link-preview image reads its fonts from disk at request
  // time, so make sure they're shipped with the deployed function.
  outputFileTracingIncludes: {
    "/rsvp/[token]/opengraph-image": ["./src/app/rsvp/[token]/fonts/**/*"],
  },
};

export default nextConfig;
