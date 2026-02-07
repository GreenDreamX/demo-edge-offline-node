/** @type {import('next').NextConfig} */
const nextConfig = {
  // Matikan pengecekan TypeScript saat build
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;