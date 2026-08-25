/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Linting is run explicitly via `npm run lint`; don't block builds on it.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
