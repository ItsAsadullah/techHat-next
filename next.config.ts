import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // reactCompiler is disabled — it interferes with Next.js Server Action
    // boundary processing in Turbopack dev mode, causing fetchServerAction to
    // receive an unexpected (HTML) response instead of the RSC action payload.
    // reactCompiler: true,
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    qualities: [75, 85],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
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
        hostname: 'img.youtube.com',
      },
    ],
  },
};

export default nextConfig;
