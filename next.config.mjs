/** @type {import('next').NextConfig} */
const nextConfig = { distDir: process.env.TOOLBOX_BUILD_DIR || '.next' };
export default nextConfig;
