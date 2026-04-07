/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // 'standalone' is for Docker/self-hosted. Vercel manages its own output — remove it.
  experimental: {
    serverComponentsExternalPackages: [],
  },
  async headers() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data:",
              "font-src 'self'",
              // Allow configured API URL + any Vercel deployment + local dev
              `connect-src 'self' ${apiUrl} https://*.vercel.app http://localhost:3001 http://192.168.0.0/16`,
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
