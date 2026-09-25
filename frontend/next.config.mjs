import { withSentryConfig } from '@sentry/nextjs';
/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production';

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://*.agora.io https://*.sd-rtn.com https://*.sentry.io https://*.netless.link https://*.whiteboard.agora.io https://*.whiteboard.sd-rtn.com https://*.whiteboard.rtelink.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' blob: data: https://ui-avatars.com https://*.agora.io https://*.google.com https://*.gstatic.com https://*.netless.link https://*.whiteboard.agora.io https://*.whiteboard.rtelink.com https://*.sd-rtn.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' blob: http://localhost:8000 http://127.0.0.1:8000 https://api.taj-edu.online https://www.google.com/recaptcha/ https://*.agora.io https://*.agora.io:* https://*.edge.agora.io:* https://*.sd-rtn.com https://*.sd-rtn.com:* https://*.edge.sd-rtn.com:* https://*.whiteboard.sd-rtn.com https://*.whiteboard.sd-rtn.com:* https://*.netless.link https://*.netless.link:* https://*.whiteboard.agora.io https://*.whiteboard.agora.io:* https://*.whiteboard.rtelink.com https://*.whiteboard.rtelink.com:* https://*.rtelink.com https://*.rtelink.com:* https://rest-argus-ad.agoralab.co https://*.sentry.io https://*.ingest.sentry.io wss://*.agora.io wss://*.agora.io:* wss://*.edge.agora.io:* wss://*.sd-rtn.com wss://*.sd-rtn.com:* wss://*.edge.sd-rtn.com:* wss://*.whiteboard.sd-rtn.com wss://*.whiteboard.sd-rtn.com:* wss://*.netless.link wss://*.netless.link:* wss://*.whiteboard.agora.io wss://*.whiteboard.agora.io:* wss://*.whiteboard.rtelink.com wss://*.whiteboard.rtelink.com:* wss://*.rtelink.com wss://*.rtelink.com:* https://www.gstatic.com/generate_204 https://clients3.google.com/generate_204",
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
  transpilePackages: ['agora-rtc-sdk-ng'], // إجبار السيرفر على ترجمة المكتبة بشكل صحيح
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

  webpack(config, { isServer, webpack: wp }) {
    if (!isServer) {
      // ── Agora RTM SDK: console.error Noise Filter ──────────────────────────
      // The RTM SDK captures a direct reference to console.error at module-load
      // time: genErrorLogger = (...) => loggerGenerator(..., console.error, ...)
      // This means ANY global console.error patch applied after the module loads
      // is completely bypassed — the SDK always calls the original.
      //
      // webpack BannerPlugin injects code at the very TOP of the chunk that
      // contains agora-rtm-sdk, BEFORE the SDK's own module-level code runs.
      // At that exact moment, console.error is overridden with our filter, so
      // when genErrorLogger captures `console.error`, it captures our filtered
      // version. This is the ONLY reliable interception point.
      //
      // Errors filtered (all dev-only noise, already handled gracefully):
      //   -10015 : RTM service not enabled on this App ID
      //   -10023 : Login cancelled during unmount / navigation
      config.plugins.push(
        new wp.BannerPlugin({
          banner: `
(function() {
  if (typeof window !== 'undefined' && typeof console !== 'undefined') {
    var _ce = console.error;
    console.error = function() {
      var msg = typeof arguments[0] === 'string' ? arguments[0] : String(arguments[0] || '');
      // Suppress Agora RTM internal noise — handled gracefully in useAgoraRTM.ts
      if (msg.indexOf('RTM:ERROR') !== -1 && (
        msg.indexOf('-10015') !== -1 ||
        msg.indexOf('-10023') !== -1 ||
        msg.indexOf('NOT_ENABLE_RTM') !== -1 ||
        msg.indexOf('login failed') !== -1 ||
        msg.indexOf('canceled by user') !== -1
      )) { return; }
      // Suppress white-web-sdk internal bug: assertRoomIsConnected() fires during
      // the 'disconnecting' phase transition — a known SDK defect, safe to ignore.
      if (msg.indexOf('you can only call it when room is connected') !== -1 &&
          msg.indexOf('disconnecting') !== -1) { return; }
      return _ce.apply(console, arguments);
    };
  }
})();`,
          test: /agora-rtm-sdk/,
          raw: true,
          entryOnly: false,
        })
      );
    }
    return config;
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
