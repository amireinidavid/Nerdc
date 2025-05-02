import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["image.tmdb.org","images.unsplash.com","ui-avatars.com","res.cloudinary.com"],
  },
  // Disable ESLint during builds (especially for production)
  eslint: {
    // Only run ESLint in development, skip in production builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
