// Utility to generate demo client dashboard tokens for testing
// This would normally be done through the admin interface

export function generateDemoToken(): string {
  // For demo purposes, create a token with dummy IDs
  const clientId = 'demo-client-id';
  const collectiveId = 'demo-collective-id';
  const timestamp = Date.now();
  const tokenData = `${clientId}:${collectiveId}:${timestamp}`;
  return Buffer.from(tokenData).toString('base64');
}

console.log('Demo token for testing:', generateDemoToken());