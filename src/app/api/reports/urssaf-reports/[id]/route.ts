import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string  }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;
  const { id: reportId } = await params;

  try {
    const report = await prisma.urssafReport.findFirst({
      where: {
        id: reportId,
        userId: userId,
      },
    });

    if (!report) {
      return new NextResponse('Report not found', { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error fetching URSSAF report:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}