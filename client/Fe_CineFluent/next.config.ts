import type { NextConfig } from "next";
const URL = "http://127.0.0.1:5000/api";
const nextConfig: NextConfig = {
  reactCompiler: false,
  cacheComponents: false,
  async headers() {
    return [
      {
        source: "/(.*)", // Áp dụng cho toàn bộ trang web
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups", // QUAN TRỌNG: Cho phép popup giao tiếp
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "unsafe-none", // Thường cần thiết để Google Login hoạt động mượt
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${URL}/:path*`,
      },
    ];
  },

  images: {
    domains: [
      "res.cloudinary.com",
      "lh3.googleusercontent.com",
      "i.ytimg.com",
      "img.youtube.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
