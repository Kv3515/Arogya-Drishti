/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  // Allow mobile/LAN devices to load Next.js dev assets
  allowedDevOrigins: ['192.168.0.0/16', '10.0.0.0/8', '172.16.0.0/12'],
  experimental: {
    serverComponentsExternalPackages: [],
  },
  async headers() {
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
              // Allow API calls from any private LAN IP (mobile testing)
              "connect-src 'self' http://localhost:3001 http://192.168.0.0/16 http://192.168.0.149:3001 " + (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'),
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
