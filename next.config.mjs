// next.config.js  (or next.config.mjs)
import createMDX from '@next/mdx';

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  reactStrictMode: true,
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  env: {
    BUILD_DATE: new Date().toISOString(),
  },
  // This will suppress the className mismatch warning
  // suppressHydrationWarning: true,
};

export default withMDX(nextConfig);
