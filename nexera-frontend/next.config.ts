import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'pdkopjplvykxfhqleghs.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'kfjzrzetgeslulzofniv.supabase.co',
      },
    ],
  },
};

export default nextConfig;
