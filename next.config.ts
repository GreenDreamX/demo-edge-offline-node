/** @type {import('next').NextConfig} */
const nextConfig = {
  // Matikan pengecekan Eslint saat build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Matikan pengecekan TypeScript saat build
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;