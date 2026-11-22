import type { NextConfig } from "next";

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://bt-cdn.yappy.cloud",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://bt-cdn.yappy.cloud",
  "font-src 'self' data:",
  "connect-src 'self' https://bdtewmmtnfnbjwajmvdg.supabase.co https://*.supabase.co https://api.stripe.com https://apipagosbg.bgeneral.cloud https://api-comecom-uat.yappycloud.com https://bt-cdn.yappy.cloud",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com"
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: cspDirectives }
        ]
      }
    ];
  }
};

export default nextConfig;
