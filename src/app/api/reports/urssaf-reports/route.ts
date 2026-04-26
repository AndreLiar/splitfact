import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { NextResponse } from 'next/server';
import { isPro } from '@/lib/subscription';


export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  if (!(await isPro(session.user.id))) {
    return NextResponse.json(
      { error: 'URSSAF reports require an InvoiceOps Pro plan.', upgrade: true },
      { status: 403 }
    );
  }

  const userId = session.user.id;

  try {
    const reports = await prisma.urssafReport.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        periodEndDate: 'desc',
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching URSSAF reports:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
