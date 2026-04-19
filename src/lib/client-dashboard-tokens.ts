export function generateClientDashboardToken(clientId: string): string {
  const timestamp = Date.now();
  const tokenData = `${clientId}:${timestamp}`;
  return Buffer.from(tokenData).toString('base64');
}

export function parseClientDashboardToken(token: string): { clientId: string; timestamp: number } | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 2) return null;
    const [clientId, timestampStr] = parts;
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return null;
    return { clientId, timestamp };
  } catch {
    return null;
  }
}
