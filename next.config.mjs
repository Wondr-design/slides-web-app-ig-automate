/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "scontent-lis1-1.cdninstagram.com",
      },
    ],
  },
};

export default nextConfig;
