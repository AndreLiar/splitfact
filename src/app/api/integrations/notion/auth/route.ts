import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { getNotionService } from "@/lib/notion-service";

export const runtime = 'nodejs';

// Notion OAuth configuration
const NOTION_CLIENT_ID = process.env.NOTION_CLIENT_ID;
const NOTION_CLIENT_SECRET = process.env.NOTION_CLIENT_SECRET;
const NOTION_REDIRECT_URI = process.env.NEXTAUTH_URL + '/api/integrations/notion/callback';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'connect':
        return handleConnect();
      case 'disconnect':
        return handleDisconnect(session.user.id);
      case 'status':
        return handleStatus(session.user.id);
      default:
        return new NextResponse("Invalid action", { status: 400 });
    }
  } catch (error) {
    console.error("Error in Notion auth API:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { accessToken, workspaceInfo } = await request.json();
    
    if (!accessToken) {
      return new NextResponse("Access token is required", { status: 400 });
    }

    // Connect user's Notion account
    const notionService = getNotionService(session.user.id);
    const connected = await notionService.connectUserAccount(accessToken, workspaceInfo);

    if (!connected) {
      return NextResponse.json({ 
        success: false,
        error: "Failed to connect Notion account"
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      message: "Notion account connected successfully"
    });

  } catch (error) {
    console.error("Error connecting Notion account:", error);
    return NextResponse.json({ 
      success: false,
      error: "Failed to connect Notion account"
    }, { status: 500 });
  }
}

/**
 * Generate Notion OAuth authorization URL
 */
async function handleConnect(): Promise<NextResponse> {
  if (!NOTION_CLIENT_ID) {
    return NextResponse.json({ 
      error: "Notion integration not configured" 
    }, { status: 500 });
  }

  // Generate state for CSRF protection
  const state = generateRandomState();
  
  const authUrl = new URL('https://api.notion.com/v1/oauth/authorize');
  authUrl.searchParams.set('client_id', NOTION_CLIENT_ID);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('owner', 'user');
  authUrl.searchParams.set('redirect_uri', NOTION_REDIRECT_URI);
  authUrl.searchParams.set('state', state);

  return NextResponse.json({
    authUrl: authUrl.toString(),
    state
  });
}

/**
 * Disconnect user's Notion account
 */
async function handleDisconnect(userId: string): Promise<NextResponse> {
  try {
    const notionService = getNotionService(userId);
    const disconnected = await notionService.disconnectUserAccount();

    if (!disconnected) {
      return NextResponse.json({ 
        success: false,
        error: "Failed to disconnect Notion account"
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      message: "Notion account disconnected successfully"
    });
  } catch (error) {
    console.error("Error disconnecting Notion:", error);
    return NextResponse.json({ 
      success: false,
      error: "Failed to disconnect Notion account"
    }, { status: 500 });
  }
}

/**
 * Get Notion connection status
 */
async function handleStatus(userId: string): Promise<NextResponse> {
  try {
    const notionService = getNotionService(userId);
    const status = await notionService.getConnectionStatus();

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error getting Notion status:", error);
    return NextResponse.json({
      connected: false,
      error: "Failed to get connection status"
    }, { status: 500 });
  }
}

/**
 * Generate random state for OAuth CSRF protection
 */
function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}