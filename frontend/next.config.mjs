/** @type {import('next').NextConfig} */

// Where the Fastify API actually runs. Used for server-side fetches and as the
// proxy target, so it never has to be reachable from the visitor's browser.
const INTERNAL_API = process.env.INTERNAL_API_URL || "http://localhost:4000";

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "**" },
    ],
  },

  /**
   * The browser talks to the API through this origin rather than to
   * localhost:4000 directly. That keeps the site working behind a tunnel or on
   * any other machine, and makes auth cookies same-origin.
   */
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${INTERNAL_API}/api/:path*` },
      { source: "/uploads/:path*", destination: `${INTERNAL_API}/uploads/:path*` },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
