import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The invitation link-preview image reads its fonts from disk at request
  // time, so make sure they're shipped with the deployed function.
  outputFileTracingIncludes: {
    "/rsvp/[token]/opengraph-image": ["./src/app/rsvp/[token]/fonts/**/*"],
  },
};

export default nextConfig;
