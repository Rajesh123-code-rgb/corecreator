import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async redirects() {
    return [
      {
        // The public creator profile used to live under /studio/<id>, which
        // collided with the creator dashboard namespace and duplicated
        // /artists/<id>. One canonical URL now, with the old one preserved for
        // links and bookmarks already in the wild.
        source: "/studio/:id((?!login|register|dashboard|products|courses|workshops|orders|earnings|inventory|analytics|audience|reviews|returns|messages|notifications|settings|verification|support)[a-f0-9]{24})",
        destination: "/artists/:id",
        permanent: true,
      },
    ];
  },

  async headers() {
    // Content-Security-Policy, in REPORT-ONLY mode.
    //
    // The site takes live payments, and a policy that is even slightly wrong
    // silently breaks the Razorpay modal - the customer sees a checkout that
    // will not open and we would find out from lost revenue. Report-Only sends
    // violation reports without blocking anything, so the policy can be proven
    // against a real checkout before it is enforced.
    //
    // To enforce: watch the browser console on a full purchase, a course
    // player session and a Google sign-in, add anything that reports a
    // violation, then rename the header to "Content-Security-Policy".
    //
    // 'unsafe-inline' on script-src is required by Next's App Router, which
    // injects inline bootstrap scripts without a nonce. It limits what CSP can
    // do here, but the policy still constrains which HOSTS can be reached,
    // which is the part that matters for exfiltration and injected third-party
    // scripts.
    const csp = [
      "default-src 'self'",
      // Razorpay checkout, analytics, Google Translate, and Next's inline boot scripts
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com https://translate.google.com https://translate.googleapis.com https://www.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      // Cloudinary hosts the catalogue; unsplash and ui-avatars are fallbacks
      "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://ui-avatars.com https://i.ytimg.com https://*.razorpay.com https://www.google-analytics.com https://www.googletagmanager.com https://translate.googleapis.com https://www.gstatic.com https://randomuser.me https://via.placeholder.com",
      // Razorpay API, Cloudinary uploads, currency rates, analytics beacons
      "connect-src 'self' https://api.razorpay.com https://*.razorpay.com https://lumberjack.razorpay.com https://api.cloudinary.com https://res.cloudinary.com https://api.exchangerate-api.com https://www.google-analytics.com https://www.googletagmanager.com https://translate.googleapis.com",
      // Razorpay renders in a frame; Bunny Stream and YouTube host the videos
      "frame-src 'self' https://checkout.razorpay.com https://*.razorpay.com https://api.razorpay.com https://iframe.mediadelivery.net https://video.bunnycdn.com https://www.youtube.com https://www.youtube-nocookie.com https://translate.google.com",
      "media-src 'self' blob: https://*.b-cdn.net https://video.bunnycdn.com https://res.cloudinary.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://*.razorpay.com",
      // Belt and braces alongside X-Frame-Options
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Content-Security-Policy-Report-Only", value: csp },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
