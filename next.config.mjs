/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  distDir: process.env.TOOLBOX_BUILD_DIR || '.next',
};
export default nextConfig;
