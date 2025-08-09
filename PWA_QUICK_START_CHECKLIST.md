# 🚀 PWA Quick Start Checklist

**30-Minute PWA Implementation Checklist for Next.js Projects**

---

## ⚡ **Quick Setup (30 minutes)**

### **1. Install Dependencies (2 minutes)**
```bash
npm install next-pwa@5.6.0 workbox-webpack-plugin@7.0.0 idb@8.0.0
```

### **2. Create Manifest (5 minutes)**
Create `public/manifest.json`:
```json
{
  "name": "Your App Name",
  "short_name": "AppName", 
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {"src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png"},
    {"src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png"}
  ]
}
```

### **3. Generate Icons (3 minutes)**
```bash
# Create icons directory
mkdir -p public/icons

# Copy your favicon as base icons (replace with proper icons later)
cp public/favicon.ico public/icons/icon-192x192.png
cp public/favicon.ico public/icons/icon-512x512.png
```

### **4. Add Meta Tags (3 minutes)**
In `src/app/layout.tsx`:
```tsx
<head>
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#000000" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-title" content="Your App" />
</head>
```

### **5. Configure Next.js (5 minutes)**
Create TypeScript definition in `src/types/next-pwa.d.ts`:
```typescript
declare module 'next-pwa' {
  function withPWA(config: any): (nextConfig: any) => any;
  export default withPWA;
}
```

Update `next.config.ts`:
```typescript
import withPWA from "next-pwa";

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

export default pwaConfig(nextConfig);
```

### **6. Create Install Component (5 minutes)**
Create `src/components/PWAInstall.tsx`:
```tsx
'use client';
import { useState, useEffect } from 'react';

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  if (!deferredPrompt) return null;

  return (
    <button onClick={handleInstall} className="btn btn-primary">
      📱 Install App
    </button>
  );
}
```

### **7. Add to Your App (2 minutes)**
In your main layout or page:
```tsx
import PWAInstall from '@/components/PWAInstall';

export default function HomePage() {
  return (
    <div>
      <PWAInstall />
      {/* Your content */}
    </div>
  );
}
```

### **8. Create Offline Page (3 minutes)**
Create `src/app/offline/page.tsx`:
```tsx
export default function Offline() {
  return (
    <div className="text-center p-4">
      <h1>You're offline</h1>
      <p>Some features may be limited.</p>
      <button onClick={() => location.reload()}>Try again</button>
    </div>
  );
}
```

### **9. Build & Test (2 minutes)**
```bash
npm run build
npm run start
```

Open Chrome DevTools → Application → Manifest to verify setup.

---

## ✅ **Verification Checklist**

- [ ] Manifest loads without errors
- [ ] Icons display in DevTools
- [ ] Service worker registers successfully  
- [ ] Install prompt appears (desktop Chrome)
- [ ] App works offline (basic caching)
- [ ] "Add to Home Screen" works (mobile)

---

## 🔧 **Quick Customizations**

### **Add App Shortcuts**
In `manifest.json`:
```json
"shortcuts": [
  {
    "name": "Dashboard",
    "url": "/dashboard",
    "icons": [{"src": "/icons/shortcut-dashboard.png", "sizes": "192x192"}]
  }
]
```

### **Custom Caching**
In `next.config.ts`:
```typescript
const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^\/api\//,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: { maxAgeSeconds: 60 * 60 }
      }
    }
  ]
});
```

### **Offline Storage**
```typescript
// Simple offline storage hook
export function useOfflineStorage() {
  const saveOffline = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const getOffline = (key: string) => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  };

  return { saveOffline, getOffline };
}
```

---

## 🚨 **Common Quick Fixes**

### **Install Prompt Not Showing**
1. Check HTTPS is enabled
2. Verify manifest is valid
3. Ensure service worker is registered
4. Test engagement heuristics (user interaction)

### **Icons Not Working**
1. Verify icon paths in manifest
2. Check file exists: `curl -I yoursite.com/icons/icon-192x192.png`
3. Ensure proper sizes (192x192, 512x512 minimum)

### **Service Worker Issues**
1. Clear browser cache
2. Check DevTools → Application → Service Workers
3. Verify `next.config.ts` configuration
4. Ensure `public/sw.js` exists after build

### **Offline Page Not Loading**
1. Add to `next.config.ts`: `fallbacks: { document: '/offline' }`
2. Ensure offline page route exists
3. Check service worker is caching navigation requests

---

## 📱 **Platform-Specific Notes**

### **iOS Safari**
- Users must manually "Add to Home Screen"
- Requires apple-touch-icon meta tags
- Limited PWA capabilities vs Android

### **Android Chrome**
- Automatic install prompts available
- Full PWA support with shortcuts
- Better offline capabilities

### **Desktop Chrome/Edge**
- Install to taskbar/dock
- App shortcuts in right-click menu
- Window controls integration

---

## 🎯 **Success Indicators**

**✅ Working PWA:**
- Install button appears
- App installs to home screen/desktop
- Works offline (basic functionality)
- Service worker active in DevTools
- Lighthouse PWA score > 80

**🚀 Production Ready:**
- Lighthouse PWA score > 90
- Custom offline experience
- Proper icon sizes and maskable icons
- Background sync (optional)
- Push notifications (optional)

---

**⏱️ Total Setup Time: ~30 minutes for basic PWA**  
**📈 Expected Results: 2-3x better user engagement**

This checklist gets you 80% of PWA benefits in 30 minutes! For advanced features, refer to the complete implementation guide.

*Status: ✅ Battle-tested on Splitfact*