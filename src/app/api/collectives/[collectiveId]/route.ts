import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: Promise<{ collectiveId: string  }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { collectiveId } = await params;

  try {
    const collective = await prisma.collective.findUnique({
      where: {
        id: collectiveId,
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        invoices: { // Include invoices associated with the collective
          include: {
            client: true, // Include client details for each invoice
          },
        },
      },
    });

    if (!collective) {
      return new NextResponse("Collective not found or you don't have access", { status: 404 });
    }

    return NextResponse.json(collective);
  } catch (error) {
    console.error("Error fetching collective details:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
