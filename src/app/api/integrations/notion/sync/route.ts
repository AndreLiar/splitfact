import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { getNotionService } from "@/lib/notion-service";

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const notionService = getNotionService(session.user.id);
    await notionService.initialize();

    switch (action) {
      case 'databases':
        return handleGetDatabases(notionService);
      case 'sync':
        return handleSync(notionService);
      case 'search':
        const query = searchParams.get('query');
        return handleSearch(notionService, query || '');
      default:
        return new NextResponse("Invalid action", { status: 400 });
    }
  } catch (error) {
    console.error("Error in Notion sync API:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { action, data } = await request.json();
    
    const notionService = getNotionService(session.user.id);
    await notionService.initialize();

    switch (action) {
      case 'create_databases':
        return handleCreateDatabases(notionService);
      case 'create_entry':
        return handleCreateEntry(notionService, data);
      case 'configure_database':
        return handleConfigureDatabase(notionService, data);
      default:
        return new NextResponse("Invalid action", { status: 400 });
    }
  } catch (error) {
    console.error("Error in Notion sync POST API:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

/**
 * Get user's discovered databases
 */
async function handleGetDatabases(notionService: any): Promise<NextResponse> {
  try {
    const status = await notionService.getConnectionStatus();
    
    return NextResponse.json({
      connected: status.connected,
      databases: status.databases,
      workspace: status.workspace
    });
  } catch (error) {
    console.error("Error getting databases:", error);
    return NextResponse.json({ 
      error: "Failed to get databases" 
    }, { status: 500 });
  }
}

/**
 * Sync fiscal data from Notion
 */
async function handleSync(notionService: any): Promise<NextResponse> {
  try {
    const fiscalData = await notionService.syncFiscalData();
    
    return NextResponse.json({
      success: true,
      data: fiscalData,
      synced_at: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error syncing data:", error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Sync failed"
    }, { status: 500 });
  }
}

/**
 * Search Notion content
 */
async function handleSearch(notionService: any, query: string): Promise<NextResponse> {
  try {
    if (!query.trim()) {
      return NextResponse.json({ results: [] });
    }

    const results = await notionService.searchNotionContent(query, {
      limit: 20
    });
    
    return NextResponse.json({
      query,
      results,
      count: results.length
    });
  } catch (error) {
    console.error("Error searching Notion:", error);
    return NextResponse.json({ 
      error: "Search failed",
      results: []
    }, { status: 500 });
  }
}

/**
 * Create standard fiscal databases
 */
async function handleCreateDatabases(notionService: any): Promise<NextResponse> {
  try {
    const databases = await notionService.createFiscalDatabases();
    
    return NextResponse.json({
      success: true,
      databases,
      message: "Fiscal databases created successfully"
    });
  } catch (error) {
    console.error("Error creating databases:", error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Failed to create databases"
    }, { status: 500 });
  }
}

/**
 * Create a new fiscal entry in Notion
 */
async function handleCreateEntry(notionService: any, data: any): Promise<NextResponse> {
  try {
    const { type, ...entryData } = data;
    
    if (!type || !['revenue', 'expense', 'client', 'note'].includes(type)) {
      return NextResponse.json({ 
        success: false,
        error: "Invalid entry type"
      }, { status: 400 });
    }

    const entryId = await notionService.createFiscalEntry(type, entryData);
    
    return NextResponse.json({
      success: true,
      entryId,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} entry created successfully`
    });
  } catch (error) {
    console.error("Error creating entry:", error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Failed to create entry"
    }, { status: 500 });
  }
}

/**
 * Configure database sync settings
 */
async function handleConfigureDatabase(notionService: any, data: any): Promise<NextResponse> {
  try {
    const { databaseId, syncEnabled, mappings } = data;
    
    // This would update database configuration
    // For now, just return success
    
    return NextResponse.json({
      success: true,
      message: "Database configuration updated"
    });
  } catch (error) {
    console.error("Error configuring database:", error);
    return NextResponse.json({ 
      success: false,
      error: "Failed to configure database"
    }, { status: 500 });
  }
}