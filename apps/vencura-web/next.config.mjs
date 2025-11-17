/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  webpack: (config) => {
    // Ignore optional dependencies that aren't needed for web builds
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
    }

    return config
  },
  // Turbopack config for Next.js 16
  turbopack: {},
}

export default nextConfig
