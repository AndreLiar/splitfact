// Utility function to generate client dashboard tokens (to be used by the team)
export async function generateClientDashboardToken(clientId: string, collectiveId: string): Promise<string> {
  const timestamp = Date.now();
  const tokenData = `${clientId}:${collectiveId}:${timestamp}`;
  return Buffer.from(tokenData).toString('base64');
}

// Utility function to verify and parse client dashboard tokens
export function parseClientDashboardToken(token: string): { clientId: string; collectiveId: string; timestamp: number } | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 3) {
      return null;
    }
    const [clientId, collectiveId, timestampStr] = parts;
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) {
      return null;
    }
    return { clientId, collectiveId, timestamp };
  } catch (error) {
    return null;
  }
}