/** @type {import('next').NextConfig} */

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
];

if (process.env.NODE_ENV === 'production') {
  securityHeaders.push({
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload'
  });
}

const nextConfig = {
  reactStrictMode: false, 

  // ==========================================
  // 🟢 الحل الجذري لمنع Vercel من تدمير كود Agora
  // ==========================================
  swcMinify: false, // إيقاف الضغط العنيف الذي يغير أسماء الدوال إلى r
  transpilePackages: ['agora-react-uikit', 'agora-rtc-sdk-ng'], // إجبار السيرفر على ترجمة المكتبة بشكل صحيح

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;