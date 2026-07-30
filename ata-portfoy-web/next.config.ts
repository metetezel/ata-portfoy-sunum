import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the dev server accept requests from 127.0.0.1 as well as localhost —
  // without this, Next.js silently blocks _next/* dev-resource requests from
  // the "wrong" origin, which starves client components of their JS and they
  // never hydrate (no console error, they just stay inert).
  allowedDevOrigins: ["localhost", "127.0.0.1"],
};

export default nextConfig;
