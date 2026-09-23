import { withSentryConfig } from '@sentry/nextjs';
/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production';

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://*.agora.io https://*.sd-rtn.com https://*.sentry.io https://*.netless.link https://*.whiteboard.agora.io https://*.whiteboard.sd-rtn.com https://*.whiteboard.rtelink.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' blob: data: https://ui-avatars.com https://*.agora.io https://*.google.com https://*.gstatic.com https://*.netless.link https://*.whiteboard.agora.io https://*.whiteboard.rtelink.com https://*.sd-rtn.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 https://api.taj-edu.online https://www.google.com/recaptcha/ https://*.agora.io https://*.sd-rtn.com https://*.whiteboard.sd-rtn.com https://*.netless.link https://*.whiteboard.agora.io https://*.whiteboard.rtelink.com https://*.rtelink.com https://rest-argus-ad.agoralab.co https://*.sentry.io https://*.ingest.sentry.io wss://*.agora.io wss://*.sd-rtn.com wss://*.whiteboard.sd-rtn.com wss://*.netless.link wss://*.whiteboard.agora.io wss://*.whiteboard.rtelink.com wss://*.rtelink.com https://www.gstatic.com/generate_204 https://clients3.google.com/generate_204",
  "frame-src 'self' https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/ https://*.moyasar.com",
  "media-src 'self' blob: mediastream: https://*.agora.io",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.moyasar.com",
  "frame-ancestors 'none'",
];

if (isProd) {
  cspDirectives.push('upgrade-insecure-requests');
}

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), display-capture=(self), geolocation=()' },
  { key: 'Content-Security-Policy', value: cspDirectives.join('; ') },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }
];

const nextConfig = {
  reactStrictMode: true, 

  // ==========================================
  // ملاحظة بخصوص Vercel و Agora: تمت إزالة swcMinify: false
  // بناءً على تحذير Next.js، حيث سيتم إيقاف دعمه مستقبلاً.
  // تم الإبقاء على transpilePackages لضمان ترجمة المكتبة.
  // ==========================================
  transpilePackages: ['agora-react-uikit', 'agora-rtc-sdk-ng'], // إجبار السيرفر على ترجمة المكتبة بشكل صحيح
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

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

  // NOTE: widenClientFileUpload was removed intentionally.
  // Enabling it causes Sentry to attempt uploading ALL client-side chunks
  // including third-party bundles (e.g. agora-rtc-sdk-ng) that have no
  // corresponding source maps, producing:
  // "warning: could not determine a source map reference"
  // Sentry will still correctly upload source maps for all application code.

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
