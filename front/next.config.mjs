/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://draftpal.onrender.com'|| 'http://localhost:3000',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
