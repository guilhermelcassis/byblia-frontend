/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://byblia-freeapi.onrender.com/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig; 