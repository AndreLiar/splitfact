import { NextResponse } from "next/server";
import { NotificationService } from "@/lib/notification-service";

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    console.log('[Notification Retries Cron] Starting notification retry processing...');
    
    const stats = await NotificationService.getQueueStats();
    console.log('[Notification Retries Cron] Queue stats before processing:', stats);

    const processResult = await NotificationService.processRetryQueue();
    console.log(`[Notification Retries Cron] Processed ${processResult.processed} notifications: ${processResult.successful} successful, ${processResult.failed} failed`);

    const cleanupCount = await NotificationService.cleanupOldQueue(30);
    if (cleanupCount > 0) {
      console.log(`[Notification Retries Cron] Cleaned up ${cleanupCount} old queue items`);
    }

    const finalStats = await NotificationService.getQueueStats();

    return NextResponse.json({
      success: true,
      message: "Notification retry processing completed",
      results: {
        processed: processResult.processed,
        successful: processResult.successful,
        failed: processResult.failed,
        cleanedUp: cleanupCount
      },
      queueStats: {
        before: stats,
        after: finalStats
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Notification Retries Cron] Error processing notification retries:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}