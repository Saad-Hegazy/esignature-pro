/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Fix for canvas module issues
    config.resolve.alias.canvas = false;
    
    // Handle PDF.js worker
    config.resolve.alias['pdfjs-dist'] = 'pdfjs-dist/legacy/build/pdf';
    
    return config;
  },
  // Environment variables
  env: {
    BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
  },
}

module.exports = nextConfig
