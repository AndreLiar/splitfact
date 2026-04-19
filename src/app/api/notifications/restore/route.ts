import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// POST /api/notifications/restore - Restore sample notifications for users who had them before
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Check if user already has notifications
    const existingCount = await prisma.notification.count({
      where: { userId: user.id }
    });

    // Only seed if user has no notifications at all
    if (existingCount === 0) {
      const sampleNotifications = [
        {
          userId: user.id,
          type: 'URSSAF_REMINDER' as const,
          title: 'Rappel déclaration URSSAF',
          message: 'Votre prochaine déclaration URSSAF est à venir. Vérifiez vos revenus à déclarer et anticipez le montant dû.',
          actionUrl: '/dashboard/invoices',
          metadata: {
            deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'monthly'
          }
        },
        {
          userId: user.id,
          type: 'TVA_THRESHOLD_WARNING' as const,
          title: 'Surveiller le seuil de franchise TVA',
          message: 'Pensez à surveiller votre chiffre d\'affaires annuel. Le seuil de franchise TVA est de 91 900 € (commercial) ou 36 800 € (services).',
          actionUrl: '/dashboard/invoices',
          metadata: {
            thresholdCommercial: 91900,
            thresholdServices: 36800,
          }
        },
        {
          userId: user.id,
          type: 'GENERAL' as const,
          title: 'Réforme e-invoicing 2026–2027',
          message: 'La facturation électronique obligatoire entre en vigueur dès 2026 pour les grandes entreprises et 2027 pour les PME. Vos factures doivent être au format Factur-X.',
          actionUrl: '/dashboard/invoices',
          metadata: {
            category: 'compliance'
          }
        }
      ];

      const createdNotifications = await prisma.notification.createMany({
        data: sampleNotifications
      });

      return NextResponse.json({
        success: true,
        message: `${createdNotifications.count} notifications restored`,
        count: createdNotifications.count
      });
    } else {
      return NextResponse.json({
        success: true,
        message: `User already has ${existingCount} notifications`,
        count: existingCount
      });
    }

  } catch (error) {
    console.error('Error restoring notifications:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}