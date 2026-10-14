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
  // Photos are uploaded through server actions. The default limit is 1 MB, which refuses most phone photos;
  // 4 MB is just under what Vercel accepts. (Photos are also shrunk in the browser before they are sent.)
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  // Photos in public/couple/ get swapped from time to time; a short cache means a
  // replaced photo shows up within a minute instead of hours.
  images: {
    minimumCacheTTL: 60,
    qualities: [75, 90],
    remotePatterns: supabaseHost ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }] : [],
  },
};

export default nextConfig;
