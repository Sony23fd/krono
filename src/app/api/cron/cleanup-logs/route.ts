import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Vercel cron auth header
// This protects the endpoint so it can only be called by Vercel Cron or with a secret
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    // If CRON_SECRET is defined, verify it. 
    // Vercel sends `Bearer ${process.env.CRON_SECRET}` for cron jobs.
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Calculate cutoff date (30 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const result = await (db as any).activityLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    });

    console.log(`[Cron] Cleanup Activity Logs: Deleted ${result.count} old logs.`);

    // Log the action itself so we know the cron job ran successfully
    if (result.count > 0) {
      await (db as any).activityLog.create({
        data: {
          userId: "system",
          userName: "Cron Job",
          userRole: "SYSTEM",
          action: "DELETE_LOGS",
          target: "ActivityLog",
          detail: `Системийн автомат цэвэрлэгээгээр хуучирсан ${result.count} ширхэг логийг устгалаа.`,
        }
      });
    }

    return NextResponse.json({ success: true, count: result.count });
  } catch (error: any) {
    console.error('[Cron] Activity log cleanup failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clean up logs' },
      { status: 500 }
    );
  }
}
