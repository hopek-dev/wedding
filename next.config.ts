import type { NextConfig } from "next";

// Photos uploaded on the planner's Photos page live in Supabase storage; let next/image optimise them.
const supabaseHost = (() => {
  try {
    return process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  // Photos in public/couple/ get swapped from time to time; a short cache means a
  // replaced photo shows up within a minute instead of hours.
  images: {
    minimumCacheTTL: 60,
    qualities: [75, 90],
    remotePatterns: supabaseHost ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }] : [],
  },
  // The invitation link-preview image reads its fonts and the venue painting from
  // disk at request time, so make sure they're shipped with the deployed function.
  outputFileTracingIncludes: {
    "/invite-card": ["./src/app/rsvp/[token]/fonts/**/*", "./public/couple/venue-watercolor-og.jpg", "./public/couple/venue-watercolor.webp"],
  },
};

export default nextConfig;
