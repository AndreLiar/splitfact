// Cron job for smart Notion alerts generation
// Analyzes connected Notion workspaces to generate intelligent business alerts

import { NextRequest, NextResponse } from "next/server";
import { getSmartNotionAlerts } from "@/lib/smart-notion-alerts";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes timeout

export async function POST(request: NextRequest) {
  const headersList = await headers();
  
  // Verify cron secret
  const cronSecret = headersList.get('authorization');
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  console.log('[CronJob] Starting smart Notion alerts generation...');
  
  try {
    // Get all users with connected Notion accounts
    const users = await prisma.user.findMany({
      where: {
        // Add condition to check for Notion integration when you have the field
        // For now, get all users and check during processing
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    const smartAlerts = getSmartNotionAlerts();
    let totalAlertsGenerated = 0;
    let processedUsers = 0;

    for (const user of users) {
      try {
        console.log(`[SmartAlerts] Processing user ${user.id} (${user.name})`);
        
        // Generate smart alerts for this user
        const alerts = await smartAlerts.generateSmartAlerts(user.id);
        
        if (alerts.length > 0) {
          // Store alerts as notifications
          await smartAlerts.storeNotionAlerts(alerts);
          totalAlertsGenerated += alerts.length;
          console.log(`[SmartAlerts] Generated ${alerts.length} alerts for user ${user.id}`);
        }
        
        processedUsers++;
        
      } catch (userError) {
        console.warn(`[SmartAlerts] Failed to process user ${user.id}:`, userError);
      }
    }

    const response = {
      success: true,
      message: 'Smart Notion alerts generation completed',
      stats: {
        processedUsers,
        totalAlertsGenerated,
        averageAlertsPerUser: processedUsers > 0 ? (totalAlertsGenerated / processedUsers).toFixed(2) : 0
      },
      timestamp: new Date().toISOString(),
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    console.log('[CronJob] Smart Notion alerts generation completed:', response.stats);
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('[CronJob] Smart Notion alerts generation failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Smart alerts generation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Health check and manual trigger endpoint
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  if (action === 'trigger') {
    // Manual trigger for testing
    try {
      const smartAlerts = getSmartNotionAlerts();
      
      // Get first user for testing
      const testUser = await prisma.user.findFirst({
        select: { id: true, name: true }
      });
      
      if (!testUser) {
        return NextResponse.json(
          { error: 'No test user found' },
          { status: 404 }
        );
      }
      
      const alerts = await smartAlerts.generateSmartAlerts(testUser.id);
      
      return NextResponse.json({
        success: true,
        message: `Generated ${alerts.length} smart alerts for testing`,
        alerts: alerts.map(alert => ({
          type: alert.type,
          title: alert.title,
          severity: alert.severity,
          estimatedImpact: alert.estimatedImpact
        })),
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  }
  
  // Health check
  return NextResponse.json({
    status: 'healthy',
    service: 'smart-notion-alerts',
    features: [
      'Pattern-based alert detection',
      'AI-enhanced business insights',
      'Cross-platform data analysis',
      'Automated notification delivery'
    ],
    timestamp: new Date().toISOString()
  });
}