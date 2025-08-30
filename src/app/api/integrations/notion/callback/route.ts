import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { getNotionService } from "@/lib/notion-service";

export const runtime = 'nodejs';

const NOTION_CLIENT_ID = process.env.NOTION_CLIENT_ID;
const NOTION_CLIENT_SECRET = process.env.NOTION_CLIENT_SECRET;
const NOTION_REDIRECT_URI = process.env.NEXTAUTH_URL + '/api/integrations/notion/callback';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth error
    if (error) {
      console.error('Notion OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/dashboard/settings?notion_error=${encodeURIComponent(error)}`, request.url)
      );
    }

    // Validate required parameters
    if (!code || !NOTION_CLIENT_ID || !NOTION_CLIENT_SECRET) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?notion_error=invalid_request', request.url)
      );
    }

    try {
      // Exchange authorization code for access token
      const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${NOTION_CLIENT_ID}:${NOTION_CLIENT_SECRET}`).toString('base64')}`
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: NOTION_REDIRECT_URI
        })
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange failed:', errorText);
        throw new Error('Token exchange failed');
      }

      const tokenData = await tokenResponse.json();
      
      if (!tokenData.access_token) {
        throw new Error('No access token received');
      }

      // Extract workspace information
      const workspaceInfo = {
        id: tokenData.workspace_id,
        name: tokenData.workspace_name,
        icon: tokenData.workspace_icon,
        owner: tokenData.owner
      };

      // Connect user's Notion account
      const notionService = getNotionService(session.user.id);
      const connected = await notionService.connectUserAccount(tokenData.access_token, workspaceInfo);

      if (!connected) {
        throw new Error('Failed to save connection');
      }

      // Redirect back to settings with success message
      return NextResponse.redirect(
        new URL('/dashboard/settings?notion_connected=true', request.url)
      );

    } catch (connectionError) {
      console.error('Failed to connect Notion account:', connectionError);
      return NextResponse.redirect(
        new URL('/dashboard/settings?notion_error=connection_failed', request.url)
      );
    }

  } catch (error) {
    console.error("Error in Notion callback:", error);
    return NextResponse.redirect(
      new URL('/dashboard/settings?notion_error=server_error', request.url)
    );
  }
}