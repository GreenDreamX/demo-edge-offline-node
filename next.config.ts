/** @type {import('next').NextConfig} */
const nextConfig = {
  // Matikan pengecekan TypeScript saat build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
};

export default nextConfig;