/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
    optimizePackageImports: ["@mui/material", "@mui/icons-material"]
  }
};

export default nextConfig;
