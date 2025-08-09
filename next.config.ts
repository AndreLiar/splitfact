import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { fs: false, net: false, tls: false, dns: false };
    } else {
      config.externals.push('child_process', 'nodemailer');
    }
    return config;
  },
};

// PWA Configuration
const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    // Cache static assets
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
        }
      }
    },
    {
      urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'cdn-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
        }
      }
    },
    // Cache API routes with network-first strategy
    {
      urlPattern: /^\/api\/insights/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'insights-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 // 1 hour
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    {
      urlPattern: /^\/api\/clients/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'clients-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 2 // 2 hours
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    {
      urlPattern: /^\/api\/invoices/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'invoices-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 1 // 1 hour
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    // Cache AI responses with network-first strategy
    {
      urlPattern: /^\/api\/ai\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'ai-cache',
        networkTimeoutSeconds: 15,
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 4 // 4 hours
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    // Cache dashboard pages
    {
      urlPattern: /^\/dashboard/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'dashboard-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 30 // 30 minutes
        }
      }
    },
    // Cache static files
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
        }
      }
    }
  ],
  buildExcludes: [/middleware-manifest\.json$/],
  fallbacks: {
    // Fallback for API routes when offline
    'api': '/offline'
  }
});

export default pwaConfig(nextConfig);
