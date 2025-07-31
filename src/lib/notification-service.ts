import { prisma } from '@/lib/prisma';

export interface NotificationData {
  userId: string;
  type: 'URSSAF_REMINDER' | 'TVA_THRESHOLD_WARNING' | 'TVA_THRESHOLD_EXCEEDED' | 'GENERAL';
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  maxAttempts?: number;
}

export interface NotificationResult {
  success: boolean;
  queueItemId?: string;
  notificationId?: string;
  error?: string;
}

export class NotificationService {
  private static readonly DEFAULT_MAX_ATTEMPTS = 5;
  private static readonly RETRY_DELAYS = [60, 300, 900, 3600, 7200]; // seconds: 1min, 5min, 15min, 1h, 2h

  private static calculateNextRetryAt(attemptCount: number): Date {
    const delaySeconds = this.RETRY_DELAYS[Math.min(attemptCount, this.RETRY_DELAYS.length - 1)];
    return new Date(Date.now() + delaySeconds * 1000);
  }

  static async queueNotification(data: NotificationData): Promise<NotificationResult> {
    try {
      console.log(`[NotificationService] Queueing notification for user ${data.userId}: ${data.title}`);
      
      const existingDuplicate = await this.checkForDuplicates(data);
      if (existingDuplicate) {
        console.log(`[NotificationService] Duplicate notification found, skipping: ${existingDuplicate.id}`);
        return {
          success: true,
          queueItemId: existingDuplicate.id,
          error: 'Duplicate notification prevented'
        };
      }

      const queueItem = await prisma.notificationQueue.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          actionUrl: data.actionUrl,
          metadata: data.metadata as any,
          maxAttempts: data.maxAttempts || this.DEFAULT_MAX_ATTEMPTS,
          status: 'PENDING',
          nextRetryAt: new Date()
        }
      });

      console.log(`[NotificationService] Notification queued with ID: ${queueItem.id}`);
      
      const processResult = await this.processQueueItem(queueItem.id);
      
      return {
        success: processResult.success,
        queueItemId: queueItem.id,
        notificationId: processResult.notificationId,
        error: processResult.error
      };

    } catch (error) {
      console.error('[NotificationService] Failed to queue notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async processQueueItem(queueItemId: string): Promise<NotificationResult> {
    try {
      const queueItem = await prisma.notificationQueue.findUnique({
        where: { id: queueItemId }
      });

      if (!queueItem) {
        return { success: false, error: 'Queue item not found' };
      }

      if (queueItem.status === 'COMPLETED') {
        return { 
          success: true, 
          queueItemId: queueItem.id,
          notificationId: queueItem.notificationId || undefined
        };
      }

      if (queueItem.attemptCount >= queueItem.maxAttempts) {
        await prisma.notificationQueue.update({
          where: { id: queueItemId },
          data: {
            status: 'FAILED',
            errorMessage: 'Maximum retry attempts exceeded'
          }
        });
        return { success: false, error: 'Maximum retry attempts exceeded' };
      }

      await prisma.notificationQueue.update({
        where: { id: queueItemId },
        data: { 
          status: 'PROCESSING',
          lastAttemptAt: new Date(),
          attemptCount: { increment: 1 }
        }
      });

      try {
        const notification = await prisma.notification.create({
          data: {
            userId: queueItem.userId,
            type: queueItem.type,
            title: queueItem.title,
            message: queueItem.message,
            actionUrl: queueItem.actionUrl,
            metadata: queueItem.metadata as any
          }
        });

        await prisma.notificationQueue.update({
          where: { id: queueItemId },
          data: {
            status: 'COMPLETED',
            processedAt: new Date(),
            notificationId: notification.id,
            errorMessage: null
          }
        });

        console.log(`[NotificationService] Successfully created notification ${notification.id} from queue item ${queueItemId}`);
        
        return {
          success: true,
          queueItemId: queueItem.id,
          notificationId: notification.id
        };

      } catch (createError) {
        const errorMessage = createError instanceof Error ? createError.message : 'Unknown error creating notification';
        console.error(`[NotificationService] Failed to create notification from queue item ${queueItemId}:`, createError);

        const nextRetryAt = queueItem.attemptCount < queueItem.maxAttempts - 1 
          ? this.calculateNextRetryAt(queueItem.attemptCount)
          : null;

        const newStatus = queueItem.attemptCount >= queueItem.maxAttempts - 1 ? 'FAILED' : 'PENDING';

        await prisma.notificationQueue.update({
          where: { id: queueItemId },
          data: {
            status: newStatus,
            errorMessage,
            nextRetryAt
          }
        });

        return {
          success: false,
          queueItemId: queueItem.id,
          error: errorMessage
        };
      }

    } catch (error) {
      console.error('[NotificationService] Error processing queue item:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async processRetryQueue(): Promise<{ processed: number; successful: number; failed: number }> {
    try {
      console.log('[NotificationService] Processing retry queue...');

      const pendingItems = await prisma.notificationQueue.findMany({
        where: {
          status: 'PENDING',
          nextRetryAt: { lte: new Date() }
        },
        orderBy: { nextRetryAt: 'asc' },
        take: 50 // Process max 50 items per run
      });

      // Filter out items that have exceeded max attempts
      const eligibleItems = pendingItems.filter((item: { attemptCount: number; maxAttempts: number }) => 
        item.attemptCount < item.maxAttempts
      );

      console.log(`[NotificationService] Found ${eligibleItems.length} eligible items to retry (${pendingItems.length} total pending)`);

      let successful = 0;
      let failed = 0;

      for (const item of eligibleItems) {
        const result = await this.processQueueItem(item.id);
        if (result.success) {
          successful++;
        } else {
          failed++;
        }
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`[NotificationService] Retry processing complete: ${successful} successful, ${failed} failed`);

      return {
        processed: eligibleItems.length,
        successful,
        failed
      };

    } catch (error) {
      console.error('[NotificationService] Error processing retry queue:', error);
      return { processed: 0, successful: 0, failed: 0 };
    }
  }

  private static async checkForDuplicates(data: NotificationData): Promise<{ id: string } | null> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    return await prisma.notificationQueue.findFirst({
      where: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        createdAt: {
          gte: startOfDay,
          lt: endOfDay
        },
        status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] }
      }
    });
  }

  static async cleanupOldQueue(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.notificationQueue.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          status: { in: ['COMPLETED', 'FAILED', 'CANCELLED'] }
        }
      });

      console.log(`[NotificationService] Cleaned up ${result.count} old queue items`);
      return result.count;

    } catch (error) {
      console.error('[NotificationService] Error cleaning up old queue items:', error);
      return 0;
    }
  }

  static async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    totalToday: number;
  }> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const [pending, processing, completed, failed, totalToday] = await Promise.all([
        prisma.notificationQueue.count({ where: { status: 'PENDING' } }),
        prisma.notificationQueue.count({ where: { status: 'PROCESSING' } }),
        prisma.notificationQueue.count({ where: { status: 'COMPLETED' } }),
        prisma.notificationQueue.count({ where: { status: 'FAILED' } }),
        prisma.notificationQueue.count({ where: { createdAt: { gte: startOfDay } } })
      ]);

      return { pending, processing, completed, failed, totalToday };

    } catch (error) {
      console.error('[NotificationService] Error getting queue stats:', error);
      return { pending: 0, processing: 0, completed: 0, failed: 0, totalToday: 0 };
    }
  }
}

export default NotificationService;