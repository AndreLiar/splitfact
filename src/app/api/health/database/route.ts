// Free Database Health Check API Endpoint
// Access via: GET /api/health/database

import { NextRequest, NextResponse } from 'next/server';
import { dbHealthMonitor } from '@/lib/db-health';

export async function GET(request: NextRequest) {
  try {
    const health = await dbHealthMonitor.getHealthEndpoint();
    
    // Return appropriate HTTP status based on health
    const statusCode = health.status === 'critical' ? 503 : 
                      health.status === 'warning' ? 200 : 200;

    return NextResponse.json(health, { status: statusCode });
    
  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'critical',
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}

// Optional: Simple HTML status page for manual checking
export async function HEAD(request: NextRequest) {
  try {
    const health = await dbHealthMonitor.checkHealth();
    const statusCode = health.status === 'critical' ? 503 : 200;
    
    return new NextResponse(null, {
      status: statusCode,
      headers: {
        'X-Database-Status': health.status,
        'X-Response-Time': `${health.metrics.responseTime}ms`,
        'X-User-Count': health.metrics.userCount.toString(),
        'X-Last-Backup': health.metrics.lastBackup?.toISOString() || 'none'
      }
    });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}