import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' blob: data:",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.amplitude.com https://*.lab.amplitude.com https://*.jsdelivr.net https://*.vouched.id https://*.googleapis.com https://*.fontawesome.com https://*.gstatic.com https://*.browser-intake-datadoghq.com",
              "connect-src 'self' https://*.amplitude.com https://*.lab.amplitude.com https://*.jsdelivr.net https://*.vouched.id https://*.googleapis.com https://*.fontawesome.com https://*.gstatic.com https://*.browser-intake-datadoghq.com https://api.ipify.org wss://*.vouched.id",
              "frame-src 'self' https://*.vouched.id",
              "font-src 'self' data: https://*.gstatic.com https://*.fontawesome.com",
              "style-src 'self' 'unsafe-inline' https://*.fontawesome.com https://*.googleapis.com",
              "img-src 'self' data: https: blob:",
              "media-src 'self' blob: data:"
            ].join('; ')
          }
        ]
      }
    ];
  }
};

export default nextConfig;
