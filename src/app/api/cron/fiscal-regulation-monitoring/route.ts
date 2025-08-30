// Cron job for automatic fiscal regulation monitoring
// Runs daily to check for new fiscal regulations and generate alerts

import { NextRequest, NextResponse } from "next/server";
import { getFiscalRegulationMonitor } from "@/lib/fiscal-regulation-monitor";
import { headers } from "next/headers";

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes timeout for monitoring

export async function POST(request: NextRequest) {
  const headersList = await headers();
  
  // Verify cron secret to prevent unauthorized access
  const cronSecret = headersList.get('authorization');
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  console.log('[CronJob] Starting fiscal regulation monitoring...');
  
  try {
    const monitor = getFiscalRegulationMonitor();
    
    // Run the monitoring cycle
    await monitor.runMonitoringCycle();
    
    const response = {
      success: true,
      message: 'Fiscal regulation monitoring completed successfully',
      timestamp: new Date().toISOString(),
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Next 24 hours
    };

    console.log('[CronJob] Fiscal regulation monitoring completed successfully');
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('[CronJob] Fiscal regulation monitoring failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Monitoring failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    const monitor = getFiscalRegulationMonitor();
    const config = await monitor.getMonitoringConfig('system');
    
    return NextResponse.json({
      status: 'healthy',
      service: 'fiscal-regulation-monitoring',
      config: {
        enabled: config.enabled,
        intervalHours: config.checkIntervalHours,
        sources: Object.keys(config.sources).filter(key => config.sources[key as keyof typeof config.sources])
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}