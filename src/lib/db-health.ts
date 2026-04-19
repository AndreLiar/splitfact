// Free Database Health Monitoring for Splitfact
// No external dependencies, uses built-in Prisma

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DatabaseHealth {
  status: 'healthy' | 'warning' | 'critical';
  metrics: {
    connectionStatus: boolean;
    responseTime: number;
    userCount: number;
    invoiceCount: number;
    lastBackup?: Date;
    diskUsage?: string;
  };
  issues: string[];
}

export class DatabaseHealthMonitor {
  async checkHealth(): Promise<DatabaseHealth> {
    const startTime = Date.now();
    const issues: string[] = [];
    let connectionStatus = false;
    let userCount = 0;
    let invoiceCount = 0;

    try {
      // Test database connection and response time
      await prisma.$queryRaw`SELECT 1`;
      connectionStatus = true;
      
      // Get basic metrics
      [userCount, invoiceCount] = await Promise.all([
        prisma.user.count(),
        prisma.invoice.count()
      ]);

      const responseTime = Date.now() - startTime;

      // Check for potential issues
      if (responseTime > 5000) {
        issues.push(`Slow database response: ${responseTime}ms`);
      }

      if (userCount > 1000 && !process.env.DATABASE_BACKUP_ENABLED) {
        issues.push('Consider enabling paid backups with 1000+ users');
      }

      // Check for stale data
      const recentInvoices = await prisma.invoice.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      const status = this.determineStatus(issues, responseTime, connectionStatus);

      return {
        status,
        metrics: {
          connectionStatus,
          responseTime,
          userCount,
          invoiceCount,
          lastBackup: await this.getLastBackupDate(),
        },
        issues
      };

    } catch (error) {
      return {
        status: 'critical',
        metrics: {
          connectionStatus: false,
          responseTime: Date.now() - startTime,
          userCount: 0,
          invoiceCount: 0,
        },
        issues: [`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  private determineStatus(issues: string[], responseTime: number, connected: boolean): 'healthy' | 'warning' | 'critical' {
    if (!connected) return 'critical';
    if (issues.length > 0 || responseTime > 3000) return 'warning';
    return 'healthy';
  }

  private async getLastBackupDate(): Promise<Date | undefined> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const backupDir = path.join(process.cwd(), 'backups');
      if (!fs.existsSync(backupDir)) return undefined;

      const files = fs.readdirSync(backupDir)
        .filter(file => file.startsWith('splitfact_backup_') && file.endsWith('.sql.gz'))
        .map(file => ({
          file,
          date: fs.statSync(path.join(backupDir, file)).mtime
        }))
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      return files[0]?.date;
    } catch {
      return undefined;
    }
  }

  // Free health check endpoint
  async getHealthEndpoint() {
    const health = await this.checkHealth();
    
    return {
      timestamp: new Date().toISOString(),
      status: health.status,
      database: {
        connected: health.metrics.connectionStatus,
        responseTime: `${health.metrics.responseTime}ms`,
        users: health.metrics.userCount,
        invoices: health.metrics.invoiceCount,
        lastBackup: health.metrics.lastBackup?.toISOString() || 'No backups found'
      },
      issues: health.issues,
      recommendations: this.getRecommendations(health)
    };
  }

  private getRecommendations(health: DatabaseHealth): string[] {
    const recommendations: string[] = [];

    if (health.metrics.userCount > 100 && !health.metrics.lastBackup) {
      recommendations.push('Set up automated backups with growing user base');
    }

    if (health.metrics.responseTime > 2000) {
      recommendations.push('Consider database optimization or indexing');
    }

    if (health.metrics.userCount > 500) {
      recommendations.push('Consider upgrading to paid backup solution');
    }

    return recommendations;
  }
}

// Singleton instance
export const dbHealthMonitor = new DatabaseHealthMonitor();