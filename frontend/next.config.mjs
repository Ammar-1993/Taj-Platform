import { withSentryConfig } from '@sentry/nextjs';
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
  reactStrictMode: true, 

  // ==========================================
  // ملاحظة بخصوص Vercel و Agora: تمت إزالة swcMinify: false
  // بناءً على تحذير Next.js، حيث سيتم إيقاف دعمه مستقبلاً.
  // تم الإبقاء على transpilePackages لضمان ترجمة المكتبة.
  // ==========================================
  transpilePackages: ['agora-react-uikit', 'agora-rtc-sdk-ng'], // إجبار السيرفر على ترجمة المكتبة بشكل صحيح

  images: {
    domains: ['ui-avatars.com', 'localhost', '127.0.0.1'],
  },

  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
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

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  // ربط Sentry بالمشروع والمنظمة الصحيحَين (مقروء من متغيرات البيئة في Vercel)
  project: process.env.SENTRY_PROJECT,
  org: process.env.SENTRY_ORG,

  // إيقاف البلجن تلقائياً في البيئات التي لا تحتوي على SENTRY_PROJECT
  // (مثل بيئة التطوير المحلية) لتفادي أخطاء رفع Source Maps
  disableServerWebpackPlugin: !process.env.SENTRY_PROJECT,
  disableClientWebpackPlugin: !process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    automaticVercelMonitors: true,
    // NOTE: removeDebugLogging was removed intentionally.
    // Setting it to true strips ALL console.log and Sentry logger calls
    // from production builds, preventing logs from reaching Sentry.
  },
});
