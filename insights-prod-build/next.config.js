const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '../'),
  experimental: {
    serverActions: {
      bodySizeLimit: '10kb',
    },
  },
};

module.exports = nextConfig;
