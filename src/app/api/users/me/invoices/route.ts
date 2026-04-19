import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";


export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const all = searchParams.get('all') === 'true';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;

  try {
    const userId = session.user.id;

    if (all) {
      // Fetch all invoices without pagination for revenue calculation
      const invoices = await prisma.invoice.findMany({
        where: {
          userId: userId,
        },
        include: {
          client: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json({ invoices, totalCount: invoices.length });
    }

    const [invoices, totalCount] = await prisma.$transaction([
      prisma.invoice.findMany({
        where: {
          userId: userId,
        },
        include: {
          client: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: skip,
      }),
      prisma.invoice.count({
        where: {
          userId: userId,
        },
      }),
    ]);

    return NextResponse.json({ invoices, totalCount });
  } catch (error) {
    console.error("Error fetching user invoices:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
