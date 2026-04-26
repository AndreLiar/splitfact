import { NextResponse } from "next/server";
import { NotificationService } from "@/domains/notifications/notification-service";

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const stats = await NotificationService.getQueueStats();
    const processResult = await NotificationService.processRetryQueue();
    const cleanupCount = await NotificationService.cleanupOldQueue(30);

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