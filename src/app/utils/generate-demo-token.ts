import { generateClientDashboardToken } from '@/lib/client-dashboard-tokens';

export function generateDemoToken(): string {
  return generateClientDashboardToken('demo-client-id');
}

console.log('Demo token for testing:', generateDemoToken());
