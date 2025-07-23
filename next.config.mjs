/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Disable the bailout to prevent React hydration errors
    missingSuspenseWithCSRBailout: false,
  },
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
