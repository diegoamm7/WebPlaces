/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Security headers applied at infrastructure level via Vercel config
  // See vercel.json for header definitions
  images: {
    domains: ['lh3.googleusercontent.com']
  }
}

module.exports = nextConfig
