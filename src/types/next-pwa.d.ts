declare module 'next-pwa' {
  interface PWAConfig {
    dest: string;
    register: boolean;
    skipWaiting: boolean;
    disable?: boolean;
    runtimeCaching?: any[];
    buildExcludes?: RegExp[];
    manifestPath?: string;
    fallbacks?: {
      [key: string]: string;
    };
  }

  function withPWA(config: PWAConfig): (nextConfig: any) => any;
  export default withPWA;
}