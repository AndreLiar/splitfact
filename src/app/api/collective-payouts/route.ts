import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const invoiceId = searchParams.get('invoiceId');

  try {
    const whereClause: {
      userId: string;
      invoiceId?: string;
    } = {
      userId: session.user.id
    };

    if (invoiceId) {
      whereClause.invoiceId = invoiceId;
    }

    const payouts = await prisma.collectivePayout.findMany({
      where: whereClause,
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            client: {
              select: {
                name: true
              }
            }
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(payouts);
  } catch (error: any) {
    console.error('Error fetching collective payouts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}