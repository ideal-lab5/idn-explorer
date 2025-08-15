/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed deprecated experimental flag that was causing warnings
  // Properly handle client-side only packages
  webpack: (config, { isServer }) => {
    // Fix for tsyringe and reflect-metadata
    if (!isServer) {
      // Ensure reflect-metadata is properly bundled
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
