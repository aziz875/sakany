/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  // NOTE: Removed `ignoreDuringBuilds` and `ignoreBuildErrors` — fail the build on
  // TypeScript/ESLint errors so broken code never ships to production.
};

module.exports = nextConfig;